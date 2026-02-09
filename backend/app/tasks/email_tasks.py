"""
Celery tasks for email sending operations
"""
import time
import random
from datetime import datetime
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session

from .celery_app import celery_app
from app.core.database import SessionLocal
from app.models.campaign import Campaign, CampaignStatus
from app.models.contact import Contact
from app.models.email_log import EmailLog, EmailStatus
from app.models.user import User
from app.services.gmail_service import GmailService
from app.services.auth_service import AuthService
from app.services.template_service import render_email


class DatabaseTask(Task):
    """Base task with database session management"""
    _db = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(bind=True, base=DatabaseTask, name='app.tasks.email_tasks.send_campaign_emails')
def send_campaign_emails(self, campaign_id: int) -> Dict[str, Any]:
    """
    Send emails for a campaign asynchronously.

    Args:
        campaign_id: ID of the campaign to send

    Returns:
        Dict with campaign sending results
    """
    db = self.db

    try:
        # Get campaign
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return {'error': 'Campaign not found', 'campaign_id': campaign_id}

        # Get user
        user = db.query(User).filter(User.id == campaign.user_id).first()
        if not user:
            return {'error': 'User not found', 'campaign_id': campaign_id}

        # Update campaign status
        campaign.status = CampaignStatus.RUNNING
        campaign.started_at = datetime.utcnow()
        db.commit()

        # Get Gmail credentials
        auth_service = AuthService()
        credentials = auth_service.get_user_credentials(user)
        gmail_service = GmailService(credentials)

        # Test Gmail connection
        if not gmail_service.test_connection():
            campaign.status = CampaignStatus.FAILED
            db.commit()
            return {'error': 'Gmail connection failed', 'campaign_id': campaign_id}

        # Get unsent contacts
        contacts = db.query(Contact).filter(
            Contact.campaign_id == campaign_id,
            Contact.is_sent == False,
            Contact.is_failed == False,
            Contact.unsubscribed == False
        ).all()

        sent_count = 0
        failed_count = 0

        # Send emails
        for contact in contacts:
            # Check if task is being stopped
            if self.request.id and celery_app.control.revoke(self.request.id, terminate=False):
                break

            try:
                # Prepare data for rendering
                mapped_data = {}
                for placeholder, column in campaign.column_mapping.items():
                    mapped_data[placeholder] = contact.data.get(column, '')

                # Add unsubscribe link
                mapped_data['unsubscribe_link'] = f"http://localhost:3000/unsubscribe/{contact.id}"

                # Render email
                rendered = render_email(
                    campaign.template_subject,
                    campaign.template_body,
                    mapped_data,
                    campaign.template_html
                )

                # Send email with attachments
                result = gmail_service.send_email(
                    to=contact.email,
                    subject=rendered['subject'],
                    body=rendered['body'],
                    html_body=rendered.get('html_body'),
                    attachment_paths=campaign.attachments
                )

                if result.get('success'):
                    # Mark as sent
                    contact.is_sent = True
                    campaign.sent_count += 1
                    sent_count += 1

                    # Create email log
                    email_log = EmailLog(
                        campaign_id=campaign.id,
                        recipient_email=contact.email,
                        subject=rendered['subject'],
                        status=EmailStatus.SENT,
                        gmail_message_id=result.get('message_id'),
                        sent_at=datetime.utcnow()
                    )
                    db.add(email_log)
                else:
                    # Mark as failed
                    contact.is_failed = True
                    campaign.failed_count += 1
                    failed_count += 1

                    # Create email log
                    email_log = EmailLog(
                        campaign_id=campaign.id,
                        recipient_email=contact.email,
                        subject=rendered['subject'],
                        status=EmailStatus.FAILED,
                        error_message=result.get('error', 'Unknown error')
                    )
                    db.add(email_log)

                db.commit()

                # Delay between emails
                if sent_count < len(contacts):
                    delay = random.uniform(campaign.delay_min, campaign.delay_max)
                    time.sleep(delay)

            except Exception as e:
                # Mark contact as failed
                contact.is_failed = True
                campaign.failed_count += 1
                failed_count += 1

                email_log = EmailLog(
                    campaign_id=campaign.id,
                    recipient_email=contact.email,
                    subject=campaign.template_subject,
                    status=EmailStatus.FAILED,
                    error_message=str(e)
                )
                db.add(email_log)
                db.commit()

        # Update campaign status
        campaign.status = CampaignStatus.COMPLETED
        campaign.completed_at = datetime.utcnow()
        db.commit()

        return {
            'success': True,
            'campaign_id': campaign_id,
            'sent': sent_count,
            'failed': failed_count,
            'total': len(contacts)
        }

    except Exception as e:
        # Mark campaign as failed
        if campaign:
            campaign.status = CampaignStatus.FAILED
            db.commit()

        return {
            'success': False,
            'error': str(e),
            'campaign_id': campaign_id
        }


@celery_app.task(name='app.tasks.email_tasks.check_scheduled_campaigns')
def check_scheduled_campaigns():
    """
    Check for scheduled campaigns that need to be started.
    This task runs periodically via Celery Beat.
    """
    db = SessionLocal()

    try:
        now = datetime.utcnow()

        # Find scheduled campaigns that should start
        campaigns = db.query(Campaign).filter(
            Campaign.status == CampaignStatus.SCHEDULED,
            Campaign.scheduled_at <= now
        ).all()

        for campaign in campaigns:
            # Start campaign
            send_campaign_emails.delay(campaign.id)

        return {
            'success': True,
            'campaigns_started': len(campaigns)
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
    finally:
        db.close()


@celery_app.task(name='app.tasks.email_tasks.pause_campaign')
def pause_campaign(campaign_id: int) -> Dict[str, Any]:
    """
    Pause a running campaign.

    Args:
        campaign_id: ID of the campaign to pause

    Returns:
        Dict with pause results
    """
    db = SessionLocal()

    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return {'error': 'Campaign not found', 'campaign_id': campaign_id}

        campaign.status = CampaignStatus.PAUSED
        db.commit()

        return {
            'success': True,
            'campaign_id': campaign_id,
            'status': 'paused'
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'campaign_id': campaign_id
        }
    finally:
        db.close()


@celery_app.task(name='app.tasks.email_tasks.resume_campaign')
def resume_campaign(campaign_id: int) -> Dict[str, Any]:
    """
    Resume a paused campaign.

    Args:
        campaign_id: ID of the campaign to resume

    Returns:
        Dict with resume results
    """
    db = SessionLocal()

    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return {'error': 'Campaign not found', 'campaign_id': campaign_id}

        if campaign.status != CampaignStatus.PAUSED:
            return {'error': 'Campaign is not paused', 'campaign_id': campaign_id}

        # Resume by starting the send task again
        send_campaign_emails.delay(campaign_id)

        return {
            'success': True,
            'campaign_id': campaign_id,
            'status': 'resumed'
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'campaign_id': campaign_id
        }
    finally:
        db.close()


# Alias for backward compatibility
start_campaign_sending = send_campaign_emails
