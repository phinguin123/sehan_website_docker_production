#!/usr/bin/env python3
"""
Test script for Celery-based session reminder system
"""
import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5000"
FLOWER_URL = "http://localhost:5555"

def test_reminder_system():
    """Test the session reminder system"""
    print("🧪 Testing Celery-based Session Reminder System")
    print("=" * 50)
    
    # Test 1: Check if services are running
    print("\n1️⃣ Checking service status...")
    
    try:
        # Check backend
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"   ✅ Backend: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend: {e}")
        return False
    
    try:
        # Check Flower
        response = requests.get(f"{FLOWER_URL}/", timeout=5)
        print(f"   ✅ Flower: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Flower: {e}")
        return False
    
    # Test 2: Create a test schedule (this would require authentication in real scenario)
    print("\n2️⃣ Testing schedule creation with reminder...")
    
    # Schedule time 2 hours from now (for testing)
    test_time = (datetime.now() + timedelta(hours=2)).isoformat() + "Z"
    
    test_schedule = {
        "application_id": 1,
        "student_id": 1,
        "teacher_id": 1,
        "subject_id": 1,
        "scheduled_time": test_time,
        "scheduled_duration": 1.0,
        "notes": "Test session for reminder system"
    }
    
    print(f"   📅 Test schedule time: {test_time}")
    print("   📝 Note: This test requires proper authentication setup")
    print("   💡 To test manually:")
    print(f"      curl -X POST {BASE_URL}/api/schedules \\")
    print("        -H 'Content-Type: application/json' \\")
    print("        -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\")
    print(f"        -d '{json.dumps(test_schedule)}'")
    
    # Test 3: Check Flower dashboard
    print("\n3️⃣ Checking Flower dashboard...")
    print(f"   🌐 Access Flower at: {FLOWER_URL}")
    print("   📊 Monitor tasks, workers, and queues")
    
    # Test 4: Redis connection test
    print("\n4️⃣ Testing Redis connection...")
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("   ✅ Redis connection successful")
        
        # Check queue lengths
        reminder_queue = r.llen('reminders')
        notification_queue = r.llen('notifications')
        print(f"   📊 Reminder queue length: {reminder_queue}")
        print(f"   📊 Notification queue length: {notification_queue}")
        
    except Exception as e:
        print(f"   ❌ Redis connection failed: {e}")
        return False
    
    print("\n✅ All basic tests passed!")
    print("\n📋 Next Steps:")
    print("   1. Set up proper authentication")
    print("   2. Create a real schedule through the API")
    print("   3. Monitor the reminder in Flower")
    print("   4. Check logs: docker-compose logs celery-worker")
    
    return True

if __name__ == "__main__":
    test_reminder_system()
