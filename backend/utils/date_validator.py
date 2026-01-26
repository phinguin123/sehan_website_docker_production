"""
Centralized date validation utility for SEHAN system.
Provides robust date validation with SEHAN_END_DATE checks.
"""
import os
import pytz
from datetime import datetime, date
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Timezone for all date operations
KST = pytz.timezone('Asia/Seoul')

# Cache for SEHAN_END_DATE to avoid repeated environment lookups
_SEHAN_END_DATE: Optional[date] = None
_SEHAN_END_DATE_STR: Optional[str] = None


class DateValidationError(Exception):
    """Custom exception for date validation errors"""
    pass


class SehanEndDateExceededError(DateValidationError):
    """Raised when a date is after SEHAN_END_DATE"""
    pass


def _get_sehan_end_date() -> Tuple[Optional[date], Optional[str]]:
    """
    Get SEHAN_END_DATE from environment and parse it.
    Uses caching to avoid repeated parsing.
    
    Returns:
        Tuple of (date object, original string) or (None, None) if not set
    """
    global _SEHAN_END_DATE, _SEHAN_END_DATE_STR
    
    # Check cache first
    if _SEHAN_END_DATE is not None or _SEHAN_END_DATE_STR is not None:
        return _SEHAN_END_DATE, _SEHAN_END_DATE_STR
    
    # Get from environment
    sehan_end_date_str = os.environ.get("SEHAN_END_DATE")
    
    if not sehan_end_date_str:
        logger.warning("SEHAN_END_DATE not set in environment variables")
        _SEHAN_END_DATE_STR = None
        _SEHAN_END_DATE = None
        return None, None
    
    try:
        # Parse date (assumes format YYYY-MM-DD)
        parsed_date = datetime.strptime(sehan_end_date_str.strip(), "%Y-%m-%d").date()
        # Cache the result
        _SEHAN_END_DATE = parsed_date
        _SEHAN_END_DATE_STR = sehan_end_date_str
        logger.info(f"SEHAN_END_DATE loaded: {parsed_date}")
        return parsed_date, sehan_end_date_str
    except ValueError as e:
        logger.error(f"Invalid SEHAN_END_DATE format: {sehan_end_date_str}, error: {str(e)}")
        _SEHAN_END_DATE_STR = sehan_end_date_str
        _SEHAN_END_DATE = None
        return None, sehan_end_date_str


def clear_cache():
    """Clear the cached SEHAN_END_DATE (useful for testing or when env changes)"""
    global _SEHAN_END_DATE, _SEHAN_END_DATE_STR
    _SEHAN_END_DATE = None
    _SEHAN_END_DATE_STR = None


def validate_session_date(session_datetime: datetime, raise_on_error: bool = True) -> Tuple[bool, Optional[str]]:
    """
    Validate that a session datetime is not after SEHAN_END_DATE.
    
    Args:
        session_datetime: The session datetime to validate (timezone-aware or naive)
        raise_on_error: If True, raises SehanEndDateExceededError on validation failure
        
    Returns:
        Tuple of (is_valid, error_message)
        - is_valid: True if date is valid, False otherwise
        - error_message: None if valid, error message if invalid
        
    Raises:
        SehanEndDateExceededError: If raise_on_error=True and date is after SEHAN_END_DATE
    """
    # Ensure timezone-aware datetime in KST
    if session_datetime.tzinfo is None:
        session_datetime = KST.localize(session_datetime)
    elif session_datetime.tzinfo != KST:
        session_datetime = session_datetime.astimezone(KST)
    
    # Get SEHAN_END_DATE
    end_date, end_date_str = _get_sehan_end_date()
    
    if end_date is None:
        # If SEHAN_END_DATE is not set, log warning but allow (fail open)
        logger.warning("SEHAN_END_DATE not configured - allowing session date")
        return True, None
    
    # Compare dates (not times)
    # Use >= to include the end date itself (messages should stop ON the end date)
    session_date = session_datetime.date()
    
    if session_date >= end_date:
        error_msg = f"Session date {session_date} is on or after SEHAN_END_DATE {end_date}"
        logger.warning(error_msg)
        
        if raise_on_error:
            raise SehanEndDateExceededError(error_msg)
        
        return False, error_msg
    
    return True, None


def validate_current_date_for_sending(raise_on_error: bool = True) -> Tuple[bool, Optional[str]]:
    """
    Validate that the current date is not after SEHAN_END_DATE.
    Used to check if reminders/messages should be sent.
    
    Args:
        raise_on_error: If True, raises SehanEndDateExceededError on validation failure
        
    Returns:
        Tuple of (is_valid, error_message)
        - is_valid: True if current date is valid, False otherwise
        - error_message: None if valid, error message if invalid
        
    Raises:
        SehanEndDateExceededError: If raise_on_error=True and current date is after SEHAN_END_DATE
    """
    now = datetime.now(KST)
    end_date, end_date_str = _get_sehan_end_date()
    
    if end_date is None:
        # If SEHAN_END_DATE is not set, log warning but allow (fail open)
        logger.warning("SEHAN_END_DATE not configured - allowing message sending")
        return True, None
    
    # Compare dates (not times)
    # Use >= to include the end date itself (messages should stop ON the end date)
    current_date = now.date()
    
    if current_date >= end_date:
        error_msg = f"Current date {current_date} is on or after SEHAN_END_DATE {end_date}"
        logger.warning(error_msg)
        
        if raise_on_error:
            raise SehanEndDateExceededError(error_msg)
        
        return False, error_msg
    
    return True, None


def is_date_after_sehan_end(session_datetime: datetime) -> bool:
    """
    Simple check: returns True if session date is after SEHAN_END_DATE.
    Does not raise exceptions, useful for conditional logic.
    
    Args:
        session_datetime: The session datetime to check
        
    Returns:
        True if date is after SEHAN_END_DATE, False otherwise
    """
    is_valid, _ = validate_session_date(session_datetime, raise_on_error=False)
    return not is_valid


def is_current_date_after_sehan_end() -> bool:
    """
    Simple check: returns True if current date is after SEHAN_END_DATE.
    Does not raise exceptions, useful for conditional logic.
    
    Returns:
        True if current date is after SEHAN_END_DATE, False otherwise
    """
    is_valid, _ = validate_current_date_for_sending(raise_on_error=False)
    return not is_valid


def get_sehan_end_date() -> Optional[date]:
    """
    Get the SEHAN_END_DATE as a date object.
    
    Returns:
        date object or None if not configured
    """
    end_date, _ = _get_sehan_end_date()
    return end_date


def get_sehan_end_date_str() -> Optional[str]:
    """
    Get the SEHAN_END_DATE as a string.
    
    Returns:
        string or None if not configured
    """
    _, end_date_str = _get_sehan_end_date()
    return end_date_str

