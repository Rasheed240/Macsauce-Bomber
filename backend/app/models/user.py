from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    gmail_address = Column(String, unique=True, index=True, nullable=False)
    oauth_token = Column(Text, nullable=True)  # Encrypted
    oauth_refresh_token = Column(Text, nullable=True)  # Encrypted
    token_expiry = Column(DateTime, nullable=True)

    # User preferences
    daily_send_limit = Column(Integer, default=100)
    min_delay = Column(Integer, default=30)
    max_delay = Column(Integer, default=90)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    campaigns = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.gmail_address}>"
