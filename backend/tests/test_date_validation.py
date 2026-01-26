"""
Unit tests for date validation logic using time mocking.
This demonstrates how to test time-dependent code.
"""
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, date
import pytz
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.date_validator import (
    validate_session_date,
    validate_current_date_for_sending,
    is_date_after_sehan_end,
    is_current_date_after_sehan_end,
    clear_cache,
    SehanEndDateExceededError
)


class TestDateValidation(unittest.TestCase):
    """Test date validation with mocked time"""
    
    def setUp(self):
        """Clear cache before each test"""
        clear_cache()
        # Set test environment variable
        os.environ['SEHAN_END_DATE'] = '2026-01-05'
    
    def tearDown(self):
        """Clean up after each test"""
        clear_cache()
        if 'SEHAN_END_DATE' in os.environ:
            del os.environ['SEHAN_END_DATE']
    
    def test_validate_session_date_before_end_date(self):
        """Test that sessions before end date are allowed"""
        kst = pytz.timezone('Asia/Seoul')
        # Session on 2026-01-04 (before end date)
        session_time = kst.localize(datetime(2026, 1, 4, 14, 0, 0))
        
        is_valid, error = validate_session_date(session_time, raise_on_error=False)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_validate_session_date_on_end_date(self):
        """Test that sessions on end date are rejected"""
        kst = pytz.timezone('Asia/Seoul')
        # Session on 2026-01-05 (on end date)
        session_time = kst.localize(datetime(2026, 1, 5, 14, 0, 0))
        
        is_valid, error = validate_session_date(session_time, raise_on_error=False)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
        self.assertIn('SEHAN_END_DATE', error)
    
    def test_validate_session_date_after_end_date(self):
        """Test that sessions after end date are rejected"""
        kst = pytz.timezone('Asia/Seoul')
        # Session on 2026-01-06 (after end date)
        session_time = kst.localize(datetime(2026, 1, 6, 14, 0, 0))
        
        is_valid, error = validate_session_date(session_time, raise_on_error=False)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_validate_session_date_raises_exception(self):
        """Test that validation raises exception when requested"""
        kst = pytz.timezone('Asia/Seoul')
        session_time = kst.localize(datetime(2026, 1, 6, 14, 0, 0))
        
        with self.assertRaises(SehanEndDateExceededError):
            validate_session_date(session_time, raise_on_error=True)
    
    @patch('utils.date_validator.datetime')
    def test_validate_current_date_for_sending_on_end_date(self, mock_datetime):
        """Test current date validation using mocked time"""
        kst = pytz.timezone('Asia/Seoul')
        # Mock current time to be 2026-01-05 15:00:00 KST
        mock_now = kst.localize(datetime(2026, 1, 5, 15, 0, 0))
        mock_datetime.now.return_value = mock_now
        mock_datetime.strptime = datetime.strptime  # Keep real strptime
        
        is_valid, error = validate_current_date_for_sending(raise_on_error=False)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    @patch('utils.date_validator.datetime')
    def test_validate_current_date_for_sending_before_end_date(self, mock_datetime):
        """Test current date validation before end date"""
        kst = pytz.timezone('Asia/Seoul')
        # Mock current time to be 2026-01-04 15:00:00 KST
        mock_now = kst.localize(datetime(2026, 1, 4, 15, 0, 0))
        mock_datetime.now.return_value = mock_now
        mock_datetime.strptime = datetime.strptime
        
        is_valid, error = validate_current_date_for_sending(raise_on_error=False)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_is_date_after_sehan_end_helper(self):
        """Test helper function for simple checks"""
        kst = pytz.timezone('Asia/Seoul')
        
        # Before end date
        session_before = kst.localize(datetime(2026, 1, 4, 14, 0, 0))
        self.assertFalse(is_date_after_sehan_end(session_before))
        
        # On end date
        session_on = kst.localize(datetime(2026, 1, 5, 14, 0, 0))
        self.assertTrue(is_date_after_sehan_end(session_on))
        
        # After end date
        session_after = kst.localize(datetime(2026, 1, 6, 14, 0, 0))
        self.assertTrue(is_date_after_sehan_end(session_after))
    
    def test_missing_sehan_end_date(self):
        """Test behavior when SEHAN_END_DATE is not set"""
        if 'SEHAN_END_DATE' in os.environ:
            del os.environ['SEHAN_END_DATE']
        clear_cache()
        
        kst = pytz.timezone('Asia/Seoul')
        session_time = kst.localize(datetime(2026, 1, 10, 14, 0, 0))
        
        # Should allow (fail open) when not configured
        is_valid, error = validate_session_date(session_time, raise_on_error=False)
        self.assertTrue(is_valid)


if __name__ == '__main__':
    unittest.main()





