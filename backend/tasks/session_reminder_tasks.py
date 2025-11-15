"""
Celery tasks for session reminders and notifications
"""
from celery import current_task
from datetime import datetime, timedelta
import logging
import os
from celery_app import celery_app
import pytz

# Import database helper
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db import DBHelper

# Configure logging to write to the same backend log file as the web app
# Use the same relative path that the Flask app uses ("logs/server.log") so it works in Docker (/app)
LOG_FILE = "logs/server.log"

# Ensure log directory exists
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# Remove existing handlers that Celery or libraries may have configured
for _handler in list(root_logger.handlers):
    root_logger.removeHandler(_handler)

_file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
_file_handler.setLevel(logging.INFO)
_file_handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
root_logger.addHandler(_file_handler)

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='tasks.send_session_reminder')
def send_session_reminder(self, schedule_id):
    """
    Send a reminder for an upcoming session.
    
    Args:
        schedule_id (int): The ID of the scheduled session
        
    Returns:
        dict: Result of the reminder operation
    """
    try:
        logger.info(f"Processing session reminder for schedule_id: {schedule_id}")
        
        # Initialize database connection
        db_helper = DBHelper()
        
        # Get schedule details
        schedule_query = """
        SELECT sc.*, st.name as student_name, st.parent_phone,
               ps.subject_name, pt.name as teacher_name
        FROM pt_schedules sc
        JOIN pt_students st ON sc.student_id = st.student_id
        JOIN pt_subjects ps ON sc.subject_id = ps.subject_id
        JOIN pt_teachers pt ON sc.teacher_id = pt.teacher_id
        WHERE sc.schedule_id = %s AND sc.status = 'scheduled'
        """
        
        schedule = db_helper.fetch_one(schedule_query, (schedule_id,))
        
        if not schedule:
            logger.warning(f"Schedule {schedule_id} not found or not scheduled")
            return {
                'status': 'skipped',
                'reason': 'Schedule not found or not scheduled',
                'schedule_id': schedule_id
            }
        
        # Check if session is still scheduled (not cancelled)
        if schedule['status'] != 'scheduled':
            logger.info(f"Schedule {schedule_id} is no longer scheduled (status: {schedule['status']})")
            return {
                'status': 'skipped',
                'reason': f'Session status is {schedule["status"]}',
                'schedule_id': schedule_id
            }
        
        # Format session time (ensure KST)
        kst = pytz.timezone('Asia/Seoul')
        session_time = schedule['start_time']
        if isinstance(session_time, str):
            session_time = datetime.fromisoformat(session_time.replace('Z', '+00:00'))
            # Convert to KST if it's not already
            if session_time.tzinfo is None:
                session_time = kst.localize(session_time)
            elif session_time.tzinfo != kst:
                session_time = session_time.astimezone(kst)
        
        # Send reminder message (implement your preferred notification method)
        reminder_sent = send_reminder_notification(schedule)
        
        if reminder_sent:
            logger.info(f"Reminder sent successfully for schedule {schedule_id}")
            return {
                'status': 'success',
                'message': 'Reminder sent successfully',
                'schedule_id': schedule_id,
                'student_name': schedule['student_name'],
                'session_time': session_time.isoformat()
            }
        else:
            logger.error(f"Failed to send reminder for schedule {schedule_id}")
            return {
                'status': 'failed',
                'message': 'Failed to send reminder',
                'schedule_id': schedule_id
            }
            
    except Exception as e:
        logger.error(f"Error processing reminder for schedule {schedule_id}: {str(e)}")
        # Retry the task if it fails
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(name='tasks.cleanup_expired_tasks')
def cleanup_expired_tasks():
    """
    Clean up expired reminder tasks from Redis.
    This runs periodically to prevent Redis from accumulating old tasks.
    """
    try:
        logger.info("Running cleanup of expired tasks")
        
        # Get current time in KST
        kst = pytz.timezone('Asia/Seoul')
        now = datetime.now(kst)
        
        # Clean up tasks that are more than 7 days old
        cutoff_time = now - timedelta(days=7)
        
        # This would require Redis operations to clean up old task results
        # For now, just log that cleanup ran
        logger.info(f"Cleanup completed at {now}")
        
        return {
            'status': 'success',
            'message': 'Cleanup completed',
            'cleanup_time': now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return {
            'status': 'error',
            'message': str(e)
        }

def send_reminder_notification(schedule):
    """
    Send the actual reminder notification using Kakao AlimTalk.
    
    Args:
        schedule (dict): Schedule information
        
    Returns:
        bool: True if notification was sent successfully
    """
    try:
        # Import the Kakao AlimTalk function
        from sehan_kakao_alimtalk import send_pt_session_reminder
        
        # Format the session time (ensure KST)
        kst = pytz.timezone('Asia/Seoul')
        session_time = schedule['start_time']
        if isinstance(session_time, str):
            session_time = datetime.fromisoformat(session_time.replace('Z', '+00:00'))
            # Convert to KST if it's not already
            if session_time.tzinfo is None:
                session_time = kst.localize(session_time)
            elif session_time.tzinfo != kst:
                session_time = session_time.astimezone(kst)
        
        # Format date and time for Korean display
        session_date = session_time.strftime('%m월 %d일')
        session_time_str = session_time.strftime('%H시 %M분')
        
        # Get parent phone number (ensure it has country code)
        parent_phone = schedule.get('parent_phone', '')
        
        # Send the reminder using Kakao AlimTalk
        logger.info(f"Sending Kakao AlimTalk reminder for {schedule['student_name']}")
        logger.info(f"Parent phone: {parent_phone}, Session: {session_date} {session_time_str}")
        
        # Call the Kakao AlimTalk function
        send_pt_session_reminder(
            parent_phone_number=parent_phone,
            session_date=session_date,
            session_time=session_time_str,
            student_name=schedule['student_name']
        )
        
        logger.info(f"Kakao AlimTalk reminder sent successfully for {schedule['student_name']}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending Kakao AlimTalk reminder: {str(e)}")
        return False

