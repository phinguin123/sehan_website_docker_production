"""
Integration tests for reminder service with mocked time and Celery.
Demonstrates testing Celery tasks and services.
"""
import unittest
from unittest.mock import patch, MagicMock, call
from datetime import datetime, timedelta
import pytz
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestReminderService(unittest.TestCase):
    """Test reminder service with mocked time"""
    
    def setUp(self):
        """Set up test environment"""
        os.environ['SEHAN_END_DATE'] = '2026-01-05'
        from utils.date_validator import clear_cache
        clear_cache()
    
    def tearDown(self):
        """Clean up after tests"""
        if 'SEHAN_END_DATE' in os.environ:
            del os.environ['SEHAN_END_DATE']
    
    @patch('services.session_reminder_service.send_session_reminder')
    @patch('services.session_reminder_service.datetime')
    def test_schedule_reminder_skips_after_end_date(self, mock_datetime, mock_send_reminder):
        """Test that reminder scheduling is skipped for sessions after end date"""
        from services.session_reminder_service import SessionReminderService
        from utils.date_validator import clear_cache
        clear_cache()
        
        kst = pytz.timezone('Asia/Seoul')
        # Mock datetime.now to return 2026-01-04 (before end date)
        mock_now = kst.localize(datetime(2026, 1, 4, 10, 0, 0))
        mock_datetime.now.return_value = mock_now
        mock_datetime.strptime = datetime.strptime
        
        service = SessionReminderService()
        
        # Try to schedule reminder for session on 2026-01-06 (after end date)
        session_time = kst.localize(datetime(2026, 1, 6, 14, 0, 0))
        result = service.schedule_reminder(
            schedule_id=123,
            session_datetime=session_time,
            reminder_hours_before=24
        )
        
        # Should return skipped status
        self.assertEqual(result['status'], 'skipped')
        self.assertIn('SEHAN_END_DATE', result.get('reason', ''))
        
        # Should NOT call send_session_reminder
        mock_send_reminder.apply_async.assert_not_called()
    
    @patch('services.session_reminder_service.send_session_reminder')
    @patch('services.session_reminder_service.datetime')
    def test_schedule_reminder_allows_before_end_date(self, mock_datetime, mock_send_reminder):
        """Test that reminder scheduling works for sessions before end date"""
        from services.session_reminder_service import SessionReminderService
        from utils.date_validator import clear_cache
        clear_cache()
        
        kst = pytz.timezone('Asia/Seoul')
        # Mock datetime.now to return 2026-01-04 (before end date)
        mock_now = kst.localize(datetime(2026, 1, 4, 10, 0, 0))
        mock_datetime.now.return_value = mock_now
        mock_datetime.strptime = datetime.strptime
        
        # Mock the task
        mock_task = MagicMock()
        mock_task.id = 'test-task-id'
        mock_send_reminder.apply_async.return_value = mock_task
        
        service = SessionReminderService()
        
        # Try to schedule reminder for session on 2026-01-04 (before end date)
        session_time = kst.localize(datetime(2026, 1, 4, 14, 0, 0))
        result = service.schedule_reminder(
            schedule_id=123,
            session_datetime=session_time,
            reminder_hours_before=24
        )
        
        # Should schedule successfully
        self.assertIn(result['status'], ['scheduled', 'executed_immediately'])
        
        # Should call send_session_reminder
        mock_send_reminder.apply_async.assert_called()


class TestReminderTask(unittest.TestCase):
    """Test Celery reminder task with mocked time"""
    
    def setUp(self):
        """Set up test environment"""
        os.environ['SEHAN_END_DATE'] = '2026-01-05'
        from utils.date_validator import clear_cache
        clear_cache()
    
    def tearDown(self):
        """Clean up after tests"""
        if 'SEHAN_END_DATE' in os.environ:
            del os.environ['SEHAN_END_DATE']
    
    @patch('tasks.session_reminder_tasks.datetime')
    @patch('tasks.session_reminder_tasks.DBHelper')
    @patch('tasks.session_reminder_tasks.PTScheduleDAO')
    def test_send_session_reminder_skips_on_end_date(self, mock_dao, mock_db, mock_datetime):
        """Test that reminder task skips sending on SEHAN_END_DATE"""
        from tasks.session_reminder_tasks import send_session_reminder
        from utils.date_validator import clear_cache
        clear_cache()
        
        kst = pytz.timezone('Asia/Seoul')
        # Mock current time to be 2026-01-05 10:00:00 KST (on end date)
        mock_now = kst.localize(datetime(2026, 1, 5, 10, 0, 0))
        mock_datetime.now.return_value = mock_now
        mock_datetime.strptime = datetime.strptime
        
        # Create a mock task instance
        mock_task = MagicMock()
        mock_task.request.id = 'test-task-id'
        
        # Call the task
        result = send_session_reminder(mock_task, schedule_id=123)
        
        # Should return skipped status
        self.assertEqual(result['status'], 'skipped')
        self.assertIn('SEHAN_END_DATE', result.get('reason', ''))
        
        # Should NOT query database
        mock_db.assert_not_called()


if __name__ == '__main__':
    unittest.main()





