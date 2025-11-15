"""
Schedule management routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required
from datetime import datetime

from .common import schedule_dao
from services.session_reminder_service import SessionReminderService

# Create schedules namespace
from flask_restx import Namespace
schedules_ns = Namespace('schedules', description='Schedule management operations')

# Initialize reminder service
reminder_service = SessionReminderService()

# API Models for schedules
schedule_model = schedules_ns.model('Schedule', {
    'application_id': fields.Integer(required=True, description='Application ID'),
    'student_id': fields.Integer(required=True, description='Student ID'),
    'teacher_id': fields.Integer(required=True, description='Teacher ID'),
    'subject_id': fields.Integer(required=True, description='Subject ID'),
    'start_time': fields.DateTime(required=True, description='Scheduled session start time'),
    'end_time': fields.DateTime(description='Scheduled session end time'),
    'scheduled_duration': fields.Float(default=1.0, description='Session duration in hours'),
    'status': fields.String(default='scheduled', description='Schedule status'),
    'notes': fields.String(description='Schedule notes'),
    'display_title': fields.String(description='Custom display title for calendar/event'),
    'color': fields.String(description='Hex color for calendar badge/event')
})

# API model for scheduling a single session on the calendar
schedule_model = schedules_ns.model('Schedule', {
    'schedule_id': fields.Integer(
        description='Schedule ID (auto-generated)'
    ),
    'application_id': fields.Integer(
        required=True, 
        description='The application package this session belongs to'
    ),
    'student_id': fields.Integer(
        required=True, 
        description='Student ID'
    ),
    'teacher_id': fields.Integer(
        required=True, 
        description='Teacher ID'
    ),
    'subject_id': fields.Integer(
        required=True, 
        description='Subject ID'
    ),
    'start_time': fields.DateTime(
        required=True, 
        description='The specific date and time for the session start (e.g., "2025-10-28T14:00:00")'
    ),
    'end_time': fields.DateTime(
        description='The end time for the session (calculated from start_time + duration)'
    ),
    'scheduled_duration': fields.Float(
        description='Session duration in hours (e.g., 1.0, 1.5)'
    ),
    'status': fields.String(
        description='Schedule status (scheduled, cancelled, completed)'
    ),
    'notes': fields.String(
        description='Any notes specific to this scheduled class'
    ),
    'student_name': fields.String(
        description='Student name (from join)'
    ),
    'subject_name': fields.String(
        description='Subject name (from join)'
    ),
    'teacher_name': fields.String(
        description='Teacher name (from join)'
    ),
    'display_title': fields.String(
        description='Custom display title for calendar/event'
    ),
    'color': fields.String(
        description='Hex color for calendar badge/event'
    )
})

@schedules_ns.route('')
class ScheduleList(Resource):
    @schedules_ns.marshal_list_with(schedule_model)
    @jwt_required()
    def get(self):
        """Get all schedules"""
        try:
            schedules = schedule_dao.get_all_schedules()
            return schedules, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @schedules_ns.expect(schedule_model)
    @jwt_required()
    def post(self):
        """Create a new schedule"""
        connection = None
        try:
            data = request.json
            
            # Validate that the application has remaining sessions
            application_id = data.get('application_id')
            if application_id:
                # Get application details and remaining sessions
                application = schedule_dao.get_application_by_id(application_id)
                if not application:
                    return {'error': 'Application not found'}, 404
                
                # Check if application is active
                if application.get('status') != 'active':
                    return {'error': 'Cannot schedule session for inactive application'}, 400
                
                # Calculate remaining sessions
                remaining_sessions = schedule_dao.get_application_remaining_sessions(application_id)
                if remaining_sessions <= 0:
                    return {'error': 'No remaining sessions available for this application'}, 400
            
            # Start transaction
            connection = schedule_dao.db.begin_transaction()
            
            # Create the schedule within transaction
            schedule_id = schedule_dao.create_schedule(data, connection)
            
            # Schedule a reminder for the session (this might fail, but we'll handle it gracefully)
            try:
                scheduled_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
                reminder_result = reminder_service.schedule_reminder(
                    schedule_id=schedule_id,
                    session_datetime=scheduled_time,
                    reminder_hours_before=24  # Send reminder 24 hours before
                )
                
                response_data = {
                    'schedule_id': schedule_id, 
                    'message': 'Schedule created successfully',
                    'reminder_status': reminder_result.get('status'),
                    'reminder_scheduled': reminder_result.get('status') in ['scheduled', 'executed_immediately'],
                    'reminder_task_id': reminder_result.get('task_id'),
                    'reminder_reason': reminder_result.get('reason')
                }
            except Exception as reminder_error:
                # If reminder scheduling fails, log it but don't fail the entire operation
                print(f"Warning: Failed to schedule reminder for schedule {schedule_id}: {str(reminder_error)}")
                response_data = {
                    'schedule_id': schedule_id, 
                    'message': 'Schedule created successfully (reminder scheduling failed)',
                    'reminder_status': 'failed',
                    'reminder_scheduled': False,
                    'reminder_error': str(reminder_error)
                }
            
            # Commit the transaction
            schedule_dao.db.commit_transaction(connection)
            connection = None  # Prevent rollback in finally block
            
            return response_data, 201
            
        except Exception as e:
            # Rollback transaction if it was started
            if connection:
                schedule_dao.db.rollback_transaction(connection)
            return {'error': str(e)}, 500

@schedules_ns.route('/<int:schedule_id>')
class ScheduleDetail(Resource):
    @jwt_required()
    def get(self, schedule_id):
        """Get a specific schedule"""
        try:
            schedule = schedule_dao.get_schedule_by_id(schedule_id)
            if not schedule:
                return {'error': 'Schedule not found'}, 404
            return schedule, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @schedules_ns.expect(schedule_model)
    @jwt_required()
    def put(self, schedule_id):
        """Update a schedule"""
        connection = None
        try:
            data = request.json
            
            # Get current schedule for comparison
            current_schedule = schedule_dao.get_schedule_by_id(schedule_id)
            if not current_schedule:
                return {'error': 'Schedule not found'}, 404
            
            # Start transaction
            connection = schedule_dao.db.begin_transaction()
            
            # Update the schedule within transaction
            schedule_dao.update_schedule(schedule_id, data, connection)
            
            # Handle reminder rescheduling if time changed
            try:
                old_time = current_schedule['start_time']
                new_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
                
                if old_time != new_time:
                    # Reschedule the reminder
                    reminder_result = reminder_service.reschedule_reminder(
                        schedule_id=schedule_id,
                        old_session_datetime=old_time,
                        new_session_datetime=new_time,
                        reminder_hours_before=24
                    )
                    
                    response_data = {
                        'message': 'Schedule updated successfully',
                        'reminder_rescheduled': reminder_result.get('status') == 'rescheduled',
                        'new_reminder_status': reminder_result.get('new_reminder_result', {}).get('status'),
                        'new_reminder_task_id': reminder_result.get('new_reminder_result', {}).get('task_id'),
                        'new_reminder_reason': reminder_result.get('new_reminder_result', {}).get('reason')
                    }
                else:
                    response_data = {'message': 'Schedule updated successfully'}
            except Exception as reminder_error:
                # If reminder rescheduling fails, log it but don't fail the entire operation
                print(f"Warning: Failed to reschedule reminder for schedule {schedule_id}: {str(reminder_error)}")
                response_data = {
                    'message': 'Schedule updated successfully (reminder rescheduling failed)',
                    'reminder_error': str(reminder_error)
                }
            
            # Commit the transaction
            schedule_dao.db.commit_transaction(connection)
            connection = None  # Prevent rollback in finally block
            
            return response_data, 200
            
        except Exception as e:
            # Rollback transaction if it was started
            if connection:
                schedule_dao.db.rollback_transaction(connection)
            return {'error': str(e)}, 500

    @jwt_required()
    def delete(self, schedule_id):
        """Delete a schedule"""
        try:
            # Get schedule details before deleting
            schedule = schedule_dao.get_schedule_by_id(schedule_id)
            if not schedule:
                return {'error': 'Schedule not found'}, 404
            
            # Cancel the reminder first (no notification sent)
            reminder_result = reminder_service.cancel_reminder(
                schedule_id=schedule_id,
                reason="Session deleted"
            )
            
            # Actually delete the schedule from the database
            schedule_dao.delete_schedule(schedule_id)
            
            return {
                'message': 'Schedule deleted successfully',
                'reminder_cancelled': reminder_result.get('status') == 'cancelled'
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

@schedules_ns.route('/today')
class TodaysSchedules(Resource):
    @jwt_required()
    def get(self):
        """Get today's schedules"""
        try:
            schedules = schedule_dao.get_todays_schedules()
            return schedules, 200
        except Exception as e:
            return {'error': str(e)}, 500

@schedules_ns.route('/<int:schedule_id>/reminder-status')
class ScheduleReminderStatus(Resource):
    @jwt_required()
    def get(self, schedule_id):
        """Get reminder status for a schedule"""
        try:
            # This would require storing task IDs in the database
            # For now, we'll return a placeholder response
            return {
                'schedule_id': schedule_id,
                'reminder_scheduled': True,
                'message': 'Reminder status endpoint - implement task ID storage for full functionality'
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500
