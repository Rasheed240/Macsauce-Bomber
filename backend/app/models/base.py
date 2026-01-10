from app.core.database import Base

# Import all models here so they are registered with SQLAlchemy
from app.models.user import User
from app.models.campaign import Campaign
from app.models.email_log import EmailLog
from app.models.template import Template
from app.models.contact import Contact
