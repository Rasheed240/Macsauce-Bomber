from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.email_log import EmailLog, EmailStatus
from app.models.campaign import Campaign
from app.models.user import User
from app.services.gmail_service import GmailService
from app.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

class SendTestEmailRequest(BaseModel):
    user_email: str
    to: str
    subject: str
    body: str
    html_body: str | None = None

class EmailLogResponse(BaseModel):
    id: int
    campaign_id: int
    recipient_email: str
    subject: str | None
    status: str
    error_message: str | None
    sent_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_sent: int
    total_failed: int
    total_bounced: int
    sent_today: int
    sent_this_week: int
    success_rate: float

@router.post("/test")
async def send_test_email(
    request: SendTestEmailRequest,
    db: Session = Depends(get_db)
):
    """Send a test email"""
    # Get user
    user = db.query(User).filter(User.gmail_address == request.user_email).first()
    if not user or not user.oauth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Gmail not connected. Please connect your Gmail account."
        )

    # Get credentials
    credentials = auth_service.get_user_credentials(user)

    # Create Gmail service
    gmail_service = GmailService(credentials)

    # Send email
    result = gmail_service.send_email(
        to=request.to,
        subject=request.subject,
        body=request.body,
        html_body=request.html_body
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {result.get('error', 'Unknown error')}"
        )

    return {
        "success": True,
        "message": "Test email sent successfully",
        "message_id": result["message_id"]
    }

@router.get("/logs", response_model=List[EmailLogResponse])
async def get_email_logs(
    campaign_id: int | None = None,
    status_filter: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get email logs"""
    query = db.query(EmailLog)

    if campaign_id:
        query = query.filter(EmailLog.campaign_id == campaign_id)

    if status_filter:
        query = query.filter(EmailLog.status == status_filter)

    logs = query.order_by(EmailLog.created_at.desc()).offset(offset).limit(limit).all()

    return logs

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    user_email: str,
    db: Session = Depends(get_db)
):
    """Get email sending statistics"""
    user = db.query(User).filter(User.gmail_address == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get all campaigns for user
    campaigns = db.query(Campaign).filter(Campaign.user_id == user.id).all()
    campaign_ids = [c.id for c in campaigns]

    # Total stats
    total_sent = db.query(EmailLog).filter(
        EmailLog.campaign_id.in_(campaign_ids),
        EmailLog.status == EmailStatus.SENT
    ).count()

    total_failed = db.query(EmailLog).filter(
        EmailLog.campaign_id.in_(campaign_ids),
        EmailLog.status == EmailStatus.FAILED
    ).count()

    total_bounced = db.query(EmailLog).filter(
        EmailLog.campaign_id.in_(campaign_ids),
        EmailLog.status == EmailStatus.BOUNCED
    ).count()

    # Today's stats
    today = datetime.utcnow().date()
    sent_today = db.query(EmailLog).filter(
        EmailLog.campaign_id.in_(campaign_ids),
        EmailLog.status == EmailStatus.SENT,
        EmailLog.sent_at >= today
    ).count()

    # This week's stats
    week_ago = datetime.utcnow() - timedelta(days=7)
    sent_this_week = db.query(EmailLog).filter(
        EmailLog.campaign_id.in_(campaign_ids),
        EmailLog.status == EmailStatus.SENT,
        EmailLog.sent_at >= week_ago
    ).count()

    # Success rate
    total_attempts = total_sent + total_failed
    success_rate = (total_sent / total_attempts * 100) if total_attempts > 0 else 0

    return StatsResponse(
        total_sent=total_sent,
        total_failed=total_failed,
        total_bounced=total_bounced,
        sent_today=sent_today,
        sent_this_week=sent_this_week,
        success_rate=round(success_rate, 2)
    )
