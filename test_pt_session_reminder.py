#!/usr/bin/env python3
"""
Manual test script for private tutoring session reminder Alimtalk
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sehan_kakao_alimtalk import send_pt_session_reminder
from datetime import datetime, timedelta

def test_pt_session_reminder():
    """Test private tutoring session reminder Alimtalk"""
    print("🧪 Testing Private Tutoring Session Reminder Alimtalk")
    print("=" * 60)
    
    # Test data - REPLACE WITH YOUR ACTUAL TEST PHONE NUMBER
    test_phone = input("Enter parent phone number (with country code, e.g., 821012345678): ").strip()
    if not test_phone:
        test_phone = "821091285211"  # Default test number
        print(f"Using default test number: {test_phone}")
    
    test_student = input("Enter student name (default: Test Student): ").strip() or "Test Student"
    test_subject = input("Enter subject name (default: Math): ").strip() or "Math"
    
    # Test session time (2 hours from now)
    test_time = datetime.now() + timedelta(hours=2)
    session_date = test_time.strftime('%m월 %d일')
    session_time_str = test_time.strftime('%H시 %M분')
    
    print()
    print(f"📱 Test phone: {test_phone}")
    print(f"👨‍🎓 Test student: {test_student}")
    print(f"📚 Test subject: {test_subject}")
    print(f"📅 Test session: {session_date} {session_time_str}")
    print()
    
    # Confirm before sending
    confirm = input("Send test reminder? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Cancelled")
        return
    
    print()
    print("1️⃣ Sending Session Reminder...")
    print("-" * 60)
    
    try:
        result = send_pt_session_reminder(
            parent_phone_number=test_phone,
            session_date=session_date,
            session_time=session_time_str,
            student_name=test_student,
            subject_name=test_subject
        )
        
        print()
        print("-" * 60)
        if result:
            print("   ✅ Session reminder sent successfully!")
        else:
            print("   ❌ Session reminder failed to send")
        print()
        print("📋 Check the logs in backend/logs/server.log for detailed information")
        print("📱 Check your phone for the Kakao AlimTalk message")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pt_session_reminder()
