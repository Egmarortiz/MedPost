"""Add phone column to workers table."""

import psycopg2
from app.core.settings import get_settings

settings = get_settings()

# Connect to database
database_url = settings.database_url.replace("postgresql+psycopg2://", "postgresql://")
conn = psycopg2.connect(database_url)
cur = conn.cursor()

try:
    # Add phone column to workers table
    print("Adding phone column to workers table...")
    cur.execute("""
        ALTER TABLE workers 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
    """)
    
    # Create index on phone column
    print("Creating index on phone column...")
    cur.execute("""
        CREATE INDEX IF NOT EXISTS ix_workers_phone ON workers(phone);
    """)
    
    conn.commit()
    print("✓ Successfully added phone column to workers table")
    
except Exception as e:
    conn.rollback()
    print(f"✗ Error: {e}")
    
finally:
    cur.close()
    conn.close()
