from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)

    # Contact data
    email = Column(String, nullable=False, index=True)
    data = Column(JSON, nullable=False)  # All CSV columns stored as JSON


    # Status
    is_sent = Column(Boolean, default=False)
    is_failed = Column(Boolean, default=False)
    is_bounced = Column(Boolean, default=False)
    unsubscribed = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="contacts")

    def __repr__(self):
        return f"<Contact {self.email}>"
