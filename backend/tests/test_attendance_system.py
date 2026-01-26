"""
Integration tests for attendance system with time mocking.
Demonstrates testing complex, time-dependent functions.
"""
import unittest
from unittest.mock import patch, MagicMock, call
from datetime import datetime, time, timedelta
import pytz
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock the database and external dependencies
from unittest.mock import patch


class TestAttendanceSystem(unittest.TestCase):
    """Test attendance marking system with mocked time and database"""
    
    def setUp(self):
        """Set up test environment"""
        os.environ['SEHAN_END_DATE'] = '2026-01-05'
    
    def tearDown(self):
        """Clean up after tests"""
        if 'SEHAN_END_DATE' in os.environ:
            del os.environ['SEHAN_END_DATE']
    
    @patch('app.get_db_connection')
    @patch('app.get_current_time_kst')
    @patch('app.logger')
    def test_mark_students_absent_skips_on_end_date(self, mock_logger, mock_get_time, mock_db):
        """Test that mark_students_absent skips execution on SEHAN_END_DATE"""
        from utils.date_validator import clear_cache
        clear_cache()
        
        kst = pytz.timezone('Asia/Seoul')
        # Mock current time to be 2026-01-05 15:30:00 KST (on end date)
        mock_now = kst.localize(datetime(2026, 1, 5, 15, 30, 0))
        mock_get_time.return_value = mock_now
        
        # Import and call the function
        from app import mark_students_absent
        
        # Call the function
        mark_students_absent(
            start_time=time(15, 0),
            grade='12',
            subject_name='Math AA',
            level_id=1,
            mode_id=1,
            timetable_id=123,
            day_name='Monday'
        )
        
        # Verify database connection was NOT called (function returned early)
        mock_db.assert_not_called()
        
        # Verify log message about skipping
        log_calls = [str(call) for call in mock_logger.info.call_args_list]
        skip_found = any('Skipping mark_students_absent' in str(c) for c in log_calls)
        self.assertTrue(skip_found, "Should log that function is skipping")
    
    @patch('app.get_db_connection')
    @patch('app.get_current_time_kst')
    @patch('app.logger')
    def test_mark_students_absent_runs_before_end_date(self, mock_logger, mock_get_time, mock_db):
        """Test that mark_students_absent runs normally before SEHAN_END_DATE"""
        from utils.date_validator import clear_cache
        clear_cache()
        
        kst = pytz.timezone('Asia/Seoul')
        # Mock current time to be 2026-01-04 15:30:00 KST (before end date)
        mock_now = kst.localize(datetime(2026, 1, 4, 15, 30, 0))
        mock_get_time.return_value = mock_now
        
        # Mock database connection
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_conn.cursor.return_value.__exit__.return_value = None
        mock_db.return_value = mock_conn
        
        # Mock cursor.fetchall to return empty list (no absent students)
        mock_cursor.fetchall.return_value = []
        
        # Import and call the function
        from app import mark_students_absent
        
        # Call the function
        mark_students_absent(
            start_time=time(15, 0),
            grade='12',
            subject_name='Math AA',
            level_id=1,
            mode_id=1,
            timetable_id=123,
            day_name='Monday'
        )
        
        # Verify database connection WAS called (function executed)
        mock_db.assert_called_once()
        
        # Verify cursor.execute was called (query was executed)
        self.assertTrue(mock_cursor.execute.called)
    
    @patch('app.get_db_connection')
    @patch('app.get_current_time_kst')
    @patch('app.logger')
    def test_check_attendance_missing_skips_on_end_date(self, mock_logger, mock_get_time, mock_db):
        """Test that check_attendance_missing skips execution on SEHAN_END_DATE"""
        from utils.date_validator import clear_cache
        clear_cache()
        
        kst = pytz.timezone('Asia/Seoul')
        # Mock current time to be 2026-01-05 15:10:00 KST (on end date)
        mock_now = kst.localize(datetime(2026, 1, 5, 15, 10, 0))
        mock_get_time.return_value = mock_now
        
        # Import and call the function
        from app import check_attendance_missing
        
        # Call the function
        check_attendance_missing(
            start_time=time(15, 0),
            grade='12',
            subject_name='Math AA',
            level_id=1,
            mode_id=1
        )
        
        # Verify database connection was NOT called (function returned early)
        mock_db.assert_not_called()
        
        # Verify log message about skipping
        log_calls = [str(call) for call in mock_logger.info.call_args_list]
        skip_found = any('Skipping check_attendance_missing' in str(c) for c in log_calls)
        self.assertTrue(skip_found, "Should log that function is skipping")


class TestAttendanceSystemWithFreezegun(unittest.TestCase):
    """
    Alternative approach using freezegun library for time control.
    Install: pip install freezegun
    """
    
    def setUp(self):
        """Set up test environment"""
        os.environ['SEHAN_END_DATE'] = '2026-01-05'
    
    def tearDown(self):
        """Clean up after tests"""
        if 'SEHAN_END_DATE' in os.environ:
            del os.environ['SEHAN_END_DATE']
    
    @unittest.skipUnless(
        __import__('freezegun', fromlist=['']),
        "freezegun not installed. Install with: pip install freezegun"
    )
    def test_with_freezegun(self):
        """Example using freezegun for time control"""
        from freezegun import freeze_time
        from utils.date_validator import is_current_date_after_sehan_end
        from utils.date_validator import clear_cache
        clear_cache()
        
        # Freeze time to 2026-01-05 15:00:00 KST
        with freeze_time("2026-01-05 15:00:00+09:00"):
            # This should return True (current date is on end date)
            result = is_current_date_after_sehan_end()
            self.assertTrue(result)
        
        # Freeze time to 2026-01-04 15:00:00 KST
        with freeze_time("2026-01-04 15:00:00+09:00"):
            # This should return False (current date is before end date)
            result = is_current_date_after_sehan_end()
            self.assertFalse(result)


if __name__ == '__main__':
    unittest.main()





