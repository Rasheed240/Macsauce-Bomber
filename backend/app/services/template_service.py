"""
Template service for handling email template operations
"""
import re
from typing import Dict, List, Optional, Set, Any
from jinja2 import Template, TemplateSyntaxError, Environment


class TemplateService:
    """Service for handling email template operations"""

    def __init__(self):
        """Initialize the template service"""
        self.env = Environment(
            variable_start_string='{{',
            variable_end_string='}}',
            autoescape=True
        )

    def extract_placeholders(self, template: str) -> List[str]:
        """
        Extract placeholders from a template string.
        Placeholders are in the format {{placeholder_name}}

        Args:
            template: Template string containing placeholders

        Returns:
            List of unique placeholder names
        """
        pattern = r'\{\{(\s*[\w\-\.]+\s*)\}\}'
        matches = re.findall(pattern, template)
        # Trim whitespace and return unique placeholders
        return list(set([match.strip() for match in matches]))

    def validate_template(self, subject: str, body: str) -> Dict[str, Any]:
        """
        Validate template syntax and extract placeholders.

        Args:
            subject: Email subject template
            body: Email body template

        Returns:
            Dict with validation results:
            {
                "valid": bool,
                "errors": List[str],
                "placeholders": List[str]
            }
        """
        errors = []

        # Check for empty templates
        if not subject or not subject.strip():
            errors.append("Subject cannot be empty")

        if not body or not body.strip():
            errors.append("Body cannot be empty")

        # Extract placeholders
        subject_placeholders = self.extract_placeholders(subject)
        body_placeholders = self.extract_placeholders(body)
        all_placeholders = list(set(subject_placeholders + body_placeholders))

        # Check for invalid placeholder names (spaces, special chars)
        for placeholder in all_placeholders:
            if not re.match(r'^[\w\-\.]+$', placeholder):
                errors.append(f"Invalid placeholder '{{{{{placeholder}}}}}': contains invalid characters")

        # Check for single braces (common mistake)
        single_brace_pattern = r'(?<!\{)\{(?!\{)|(?<!\})\}(?!\})'
        if re.search(single_brace_pattern, subject + body):
            errors.append("Found single braces. Use {{placeholder}} format.")

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'placeholders': all_placeholders
        }

    def render_template(self, template_str: str, data: Dict[str, Any]) -> str:
        """
        Render a template string with provided data using Jinja2.

        Args:
            template_str: Template string with {{placeholder}} syntax
            data: Dictionary of placeholder values

        Returns:
            Rendered template string

        Raises:
            ValueError: If template has syntax or rendering errors
        """
        try:
            # Convert {{placeholder}} to Jinja2 {{ placeholder }} syntax
            jinja_template_str = re.sub(r'\{\{(\s*[\w\-\.]+\s*)\}\}', r'{{ \1 }}', template_str)

            # Create and render Jinja2 template
            template = Template(jinja_template_str)
            rendered = template.render(**data)

            return rendered
        except TemplateSyntaxError as e:
            raise ValueError(f"Template syntax error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Template rendering error: {str(e)}")

    def render_email(
        self,
        subject: str,
        body: str,
        data: Dict[str, Any],
        html_body: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Render complete email with subject and body.

        Args:
            subject: Subject template
            body: Body template (plain text)
            data: Dictionary of placeholder values
            html_body: Optional HTML body template

        Returns:
            Dict with rendered email:
            {
                "subject": str,
                "body": str,
                "html_body": str (optional)
            }

        Raises:
            ValueError: If email rendering fails
        """
        try:
            rendered_subject = self.render_template(subject, data)
            rendered_body = self.render_template(body, data)
            rendered_html = None

            if html_body:
                rendered_html = self.render_template(html_body, data)

            return {
                'subject': rendered_subject,
                'body': rendered_body,
                'html_body': rendered_html
            }
        except Exception as e:
            raise ValueError(f"Email rendering failed: {str(e)}")

    def check_unmapped_placeholders(
        self,
        placeholders: Set[str],
        column_mapping: Dict[str, str]
    ) -> Set[str]:
        """
        Check for placeholders that are not mapped to data columns.

        Args:
            placeholders: Set of placeholder names from template
            column_mapping: Dict mapping placeholders to column names

        Returns:
            Set of unmapped placeholder names
        """
        # System placeholders that don't need mapping
        system_placeholders = {'unsubscribe_link'}

        # Convert to set if it's a list
        if isinstance(placeholders, list):
            placeholders = set(placeholders)

        # Filter out system placeholders
        user_placeholders = placeholders - system_placeholders

        # Find unmapped placeholders
        mapped_placeholders = set(column_mapping.keys())
        unmapped = user_placeholders - mapped_placeholders

        return unmapped

    def check_missing_data(self, data: Dict[str, Any], required_fields: List[str]) -> List[str]:
        """
        Check for required fields missing from data.

        Args:
            data: Data dictionary
            required_fields: List of required field names

        Returns:
            List of missing field names
        """
        missing = []
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                missing.append(field)

        return missing

    def preview_emails(
        self,
        subject: str,
        body: str,
        contacts: List[Dict[str, Any]],
        column_mapping: Dict[str, str],
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate preview of rendered emails for sample contacts.

        Args:
            subject: Subject template
            body: Body template
            contacts: List of contact data dictionaries
            column_mapping: Mapping of placeholders to column names
            limit: Maximum number of previews to generate

        Returns:
            List of preview dictionaries
        """
        previews = []

        for contact in contacts[:limit]:
            # Map data according to column_mapping
            mapped_data = {}
            for placeholder, column in column_mapping.items():
                mapped_data[placeholder] = contact.get(column, '')

            # Add system placeholders
            mapped_data['unsubscribe_link'] = 'http://example.com/unsubscribe/preview'

            # Render email
            try:
                rendered = self.render_email(subject, body, mapped_data)
                email_column = column_mapping.get('email', 'email')
                previews.append({
                    'email': contact.get(email_column, 'unknown'),
                    'subject': rendered['subject'],
                    'body': rendered['body'],
                    'success': True
                })
            except Exception as e:
                email_column = column_mapping.get('email', 'email')
                previews.append({
                    'email': contact.get(email_column, 'unknown'),
                    'error': str(e),
                    'success': False
                })

        return previews


# Standalone function for backward compatibility (used in email_tasks.py)
def render_email(
    subject: str,
    body: str,
    data: Dict[str, Any],
    html_body: Optional[str] = None
) -> Dict[str, str]:
    """
    Standalone function for rendering emails.
    This is a convenience wrapper around TemplateService.render_email()

    Args:
        subject: Subject template
        body: Body template (plain text)
        data: Dictionary of placeholder values
        html_body: Optional HTML body template

    Returns:
        Dict with rendered email
    """
    service = TemplateService()
    return service.render_email(subject, body, data, html_body)
