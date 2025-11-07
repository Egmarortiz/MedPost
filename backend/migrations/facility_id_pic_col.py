#!/usr/bin/env python3
"""Add id_photo_url and license_id columns to facilities table."""

from sqlalchemy import text
from app.db.session import get_session_factory

try:
    session_factory = get_session_factory()
    session = session_factory()
    
    result = session.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='facilities' AND column_name='id_photo_url'
    """))
    
    if result.fetchone():
        print("✓ Column id_photo_url already exists")
    else:
        session.execute(text("""
            ALTER TABLE facilities ADD COLUMN id_photo_url VARCHAR(512) NULL
        """))
        session.commit()
        print("✓ Column id_photo_url added successfully")
    
    # Add license_id column
    result = session.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='facilities' AND column_name='license_id'
    """))
    
    if result.fetchone():
        print("✓ Column license_id already exists")
    else:
        session.execute(text("""
            ALTER TABLE facilities ADD COLUMN license_id VARCHAR(100) NULL
        """))
        session.commit()
        print("✓ Column license_id added successfully")
        
except Exception as e:
    print(f"✗ Error: {e}")
finally:
    session.close()
