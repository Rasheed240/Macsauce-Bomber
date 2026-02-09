from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64
import os
import mimetypes
from typing import Dict, Any, List

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
        html_body: str | None = None,
        attachment_paths: List[str] | None = None
    ) -> Dict[str, Any]:
        """Send an email via Gmail API with optional attachments"""
        try:
            # Create message container
            if html_body or attachment_paths:
                message = MIMEMultipart('mixed')
                message['to'] = to
                message['subject'] = subject

                # Create alternative part for text/html
                if html_body:
                    msg_alternative = MIMEMultipart('alternative')
                    msg_alternative.attach(MIMEText(body, 'plain'))
                    msg_alternative.attach(MIMEText(html_body, 'html'))
                    message.attach(msg_alternative)
                else:
                    message.attach(MIMEText(body, 'plain'))

                # Add attachments if provided
                if attachment_paths:
                    print(f"DEBUG: Attaching {len(attachment_paths)} files: {attachment_paths}")
                    for file_path in attachment_paths:
                        if os.path.exists(file_path):
                            self._attach_file(message, file_path)
                        else:
                            print(f"WARNING: Attachment file not found, skipping: {file_path}")

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

    def _attach_file(self, message: MIMEMultipart, file_path: str):
        """Attach a file to the email message"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                print(f"ERROR: Attachment file not found: {file_path}")
                return

            # Guess the content type based on file extension
            content_type, encoding = mimetypes.guess_type(file_path)

            if content_type is None or encoding is not None:
                content_type = 'application/octet-stream'

            main_type, sub_type = content_type.split('/', 1)

            # Read the file
            with open(file_path, 'rb') as fp:
                msg = MIMEBase(main_type, sub_type)
                msg.set_payload(fp.read())

            # Encode the payload using Base64
            encoders.encode_base64(msg)

            # Set the filename parameter
            filename = os.path.basename(file_path)
            msg.add_header('Content-Disposition', 'attachment', filename=filename)

            message.attach(msg)
            print(f"SUCCESS: Attached file: {filename}")

        except Exception as e:
            # Log error but don't fail the entire email send
            print(f"ERROR: Failed to attach file {file_path}: {str(e)}")

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
