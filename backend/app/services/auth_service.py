from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import base64
from datetime import datetime

from app.core.config import settings
from app.models.user import User

class AuthService:
    def __init__(self):
        self.encryption_key = self._get_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)

    def _get_encryption_key(self):
        """Get or generate encryption key"""
        key = settings.ENCRYPTION_KEY.encode()
        # Ensure key is proper length for Fernet (32 url-safe base64-encoded bytes)
        return base64.urlsafe_b64encode(key.ljust(32)[:32])

    def encrypt_token(self, token: str) -> str:
        """Encrypt OAuth token"""
        return self.cipher_suite.encrypt(token.encode()).decode()

    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt OAuth token"""
        return self.cipher_suite.decrypt(encrypted_token.encode()).decode()

    def create_oauth_flow(self) -> Flow:
        """Create Google OAuth flow"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                }
            },
            scopes=settings.GMAIL_SCOPES,
        )
        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        return flow

    def get_authorization_url(self) -> tuple[str, str]:
        """Get OAuth authorization URL"""
        flow = self.create_oauth_flow()
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        return authorization_url, state

    def exchange_code_for_tokens(self, code: str, state: str) -> dict:
        """Exchange authorization code for tokens"""
        flow = self.create_oauth_flow()
        flow.fetch_token(code=code)

        credentials = flow.credentials

        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry,
            "scopes": credentials.scopes
        }

    def get_user_email(self, access_token: str) -> str:
        """Get user email from Gmail API"""
        credentials = Credentials(token=access_token)
        service = build('gmail', 'v1', credentials=credentials)
        profile = service.users().getProfile(userId='me').execute()
        return profile['emailAddress']

    def create_or_update_user(
        self,
        db: Session,
        email: str,
        access_token: str,
        refresh_token: str,
        token_expiry: datetime
    ) -> User:
        """Create or update user in database"""
        user = db.query(User).filter(User.gmail_address == email).first()

        encrypted_access = self.encrypt_token(access_token)
        encrypted_refresh = self.encrypt_token(refresh_token) if refresh_token else None

        if user:
            user.oauth_token = encrypted_access
            user.oauth_refresh_token = encrypted_refresh
            user.token_expiry = token_expiry
            user.updated_at = datetime.utcnow()
        else:
            user = User(
                gmail_address=email,
                oauth_token=encrypted_access,
                oauth_refresh_token=encrypted_refresh,
                token_expiry=token_expiry
            )
            db.add(user)

        db.commit()
        db.refresh(user)
        return user

    def get_user_credentials(self, user: User) -> Credentials:
        """Get decrypted credentials for user"""
        access_token = self.decrypt_token(user.oauth_token)
        refresh_token = self.decrypt_token(user.oauth_refresh_token) if user.oauth_refresh_token else None

        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=settings.GMAIL_SCOPES
        )

        return credentials

    def disconnect_user(self, db: Session, user_id: int) -> bool:
        """Disconnect user's Gmail account"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.oauth_token = None
            user.oauth_refresh_token = None
            user.token_expiry = None
            db.commit()
            return True
        return False
