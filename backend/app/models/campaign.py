from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.core.database import Base

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    STOPPED = "stopped"
    FAILED = "failed"

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Campaign details
    name = Column(String, nullable=False)
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT)

    # Template
    template_subject = Column(String, nullable=False)
    template_body = Column(Text, nullable=False)
    template_html = Column(Text, nullable=True)

    # Column mapping (JSON: {placeholder: column_name})
    column_mapping = Column(JSON, nullable=True)

    # Statistics
    total_contacts = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    bounced_count = Column(Integer, default=0)

    # Attachments (JSON array of file paths)
    attachments = Column(JSON, nullable=True)

    # Configuration
    daily_limit = Column(Integer, default=100)
    delay_min = Column(Integer, default=30)
    delay_max = Column(Integer, default=90)

    # Scheduling
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    paused_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="campaigns")
    contacts = relationship("Contact", back_populates="campaign", cascade="all, delete-orphan")
    email_logs = relationship("EmailLog", back_populates="campaign", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Campaign {self.name} - {self.status}>"
