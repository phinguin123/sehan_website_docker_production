#!/usr/bin/env python3
"""
Test script for Kakao AlimTalk integration with Celery reminder system
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from datetime import datetime, timedelta
from sehan_kakao_alimtalk import send_pt_session_reminder

def test_kakao_alimtalk():
    """Test Kakao AlimTalk functions"""
    print("🧪 Testing Kakao AlimTalk Integration")
    print("=" * 40)
    
    # Test data
    test_phone = "821086836054"  # Replace with a test phone number
    test_student = "김지태"
    
    # Test session time (2 hours from now)
    test_time = datetime.now() + timedelta(hours=2)
    session_date = test_time.strftime('%m월 %d일')
    session_time_str = test_time.strftime('%H시 %M분')
    
    print(f"📱 Test phone: {test_phone}")
    print(f"👨‍🎓 Test student: {test_student}")
    print(f"📅 Test session: {session_date} {session_time_str}")
    print()
    
    # Test: Session Reminder Only
    print("1️⃣ Testing Session Reminder...")
    try:
        result = send_pt_session_reminder(
            parent_phone_number=test_phone,
            session_date=session_date,
            session_time=session_time_str,
            student_name=test_student,
            subject_name="테스트 과목"
        )
        if result:
            print("   ✅ Session reminder sent successfully")
        else:
            print("   ❌ Session reminder failed (returned False)")
            print("   Check backend/logs/server.log for error details")
    except Exception as e:
        print(f"   ❌ Session reminder failed with exception: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("📋 Test Results:")
    print("   - Check your phone for Kakao AlimTalk reminder message")
    print("   - Verify message content and formatting")
    print("   - Test with real phone numbers in production")
    
    print()
    print("⚠️  Important Notes:")
    print("   - Replace test phone number with real numbers")
    print("   - Ensure Kakao AlimTalk API credentials are correct")
    print("   - Test template codes are approved and active")
    print("   - No cancellation messages are sent (as requested)")

if __name__ == "__main__":
    test_kakao_alimtalk()
