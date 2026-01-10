"""
Seed sample templates for all users
Run this script to add sample templates to the database
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.template import Template
from app.models.campaign import Campaign  # Import to resolve relationships
from app.models.contact import Contact  # Import to resolve relationships
from app.models.email_log import EmailLog  # Import to resolve relationships

SAMPLE_TEMPLATES = [
    {
        "name": "Cold Sales Outreach",
        "description": "Professional cold email for sales prospecting",
        "subject": "Quick question about {{company}}",
        "body": """Hi {{name}},

I noticed that {{company}} is doing great work in {{industry}}. I wanted to reach out because I think we could help {{company}} achieve even better results.

We specialize in [your value proposition] and have helped companies like yours increase [metric] by [percentage].

Would you be open to a quick 15-minute call next week to explore if this could be valuable for {{company}}?

Best regards,
[Your Name]

{{unsubscribe_link}}""",
        "category": "sales"
    },
    {
        "name": "Product Launch",
        "description": "Announce a new product or feature",
        "subject": "Exciting news: We just launched {{product_name}}!",
        "body": """Hi {{name}},

I'm excited to share that we've just launched {{product_name}} - a solution designed specifically for professionals like you at {{company}}.

Key benefits:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

As one of our valued contacts, you get exclusive early access. Click here to learn more: [link]

Looking forward to hearing what you think!

Best,
[Your Name]

{{unsubscribe_link}}""",
        "category": "product"
    },
    {
        "name": "Follow-up Email",
        "description": "Follow up after initial contact",
        "subject": "Following up: {{topic}}",
        "body": """Hi {{name}},

I wanted to follow up on my previous email about {{topic}}.

I understand you're busy, but I genuinely believe this could be valuable for {{company}}.

Would you have 10 minutes this week for a quick call?

Let me know what works for you.

Best regards,
[Your Name]

{{unsubscribe_link}}""",
        "category": "follow-up"
    },
    {
        "name": "Job Application Follow-up",
        "description": "Follow up on a job application",
        "subject": "Following up on {{position}} application",
        "body": """Dear {{name}},

I recently applied for the {{position}} role at {{company}} and wanted to follow up on my application.

I'm very excited about the opportunity to contribute to {{company}}'s mission, and I believe my experience in {{skill}} would be a great fit for your team.

I'd love the opportunity to discuss how I can add value to {{company}}.

Thank you for your time and consideration.

Best regards,
{{applicant_name}}

{{unsubscribe_link}}""",
        "category": "job"
    },
    {
        "name": "Newsletter Template",
        "description": "Monthly newsletter format",
        "subject": "{{month}} Newsletter: {{headline}}",
        "body": """Hi {{name}},

Welcome to our {{month}} newsletter!

🎯 What's New:
{{news_item}}

📚 Featured Resource:
{{resource_description}}

💡 Quick Tip:
{{tip}}

Thanks for being part of our community!

Best,
{{sender_name}}

Unsubscribe: {{unsubscribe_link}}""",
        "category": "newsletter"
    },
    {
        "name": "Event Invitation",
        "description": "Invite contacts to an event",
        "subject": "You're invited: {{event_name}}",
        "body": """Hi {{name}},

You're invited to {{event_name}}!

📅 Date: {{event_date}}
🕒 Time: {{event_time}}
📍 Location: {{event_location}}

We're bringing together professionals from {{industry}} to discuss {{topic}}.

Reserve your spot: [registration_link]

Looking forward to seeing you there!

Best,
{{organizer_name}}

{{unsubscribe_link}}""",
        "category": "event"
    }
]

def seed_templates():
    """Add sample templates for all existing users"""
    db = SessionLocal()

    try:
        # Get all users
        users = db.query(User).all()

        if not users:
            print("No users found. Please create a user account first.")
            return

        for user in users:
            print(f"\nAdding templates for user: {user.gmail_address}")

            for template_data in SAMPLE_TEMPLATES:
                # Check if template already exists
                existing = db.query(Template).filter(
                    Template.user_id == user.id,
                    Template.name == template_data["name"]
                ).first()

                if existing:
                    print(f"  - Skipping '{template_data['name']}' (already exists)")
                    continue

                template = Template(
                    user_id=user.id,
                    name=template_data["name"],
                    description=template_data["description"],
                    subject=template_data["subject"],
                    body=template_data["body"],
                    category=template_data["category"]
                )

                db.add(template)
                print(f"  ✓ Added '{template_data['name']}'")

            db.commit()

        print("\nSample templates seeded successfully!")

    except Exception as e:
        print(f"Error seeding templates: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_templates()
