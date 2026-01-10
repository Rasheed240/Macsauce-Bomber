from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Template details
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    html_body = Column(Text, nullable=True)

    # Metadata
    category = Column(String, nullable=True)  # e.g., "sales", "job_application", "outreach"
    is_public = Column(Integer, default=0)  # For shared templates
    use_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="templates")

    def __repr__(self):
        return f"<Template {self.name}>"
