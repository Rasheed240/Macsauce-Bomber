from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import os
import uuid
from pathlib import Path

from app.core.database import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.contact import Contact
from app.models.user import User
from app.models.email_log import EmailLog, EmailStatus
from app.services.template_service import TemplateService
from app.services.gmail_service import GmailService
from app.services.auth_service import AuthService
from app.tasks.email_tasks import start_campaign_sending
import time
import random

router = APIRouter()
template_service = TemplateService()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/attachments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class CreateCampaignRequest(BaseModel):
    user_email: str
    name: str
    template_subject: str
    template_body: str
    template_html: str | None = None
    contacts: List[Dict[str, Any]]
    column_mapping: Dict[str, str]
    email_column: str
    daily_limit: int = 100
    delay_min: int = 30
    delay_max: int = 90
    scheduled_at: datetime | None = None
    attachments: List[str] | None = None

class UpdateCampaignRequest(BaseModel):
    name: str | None = None
    template_subject: str | None = None
    template_body: str | None = None
    template_html: str | None = None
    column_mapping: Dict[str, str] | None = None
    daily_limit: int | None = None
    delay_min: int | None = None
    delay_max: int | None = None
    scheduled_at: datetime | None = None

class CampaignResponse(BaseModel):
    id: int
    name: str
    status: str
    template_subject: str
    template_body: str
    total_contacts: int
    sent_count: int
    failed_count: int
    bounced_count: int
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    scheduled_at: datetime | None
    attachments: List[str] | None = None

    class Config:
        from_attributes = True

class CampaignListResponse(BaseModel):
    campaigns: List[CampaignResponse]
    total: int

@router.post("", response_model=CampaignResponse)
async def create_campaign(
    request: CreateCampaignRequest,
    db: Session = Depends(get_db)
):
    """Create a new campaign"""
    # Get user
    user = db.query(User).filter(User.gmail_address == request.user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please connect your Gmail account first."
        )

    # Validate template
    validation = template_service.validate_template(
        request.template_subject,
        request.template_body
    )

    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Invalid template", "errors": validation["errors"]}
        )

    # Check for unmapped placeholders
    unmapped = template_service.check_unmapped_placeholders(
        set(validation["placeholders"]),
        request.column_mapping
    )

    if unmapped:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unmapped placeholders: {', '.join(unmapped)}"
        )

    # Create campaign

    # Determine status based on scheduled_at
    now = datetime.utcnow()
    if request.scheduled_at and request.scheduled_at > now:
        campaign_status = CampaignStatus.SCHEDULED
    else:
        campaign_status = CampaignStatus.DRAFT

    campaign = Campaign(
        user_id=user.id,
        name=request.name,
        status=campaign_status,
        template_subject=request.template_subject,
        template_body=request.template_body,
        template_html=request.template_html,
        column_mapping=request.column_mapping,
        total_contacts=len(request.contacts),
        daily_limit=request.daily_limit,
        delay_min=request.delay_min,
        delay_max=request.delay_max,
        scheduled_at=request.scheduled_at,
        attachments=request.attachments
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Add contacts
    for contact_data in request.contacts:
        contact = Contact(
            campaign_id=campaign.id,
            email=contact_data.get(request.email_column),
            data=contact_data
        )
        db.add(contact)

    db.commit()

    return campaign

@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    user_email: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all campaigns for a user"""
    user = db.query(User).filter(User.gmail_address == user_email).first()
    if not user:
        return CampaignListResponse(campaigns=[], total=0)

    query = db.query(Campaign).filter(Campaign.user_id == user.id)
    total = query.count()

    campaigns = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()

    return CampaignListResponse(
        campaigns=campaigns,
        total=total
    )

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    return campaign

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: int,
    request: UpdateCampaignRequest,
    db: Session = Depends(get_db)
):
    """Update a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    # Only allow updates if campaign is in DRAFT status
    if campaign.status != CampaignStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update campaign that is not in DRAFT status"
        )

    # Update fields

    if request.name:
        campaign.name = request.name
    if request.template_subject:
        campaign.template_subject = request.template_subject
    if request.template_body:
        campaign.template_body = request.template_body
    if request.template_html is not None:
        campaign.template_html = request.template_html
    if request.column_mapping:
        campaign.column_mapping = request.column_mapping
    if request.daily_limit:
        campaign.daily_limit = request.daily_limit
    if request.delay_min:
        campaign.delay_min = request.delay_min
    if request.delay_max:
        campaign.delay_max = request.delay_max
    if request.scheduled_at is not None:
        campaign.scheduled_at = request.scheduled_at
        # Update status if scheduled_at is in the future
        now = datetime.utcnow()
        if campaign.scheduled_at and campaign.scheduled_at > now:
            campaign.status = CampaignStatus.SCHEDULED
        else:
            campaign.status = CampaignStatus.DRAFT

    campaign.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(campaign)

    return campaign

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """Delete a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    db.delete(campaign)
    db.commit()

    return {"success": True, "message": "Campaign deleted"}

@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """Start sending emails for a campaign in background (requires Redis/Celery)"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status == CampaignStatus.RUNNING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is already running"
        )

    # Update campaign status
    campaign.status = CampaignStatus.RUNNING
    campaign.started_at = datetime.utcnow()
    db.commit()

    # Start sending task (async with Celery)
    try:
        start_campaign_sending.delay(campaign_id)
        return {"success": True, "message": "Campaign started in background", "campaign_id": campaign_id}
    except Exception as e:
        campaign.status = CampaignStatus.DRAFT
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start background task. Is Redis running? Error: {str(e)}"
        )

