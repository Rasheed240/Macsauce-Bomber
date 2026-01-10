"""
Celery tasks for asynchronous email sending
"""

from .celery_app import celery_app
from .email_tasks import send_campaign_emails

__all__ = ['celery_app', 'send_campaign_emails']
