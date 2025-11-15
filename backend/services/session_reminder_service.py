"""
Session reminder service for integrating Celery tasks with session scheduling
"""
from datetime import datetime, timedelta
from celery_app import celery_app
from tasks.session_reminder_tasks import send_session_reminder
import logging
import pytz

logger = logging.getLogger(__name__)

class SessionReminderService:
    """Service for managing session reminders using Celery"""
    
    def __init__(self):
        self.celery_app = celery_app
    
    def schedule_reminder(self, schedule_id, session_datetime, reminder_hours_before=24):
        """
        Schedule a reminder for a session.
        
        Args:
            schedule_id (int): The schedule ID
            session_datetime (datetime): When the session is scheduled
            reminder_hours_before (int): How many hours before to send reminder (default: 24)
            
        Returns:
            dict: Task information
        """
        try:
            # Just for debugging
            logger.info("I am inside schedule_reminder")
            # Get KST timezone
            kst = pytz.timezone('Asia/Seoul')
            
            # Ensure session_datetime is timezone-aware (KST)
            if session_datetime.tzinfo is None:
                session_datetime = kst.localize(session_datetime)
            elif session_datetime.tzinfo != kst:
                session_datetime = session_datetime.astimezone(kst)
            
            # Calculate when to send the reminder
            reminder_time = session_datetime - timedelta(hours=reminder_hours_before)
            now = datetime.now(kst)
            
            # --- Guard: Do not send if the session time is already in the past ---
            if session_datetime <= now:
                logger.info(
                    f"Skipping reminder for schedule {schedule_id} because session time {session_datetime} is in the past"
                )
                return {
                    'status': 'skipped',
                    'schedule_id': schedule_id,
                    'reminder_time': None,
                    'session_time': session_datetime.isoformat(),
                    'reason': 'Session time is in the past; no reminder sent'
                }
            
            # --- This is the crucial check ---
            if now >= reminder_time:
                # The reminder time is already in the past.
                # This means the session is less than 24 hours away.
                # So, execute the reminder task immediately.
                logger.info(f"Session {schedule_id} is less than {reminder_hours_before} hours away - executing reminder immediately")
                task = send_session_reminder.apply_async(args=[schedule_id])
                
                return {
                    'status': 'executed_immediately',
                    'task_id': task.id,
                    'schedule_id': schedule_id,
                    'reminder_time': 'immediate',
                    'session_time': session_datetime.isoformat(),
                    'reason': f'Session is less than {reminder_hours_before} hours away'
                }
            else:
                # The reminder time is still in the future.
                # Schedule the task to run at that exact future time.
                logger.info(f"Scheduling reminder for schedule {schedule_id} at {reminder_time}")
                task = send_session_reminder.apply_async(
                    args=[schedule_id],
                    eta=reminder_time
                )
                
                return {
                    'status': 'scheduled',
                    'task_id': task.id,
                    'schedule_id': schedule_id,
                    'reminder_time': reminder_time.isoformat(),
                    'session_time': session_datetime.isoformat()
                }
            
        except Exception as e:
            logger.error(f"Error scheduling reminder for schedule {schedule_id}: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'schedule_id': schedule_id
            }
    
    def cancel_reminder(self, schedule_id, reason=None):
        """
        Cancel a scheduled reminder (no notification sent).
        
        Args:
            schedule_id (int): The schedule ID
            reason (str): Reason for cancellation (not used, no message sent)
            
        Returns:
            dict: Operation result
        """
        try:
            # Note: We don't send cancellation notifications
            # The reminder task will check if the session is still scheduled when it runs
            # This is actually a good design as it handles edge cases
            
            logger.info(f"Cancelled session {schedule_id} - no notification sent")
            
            return {
                'status': 'cancelled',
                'schedule_id': schedule_id,
                'reason': reason,
                'message': 'Reminder cancelled - no notification sent'
            }
            
        except Exception as e:
            logger.error(f"Error cancelling session {schedule_id}: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'schedule_id': schedule_id
            }
    
    def reschedule_reminder(self, schedule_id, old_session_datetime, new_session_datetime, reminder_hours_before=24):
        """
        Reschedule a reminder for a session that was moved.
        
        Args:
            schedule_id (int): The schedule ID
            old_session_datetime (datetime): Original session time
            new_session_datetime (datetime): New session time
            reminder_hours_before (int): How many hours before to send reminder
            
        Returns:
            dict: Operation result
        """
        try:
            # Just for debugging
            logger.info("I am inside schedule_reminder")
            
            # Cancel the old reminder (no notification sent) and schedule a new one
            cancel_result = self.cancel_reminder(schedule_id, "Session rescheduled")
            
            # Use the updated schedule_reminder method which handles immediate execution
            schedule_result = self.schedule_reminder(schedule_id, new_session_datetime, reminder_hours_before)
            
            logger.info(f"Rescheduled reminder for schedule {schedule_id} - new status: {schedule_result.get('status')}")
            
            return {
                'status': 'rescheduled',
                'schedule_id': schedule_id,
                'old_session_time': old_session_datetime.isoformat(),
                'new_session_time': new_session_datetime.isoformat(),
                'cancellation_result': cancel_result,
                'new_reminder_result': schedule_result
            }
            
        except Exception as e:
            logger.error(f"Error rescheduling reminder for schedule {schedule_id}: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'schedule_id': schedule_id
            }
    
    def get_task_status(self, task_id):
        """
        Get the status of a Celery task.
        
        Args:
            task_id (str): The task ID
            
        Returns:
            dict: Task status information
        """
        try:
            task = self.celery_app.AsyncResult(task_id)
            
            return {
                'task_id': task_id,
                'status': task.status,
                'result': task.result,
                'traceback': task.traceback
            }
            
        except Exception as e:
            logger.error(f"Error getting task status for {task_id}: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'task_id': task_id
            }