@router.post("/{campaign_id}/start-now")
async def start_campaign_now(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """Start sending emails immediately (synchronous, no Redis/Celery needed)"""
    auth_service = AuthService()

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status == CampaignStatus.RUNNING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is already running"
        )

    # Get user
    user = db.query(User).filter(User.id == campaign.user_id).first()
    if not user or not user.oauth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Gmail not connected. Please connect your Gmail account."
        )

    # Get credentials
    credentials = auth_service.get_user_credentials(user)

    # Create Gmail service
    gmail_service = GmailService(credentials)

    # Test connection
    if not gmail_service.test_connection():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gmail connection failed"
        )

    # Update campaign status
    campaign.status = CampaignStatus.RUNNING
    campaign.started_at = datetime.utcnow()
    db.commit()

    # Get unsent contacts
    contacts = db.query(Contact).filter(
        Contact.campaign_id == campaign_id,
        Contact.is_sent == False,
        Contact.is_failed == False,
        Contact.unsubscribed == False
    ).all()

    sent_count = 0
    failed_count = 0

    try:
        for contact in contacts:
            # Map contact data to placeholders
            mapped_data = {}
            for placeholder, column in campaign.column_mapping.items():
                mapped_data[placeholder] = contact.data.get(column, "")

            # Add unsubscribe link
            from app.core.config import settings
            mapped_data["unsubscribe_link"] = f"{settings.FRONTEND_BASE_URL}/unsubscribe/{contact.id}"

            # Render email
            try:
                rendered = template_service.render_email(
                    campaign.template_subject,
                    campaign.template_body,
                    mapped_data,
                    campaign.template_html
                )

                # Send email with attachments
                result = gmail_service.send_email(
                    to=contact.email,
                    subject=rendered["subject"],
                    body=rendered["body"],
                    html_body=rendered.get("html_body"),
                    attachment_paths=campaign.attachments
                )

                if result["success"]:
                    # Log success
                    email_log = EmailLog(
                        campaign_id=campaign_id,
                        recipient_email=contact.email,
                        subject=rendered["subject"],
                        status=EmailStatus.SENT,
                        gmail_message_id=result.get("message_id"),
                        sent_at=datetime.utcnow()
                    )
                    db.add(email_log)

                    # Update contact
                    contact.is_sent = True

                    # Update campaign
                    campaign.sent_count += 1
                    sent_count += 1

                else:
                    # Log failure
                    email_log = EmailLog(
                        campaign_id=campaign_id,
                        recipient_email=contact.email,
                        subject=rendered["subject"],
                        status=EmailStatus.FAILED,
                        error_message=result.get("error", "Unknown error")
                    )
                    db.add(email_log)

                    # Update contact
                    contact.is_failed = True

                    # Update campaign
                    campaign.failed_count += 1
                    failed_count += 1

                db.commit()

            except Exception as e:
                # Log error
                email_log = EmailLog(
                    campaign_id=campaign_id,
                    recipient_email=contact.email,
                    status=EmailStatus.FAILED,
                    error_message=str(e)
                )
                db.add(email_log)

                contact.is_failed = True
                campaign.failed_count += 1
                failed_count += 1

                db.commit()

            # Delay between emails
            if sent_count + failed_count < len(contacts):
                delay = random.randint(campaign.delay_min, campaign.delay_max)
                time.sleep(delay)

        # Mark campaign as completed
        if campaign.sent_count + campaign.failed_count >= campaign.total_contacts:
            campaign.status = CampaignStatus.COMPLETED
            campaign.completed_at = datetime.utcnow()
        else:
            campaign.status = CampaignStatus.PAUSED

        db.commit()

        return {
            "success": True,
            "message": "Campaign completed",
            "sent": sent_count,
            "failed": failed_count,
            "total": len(contacts)
        }

    except Exception as e:
        campaign.status = CampaignStatus.FAILED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Campaign failed: {str(e)}"
        )

@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """Pause a running campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status != CampaignStatus.RUNNING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only pause running campaigns"
        )

    campaign.status = CampaignStatus.PAUSED
    campaign.paused_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Campaign paused"}

@router.post("/{campaign_id}/stop")
async def stop_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """Stop a campaign permanently"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status not in [CampaignStatus.RUNNING, CampaignStatus.PAUSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only stop running or paused campaigns"
        )

    campaign.status = CampaignStatus.STOPPED
    campaign.completed_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Campaign stopped"}

@router.post("/upload-attachment")
async def upload_attachment(
    file: UploadFile = File(...)
):
    """Upload an attachment file for email campaigns"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        return {
            "success": True,
            "filename": file.filename,
            "file_path": str(file_path.absolute()),
            "size": len(content)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.delete("/attachment/{filename}")
async def delete_attachment(filename: str):
    """Delete an uploaded attachment"""
    try:
        # Find file in upload directory
        file_path = None
        for f in UPLOAD_DIR.iterdir():
            if f.name == filename or str(f).endswith(filename):
                file_path = f
                break

        if not file_path or not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        # Delete file
        os.remove(file_path)

        return {"success": True, "message": "File deleted"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
