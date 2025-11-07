#!/usr/bin/env python3
"""Add license_id column to facilities table."""

import sys
sys.path.insert(0, '/home/doddy/MedPost/backend')

from sqlalchemy import text
from app.db.session import get_session_factory

try:
    session = get_session_factory()()
    
    # Check if column exists
    result = session.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='facilities' AND column_name='license_id'
    """))
    
    if result.fetchone():
        print("✓ Column license_id already exists")
    else:
        # Add the column
        session.execute(text("ALTER TABLE facilities ADD COLUMN license_id VARCHAR(100) NULL"))
        session.commit()
        print("✓ Column license_id added successfully")
        
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    session.close()
