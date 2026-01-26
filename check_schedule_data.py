#!/usr/bin/env python3
"""
Diagnostic script to check schedule data for reminders
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from utils.db import DBHelper
from dao.private_tutoring.pt_schedule_dao import PTScheduleDAO

def check_schedule(schedule_id):
    """Check what data is available for a schedule"""
    print(f"🔍 Checking schedule {schedule_id}...")
    print("=" * 60)
    
    db_helper = DBHelper()
    schedule_dao = PTScheduleDAO(db_helper)
    
    # Get schedule for reminder
    schedule = schedule_dao.get_schedule_details_for_reminder(schedule_id)
    
    if not schedule:
        print("❌ Schedule not found or status is not 'scheduled'")
        
        # Try to get basic schedule
        basic = schedule_dao.get_schedule_by_id(schedule_id)
        if basic:
            print(f"   Schedule exists but status is: {basic.get('status')}")
            print(f"   Available fields: {list(basic.keys())}")
        else:
            print("   Schedule does not exist")
        return
    
    print("✅ Schedule found!")
    print()
    print("📋 Schedule Data:")
    print("-" * 60)
    for key, value in schedule.items():
        print(f"  {key}: {repr(value)}")
    
    print()
    print("📞 Parent Phone Check:")
    print("-" * 60)
    parent_phone = schedule.get('parent_phone')
    print(f"  Value: {repr(parent_phone)}")
    print(f"  Type: {type(parent_phone)}")
    print(f"  Is None: {parent_phone is None}")
    print(f"  Is empty string: {parent_phone == ''}")
    print(f"  Truthy: {bool(parent_phone)}")
    
    if not parent_phone:
        print()
        print("⚠️  WARNING: No parent phone number found!")
        print("   This schedule cannot send reminders.")
        print()
        print("💡 To fix:")
        print("   1. Check if the student has a parent_phone in pt_students table")
        print("   2. Update the student record with parent_phone")
    else:
        print()
        print("✅ Parent phone number is available")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        schedule_id = int(sys.argv[1])
    else:
        schedule_id = int(input("Enter schedule_id to check: "))
    
    check_schedule(schedule_id)
