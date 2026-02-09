from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()
auth_service = AuthService()

class AuthStatusResponse(BaseModel):
    connected: bool
    email: str | None = None
    daily_limit: int | None = None

class DisconnectResponse(BaseModel):
    success: bool
    message: str

@router.get("/google")
async def google_oauth_init():
    """Initiate Google OAuth flow"""
    try:
        authorization_url, state = auth_service.get_authorization_url()
        return {
            "authorization_url": authorization_url,
            "state": state
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth: {str(e)}"
        )

@router.get("/callback")
async def google_oauth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for tokens
        tokens = auth_service.exchange_code_for_tokens(code, state)

        # Get user email
        email = auth_service.get_user_email(tokens["access_token"])

        # Create or update user
        user = auth_service.create_or_update_user(
            db=db,
            email=email,
            access_token=tokens["access_token"],
            refresh_token=tokens.get("refresh_token"),
            token_expiry=tokens["token_expiry"]
        )

        # Redirect to frontend with success
        return RedirectResponse(
            url=f"{settings.FRONTEND_BASE_URL}/settings?auth=success&email={email}",
            status_code=status.HTTP_302_FOUND
        )

    except Exception as e:
        # Redirect to frontend with error
        return RedirectResponse(
            url=f"{settings.FRONTEND_BASE_URL}/settings?auth=error&message={str(e)}",
            status_code=status.HTTP_302_FOUND
        )

@router.get("/status", response_model=AuthStatusResponse)
async def get_auth_status(
    email: str,
    db: Session = Depends(get_db)
):
    """Check if user's Gmail is connected"""
    user = db.query(User).filter(User.gmail_address == email).first()

    if not user or not user.oauth_token:
        return AuthStatusResponse(connected=False)

    return AuthStatusResponse(
        connected=True,
        email=user.gmail_address,
        daily_limit=user.daily_send_limit
    )

@router.delete("/disconnect", response_model=DisconnectResponse)
async def disconnect_gmail(
    email: str,
    db: Session = Depends(get_db)
):
    """Disconnect user's Gmail account"""
    user = db.query(User).filter(User.gmail_address == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    success = auth_service.disconnect_user(db, user.id)

    if success:
        return DisconnectResponse(
            success=True,
            message="Gmail account disconnected successfully"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect Gmail account"
        )
