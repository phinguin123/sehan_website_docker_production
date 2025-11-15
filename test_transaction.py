#!/usr/bin/env python3
"""
Test script to verify transaction handling in schedule creation
"""
import sys
import os
sys.path.append('/home/phinguin_user/sehan_website/backend')

from utils.db import DBHelper
from dao.private_tutoring.pt_schedule_dao import PTScheduleDAO

def test_transaction_rollback():
    """Test that transactions are properly rolled back on errors"""
    db_helper = DBHelper()
    schedule_dao = PTScheduleDAO(db_helper)
    
    print("Testing transaction rollback...")
    
    # Test data with invalid teacher_id to cause a foreign key constraint error
    test_data = {
        "application_id": 1,
        "student_id": 1,
        "teacher_id": 999,  # Invalid teacher_id that doesn't exist
        "subject_id": 43,
        "start_time": "2025-01-01 10:00:00",
        "end_time": "2025-01-01 11:00:00",
        "scheduled_duration": 1.0,
        "status": "scheduled",
        "notes": "Test schedule for transaction rollback",
        "display_title": "Test Session",
        "color": "#4285f4"
    }
    
    try:
        # Start transaction
        connection = schedule_dao.db.begin_transaction()
        print("✓ Transaction started")
        
        # Try to create schedule (this should fail due to foreign key constraint)
        schedule_id = schedule_dao.create_schedule(test_data, connection)
        print(f"✓ Schedule created with ID: {schedule_id}")
        
        # This should not be reached due to the foreign key error
        print("✗ This should not be reached!")
        
        # Commit transaction (this should not be reached)
        schedule_dao.db.commit_transaction(connection)
        print("✗ Transaction committed (this should not happen)")
        
    except Exception as e:
        print(f"✓ Expected error caught: {str(e)}")
        
        # Rollback transaction
        if 'connection' in locals():
            schedule_dao.db.rollback_transaction(connection)
            print("✓ Transaction rolled back")
    
    # Check if any schedule was actually created
    schedules = schedule_dao.get_all_schedules()
    print(f"✓ Total schedules in database: {len(schedules)}")
    
    if len(schedules) == 0:
        print("✓ SUCCESS: No schedules were created, transaction rollback worked!")
    else:
        print("✗ FAILURE: Schedules were created despite error!")

if __name__ == "__main__":
    test_transaction_rollback()

