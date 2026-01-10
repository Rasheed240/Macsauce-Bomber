from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.core.database import Base

class EmailStatus(str, Enum):
    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)

    # Email details
    recipient_email = Column(String, nullable=False, index=True)
    subject = Column(String, nullable=True)
    status = Column(SQLEnum(EmailStatus), default=EmailStatus.PENDING)

    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # Gmail message ID
    gmail_message_id = Column(String, nullable=True)

    # Timestamps
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="email_logs")

    def __repr__(self):
        return f"<EmailLog {self.recipient_email} - {self.status}>"
