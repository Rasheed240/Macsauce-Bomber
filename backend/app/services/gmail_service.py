from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
from typing import Dict, Any

from app.core.config import settings

class GmailService:
    def __init__(self, credentials: Credentials):
        self.credentials = credentials
        self.service = build('gmail', 'v1', credentials=credentials)

    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: str | None = None
    ) -> Dict[str, Any]:
        """Send an email via Gmail API"""
        try:
            # Create message
            if html_body:
                message = MIMEMultipart('alternative')
                message['to'] = to
                message['subject'] = subject

                # Add plain text part
                part1 = MIMEText(body, 'plain')
                message.attach(part1)

                # Add HTML part
                part2 = MIMEText(html_body, 'html')
                message.attach(part2)
            else:
                message = MIMEText(body)
                message['to'] = to
                message['subject'] = subject

            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')

            # Send message
            sent_message = self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()

            return {
                "success": True,
                "message_id": sent_message['id'],
                "thread_id": sent_message.get('threadId')
            }

        except HttpError as error:
            error_details = error.error_details if hasattr(error, 'error_details') else str(error)
            return {
                "success": False,
                "error": str(error),
                "error_details": error_details
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_profile(self) -> Dict[str, Any]:
        """Get Gmail profile information"""
        try:
            profile = self.service.users().getProfile(userId='me').execute()
            return {
                "success": True,
                "email": profile['emailAddress'],
                "messages_total": profile.get('messagesTotal', 0),
                "threads_total": profile.get('threadsTotal', 0)
            }

        except HttpError as error:
            return {
                "success": False,
                "error": str(error)
            }

    def check_quota(self) -> Dict[str, Any]:
        """Check Gmail sending quota (approximate)"""
        try:
            # Gmail API doesn't directly expose quota info
            # This is an approximation based on Google Workspace limits
            profile = self.get_profile()

            if not profile["success"]:
                return profile

            # Standard Gmail: 500/day, Google Workspace: 2000/day
            # We can't detect this programmatically, so we use conservative estimate
            return {
                "success": True,
                "daily_limit": settings.MAX_DAILY_EMAILS,
                "warning": "This is an estimated limit. Actual limit may vary."
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def test_connection(self) -> bool:
        """Test if Gmail connection is working"""
        try:
            self.service.users().getProfile(userId='me').execute()
            return True
        except Exception:
            return False
