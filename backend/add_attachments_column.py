"""
Script to add attachments column to campaigns table
"""
import psycopg2
from app.core.config import settings

def add_attachments_column():
    """Add attachments column to campaigns table if it doesn't exist"""

    # Parse the database URL
    db_url = settings.DATABASE_URL.replace('postgresql+psycopg2://', 'postgresql://')

    try:
        # Connect to database
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()

        # Check if column exists
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='campaigns' AND column_name='attachments'
        """)

        if cursor.fetchone() is None:
            # Add the column
            print("Adding attachments column to campaigns table...")
            cursor.execute("""
                ALTER TABLE campaigns
                ADD COLUMN attachments JSON NULL
            """)
            conn.commit()
            print("SUCCESS: Column added successfully!")
        else:
            print("SUCCESS: Column already exists!")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise

if __name__ == "__main__":
    add_attachments_column()
