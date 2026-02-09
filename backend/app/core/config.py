from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Macsauce Bomber"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    BACKEND_BASE_URL: str
    FRONTEND_BASE_URL: str

    # Database
    DATABASE_URL: str
    DATABASE_URL_ASYNC: str

    # Redis
    REDIS_URL: str
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # Security
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback"

    # Gmail API
    GMAIL_SCOPES: List[str] = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly"
    ]

    # Email Sending Limits
    MAX_DAILY_EMAILS: int = 500
    MIN_EMAIL_DELAY: int = 30  # seconds
    MAX_EMAIL_DELAY: int = 90  # seconds
    DEFAULT_DAILY_LIMIT: int = 100

    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_FILE_TYPES: List[str] = [".csv", ".xlsx", ".xls", ".json"]

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    TEMPLATES_DIR: Path = BASE_DIR / "templates"

    class Config:
        env_file = Path(__file__).resolve().parent.parent.parent.parent / ".env"
        case_sensitive = True

settings = Settings()

# Create directories if they don't exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
