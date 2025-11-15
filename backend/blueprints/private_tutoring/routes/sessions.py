"""
Session management routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from .common import session_dao, db_helper, PTSessionDAO

def validate_session_amount(amount, field_name="sessions"):
    """Validate that session amount is a positive multiple of 0.5"""
    try:
        amount_float = float(amount)
        if amount_float <= 0:
            return False, f"{field_name} must be positive"
        if amount_float % 0.5 != 0:
            return False, f"{field_name} must be a multiple of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)"
        return True, None
    except (ValueError, TypeError):
        return False, f"Invalid {field_name} amount"

# Create sessions namespace
from flask_restx import Namespace
sessions_ns = Namespace('sessions', description='Session management operations')

# API Models for sessions
session_application_model = sessions_ns.model('SessionApplication', {
    'student_id': fields.Integer(required=True, description='Student ID'),
    'subject_id': fields.Integer(required=True, description='Subject ID'),
    'initial_sessions': fields.Integer(required=True, description='Initial number of sessions'),
    'application_type': fields.String(description='Type: initial, additional, transfer'),
    'notes': fields.String(description='Application notes')
})

session_start_model = sessions_ns.model('SessionStart', {
    'application_id': fields.Integer(required=True, description='Application ID'),
    'schedule_id': fields.Integer(description='Schedule ID if created from schedule'),
    'student_id': fields.Integer(required=True, description='Student ID'),
    'grade_id': fields.Integer(required=True, description='Grade ID'),
    'teacher_id': fields.Integer(required=True, description='Teacher ID'),
    'subject_id': fields.Integer(required=True, description='Subject ID'),
    'start_time': fields.DateTime(required=True, description='Session start time'),
    'end_time': fields.DateTime(required=True, description='Session end time'),
    'duration_hours': fields.Float(required=True, description='Session duration (0.5, 1.0, 1.5, 2.0)'),
    'session_notes': fields.String(description='Initial session notes')
})

session_end_model = sessions_ns.model('SessionEnd', {
    'session_notes': fields.String(description='Session summary/notes'),
    'notify_parent': fields.Boolean(default=True, description='Send notification to parent')
})

session_complete_model = sessions_ns.model('SessionComplete', {
    'application_id': fields.Integer(description='Application ID (optional, will be auto-detected if not provided)'),
    'schedule_id': fields.Integer(description='Schedule ID if created from schedule'),
    'student_id': fields.Integer(required=True, description='Student ID'),
    'grade_id': fields.Integer(description='Grade ID (optional, will be auto-detected from student if not provided)'),
    'teacher_id': fields.Integer(description='Teacher ID (optional, will use authenticated teacher)'),
    'subject_id': fields.Integer(required=True, description='Subject ID'),
    'session_date': fields.String(required=True, description='Session date (YYYY-MM-DD format)'),
    'session_time': fields.String(required=True, description='Session time (HH:MM format)'),
    'duration_hours': fields.Float(required=True, description='Session duration (0.5, 1.0, 1.5, 2.0)'),
    'session_notes': fields.String(required=True, description='Session comments and feedback'),
    'status': fields.String(description='Session status', enum=['completed', 'cancelled', 'no_show', 'teacher_cancelled'], default='completed')
})

# Session Application Routes
@sessions_ns.route('/applications')
class SessionApplicationList(Resource):
    @jwt_required()
    def get(self):
        """Get all session applications"""
        try:
            applications = session_dao.get_all_applications()
            return applications, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @sessions_ns.expect(session_application_model)
    @jwt_required()
    def post(self):
        """Create a new session application"""
        try:
            data = request.json
            
            # Validate required fields
            if not data.get('student_id') or not data.get('subject_id') or not data.get('initial_sessions'):
                return {'error': 'student_id, subject_id, and initial_sessions are required'}, 400
            
            # Validate session amount
            is_valid, error_msg = validate_session_amount(data.get('initial_sessions'), 'initial_sessions')
            if not is_valid:
                return {'error': error_msg}, 400
            
            application_id = session_dao.create_session_application(data)
            
            # Create initial ledger entry for the purchase
            ledger_data = {
                'application_id': application_id,
                'transaction_type': 'purchase',
                'sessions_changed': data.get('initial_sessions'),
                'notes': f"Initial purchase of {data.get('initial_sessions')} sessions"
            }
            session_dao.create_ledger_entry(ledger_data)
            
            return {'application_id': application_id, 'message': 'Session application created'}, 201
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/applications/<int:application_id>')
class SessionApplication(Resource):
    @jwt_required()
    def put(self, application_id):
        """Update session application (add/reduce sessions)"""
        try:
            data = request.json
            new_total = data.get('initial_sessions')
            notes = data.get('notes')
            
            if new_total is None:
                return {'error': 'initial_sessions is required'}, 400
            
            # Get current application to calculate difference
            application = session_dao.get_application_by_id(application_id)
            if not application:
                return {'error': 'Application not found'}, 404
            
            current_total = application['initial_sessions']
            difference = new_total - current_total
            
            if difference != 0:
                # Update the application
                session_dao.update_session_application(application_id, new_total, notes)
                
                # Create ledger entry for the change
                transaction_type = 'credit' if difference > 0 else 'usage'
                ledger_data = {
                    'application_id': application_id,
                    'transaction_type': transaction_type,
                    'sessions_changed': abs(difference),
                    'notes': notes or f"Session balance adjusted by {difference}"
                }
                session_dao.create_ledger_entry(ledger_data)
            
            return {'message': 'Session application updated'}, 200
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

    @jwt_required()
    def delete(self, application_id):
        """Cancel/delete a session application"""
        try:
            # Check if there are any completed sessions for this application
            completed_count = session_dao.get_completed_sessions_count_by_application(application_id)
            if completed_count > 0:
                return {
                    'error': f'Cannot delete application with {completed_count} completed sessions. '
                             'Please contact administrator to handle this case.'
                }, 400
            
            # Check if application exists and get details for response
            application = session_dao.get_application_by_id(application_id)
            if not application:
                return {'error': 'Session application not found'}, 404
            
            # Delete the application
            session_dao.delete_session_application(application_id)
            
            return {
                'message': f'Application deleted successfully for student {application["student_name"]} ({application["subject_name"]})'
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/applications/<int:application_id>/transfer-sibling')
class TransferToSibling(Resource):
    @jwt_required()
    def post(self, application_id):
        """Transfer remaining sessions to a sibling (another student)."""
        try:
            data = request.json
            to_student_id = data.get('to_student_id')
            to_subject_id = data.get('to_subject_id')
            sessions_to_transfer = data.get('sessions_to_transfer')
            reason = data.get('transfer_reason', 'Sibling transfer')

            if not to_student_id or not to_subject_id or not sessions_to_transfer:
                return {'error': 'to_student_id, to_subject_id, and sessions_to_transfer are required'}, 400

            result = session_dao.transfer_remaining_to_sibling(
                application_id, int(to_student_id), int(to_subject_id), int(sessions_to_transfer), reason
            )

            return {
                'message': f"{result['transferred_sessions']} sessions transferred to student #{result['to_student_id']} ({result['subject_name']})",
                'new_application_id': result['new_application_id']
            }, 200
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/applications/<int:application_id>/refund')
class PartialRefund(Resource):
    @jwt_required()
    def post(self, application_id):
        """Process partial refund for remaining sessions"""
        try:
            data = request.json
            refund_amount = data.get('refund_amount')
            refund_reason = data.get('refund_reason', 'Partial refund')
            
            if not refund_amount:
                return {'error': 'refund_amount is required'}, 400
            
            result = session_dao.process_partial_refund(application_id, refund_amount, refund_reason)
            
            return {
                'message': f'Refund processed: ${refund_amount} for {result["remaining_sessions"]} remaining sessions',
                'remaining_sessions': result['remaining_sessions']
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/applications/<int:application_id>/transfer')
class TransferSessions(Resource):
    @jwt_required()
    def post(self, application_id):
        """Transfer sessions to another student/subject"""
        try:
            data = request.json
            to_student_id = data.get('to_student_id')
            to_subject_id = data.get('to_subject_id')
            sessions_to_transfer = data.get('sessions_to_transfer')
            
            if not all([to_student_id, to_subject_id, sessions_to_transfer]):
                return {'error': 'to_student_id, to_subject_id, and sessions_to_transfer are required'}, 400
            
            result = session_dao.transfer_sessions(
                application_id, to_student_id, to_subject_id, sessions_to_transfer
            )
            
            return {
                'message': f'{sessions_to_transfer} sessions transferred successfully',
                'new_application_id': result['new_application_id']
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

# Session Management Routes
@sessions_ns.route('')  # This is the main /api/sessions endpoint
class SessionList(Resource):
    @jwt_required()
    def get(self):
        """
        Get all sessions, filterable by status.
        Defaults to 'completed' for the main history view.
        """
        try:
            # Get the status from the query parameter, e.g., ?status=completed
            status = request.args.get('status', 'completed')

            if status == 'completed':
                # For the history page, call our new, optimized DAO function
                sessions = session_dao.get_session_summaries()
                return {'sessions': sessions}, 200
            
            # You can add more conditions here in the future
            # elif status == 'scheduled':
            #     sessions = dao.get_scheduled_sessions()
            #     return {'sessions': sessions}, 200

            else:
                return {'error': f'Unsupported status: {status}'}, 400
            
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/active')
class ActiveSessions(Resource):
    @jwt_required()
    def get(self):
        """Get currently active sessions"""
        try:
            active_sessions = session_dao.get_active_sessions()
            return active_sessions, 200
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/<int:session_id>/end')
class EndSession(Resource):
    @sessions_ns.expect(session_end_model)
    @jwt_required()
    def post(self, session_id):
        """End an active session"""
        try:
            data = request.json
            teacher_id = get_jwt_identity()
            
            result = session_dao.end_session(session_id, data, teacher_id)
            
            if result['status'] == 'success':
                return {'message': 'Session ended successfully', 'audit_id': result['audit_id']}, 200
            else:
                return {'error': result['message']}, 400
                
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/complete')
class SessionComplete(Resource):
    @sessions_ns.expect(session_complete_model)
    @jwt_required()
    def post(self):
        """Complete a session directly (for completed sessions)"""
        try:
            data = request.json
            teacher_id = get_jwt_identity()
            
            # Convert subject name to subject_id if needed
            if 'subject' in data and 'subject_id' not in data:
                subject_query = "SELECT subject_id FROM pt_subjects WHERE subject_name = %s"
                subject_result = db_helper.fetch_one(subject_query, (data['subject'],))
                if not subject_result:
                    return {'error': f'Subject "{data["subject"]}" not found'}, 400
                data['subject_id'] = subject_result['subject_id']
            
            result = session_dao.complete_session_direct(data, teacher_id)
            
            if result['status'] == 'success':
                return {'message': 'Session completed successfully', 'audit_id': result['audit_id']}, 200
            else:
                return {'error': result['message']}, 400
                
        except Exception as e:
            return {'error': str(e)}, 500

# You can now DELETE the entire `SessionHistory` class that was at the '/history' route.

@sessions_ns.route('/summary')
class SessionSummary(Resource):
    @jwt_required()
    def get(self):
        """Get session summary statistics"""
        try:
            summary = session_dao.get_session_summary()
            return summary, 200
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/<int:session_id>')
class UpdateSession(Resource):
    @jwt_required()
    def put(self, session_id):
        """Update session details with proper audit trail (comments, duration, date, time, subject, student, teacher)"""
        try:
            data = request.json
            current_teacher_id = get_jwt_identity()
            
            # Validate required fields
            required_fields = ['session_date', 'session_time', 'duration_hours', 'session_notes']
            for field in required_fields:
                if not data.get(field):
                    return {'error': f'Missing required field: {field}'}, 400
            
            # Validate duration
            valid_durations = [0.5, 1.0, 1.5, 2.0]
            if data.get('duration_hours') not in valid_durations:
                return {'error': 'Duration must be 0.5, 1.0, 1.5, or 2.0 hours'}, 400
            
            # Use the new method with proper audit trail and transaction handling using session_id
            result = session_dao.update_session_with_audit_by_session_id(session_id, data, current_teacher_id)
            
            if result['status'] == 'success':
                return {
                    'status': 'success',
                    'message': result['message'],
                    'session_id': session_id
                }, 200
            else:
                return {'error': result['message']}, 400
            
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/<int:session_id>/audit')
class SessionAudit(Resource):
    @jwt_required()
    def get(self, session_id):
        """Get the detailed audit trail for a specific session."""
        try:
            # This now calls your simple, correct DAO function.
            audit_trail = session_dao.get_audit_trail_for_session(session_id)
            
            if audit_trail is None:
                return {'error': 'Audit trail not found for this session'}, 404
            
            return {'audit_trail': audit_trail}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
@sessions_ns.route('/edit-data')
class SessionEditData(Resource):
    @jwt_required()
    def get(self):
        """Get data needed for session editing (students, subjects, teachers)"""
        try:
            # Get all students
            students_query = "SELECT student_id, name FROM pt_students ORDER BY name"
            students = db_helper.fetch_all(students_query)
            
            # Get all subjects
            subjects_query = "SELECT subject_id, subject_name FROM pt_subjects ORDER BY subject_name"
            subjects = db_helper.fetch_all(subjects_query)
            
            # Get all teachers
            teachers_query = "SELECT teacher_id, name FROM pt_teachers ORDER BY name"
            teachers = db_helper.fetch_all(teachers_query)
            
            return {
                'students': students,
                'subjects': subjects,
                'teachers': teachers
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/session-balances')
class SessionBalances(Resource):
    @jwt_required()
    def get(self):
        """Get current session balances for all students"""
        try:
            balances = session_dao.get_student_subject_progress()
            
            # Calculate summary statistics with error handling
            if not balances:
                return {
                    'balances': [],
                    'summary': {
                        'total_active_sessions': 0,
                        'total_applied_sessions': 0,
                        'total_completed_sessions': 0
                    }
                }, 200
            
            # Calculate summary statistics - map the new field names from ledger-based query
            total_active_sessions = sum(balance.get('remaining_sessions', 0) for balance in balances)
            total_applied_sessions = sum(balance.get('total_sessions', 0) for balance in balances)  # Maps to total_sessions from ledger
            total_completed_sessions = sum(balance.get('completed_sessions', 0) for balance in balances)
            
            return {
                'balances': balances,
                'summary': {
                    'total_active_sessions': total_active_sessions,
                    'total_applied_sessions': total_applied_sessions,
                    'total_completed_sessions': total_completed_sessions
                }
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/balances/refund')
class RefundSessions(Resource):
    @jwt_required()
    def post(self):
        """Process refund for sessions"""
        try:
            data = request.json
            student_id = data.get('student_id')
            subject_id = data.get('subject_id')
            sessions_to_refund = data.get('sessions_to_refund')
            refund_reason = data.get('refund_reason', 'Refund requested')
            
            if not all([student_id, subject_id, sessions_to_refund]):
                return {'error': 'student_id, subject_id, and sessions_to_refund are required'}, 400
            
            # Validate session amount
            is_valid, error_msg = validate_session_amount(sessions_to_refund, 'sessions_to_refund')
            if not is_valid:
                return {'error': error_msg}, 400
            
            # Get current balance first
            current_balance = session_dao.get_student_subject_balance(student_id, subject_id)
            
            if sessions_to_refund > current_balance:
                return {'error': f'Cannot refund {sessions_to_refund} sessions. Current balance is {current_balance}'}, 400
            
            if sessions_to_refund <= 0:
                return {'error': 'Refund amount must be positive'}, 400
            
            # Process refund using ledger
            result = session_dao.process_refund(student_id, subject_id, sessions_to_refund, refund_reason)
            
            return {
                'message': f'Refund processed: {sessions_to_refund} sessions',
                'new_balance': result['new_balance'],
                'ledger_entry_id': result['ledger_entry_id']
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/balances/transfer-subject')
class TransferSubjectSessions(Resource):
    @jwt_required()
    def post(self):
        """Transfer sessions between subjects for the same student"""
        try:
            data = request.json
            student_id = data.get('student_id')
            from_subject_id = data.get('from_subject_id')
            to_subject_id = data.get('to_subject_id')
            sessions_to_transfer = data.get('sessions_to_transfer')
            transfer_reason = data.get('transfer_reason', 'Subject transfer')
            
            if not all([student_id, from_subject_id, to_subject_id, sessions_to_transfer]):
                return {'error': 'student_id, from_subject_id, to_subject_id, and sessions_to_transfer are required'}, 400
            
            # Validate session amount
            is_valid, error_msg = validate_session_amount(sessions_to_transfer, 'sessions_to_transfer')
            if not is_valid:
                return {'error': error_msg}, 400
            
            if from_subject_id == to_subject_id:
                return {'error': 'Cannot transfer sessions to the same subject'}, 400
            
            # Get current balance for source subject
            current_balance = session_dao.get_student_subject_balance(student_id, from_subject_id)
            
            if sessions_to_transfer > current_balance:
                return {'error': f'Cannot transfer {sessions_to_transfer} sessions. Current balance is {current_balance}'}, 400
            
            if sessions_to_transfer <= 0:


                return {'error': 'Transfer amount must be positive'}, 400
            
            # Process transfer using ledger
            result = session_dao.process_subject_transfer(student_id, from_subject_id, to_subject_id, sessions_to_transfer, transfer_reason)
            
            return {
                'message': f'Transfer processed: {sessions_to_transfer} sessions transferred',
                'from_balance': result['from_new_balance'],
                'to_balance': result['to_new_balance'],
                'transfer_application_id': result['transfer_application_id']
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/balances/transfer-sibling')
class TransferSiblingSessions(Resource):
    @jwt_required()
    def post(self):
        """Transfer sessions between siblings"""
        try:
            data = request.json
            from_student_id = data.get('from_student_id')
            to_student_id = data.get('to_student_id')
            subject_id = data.get('subject_id')
            sessions_to_transfer = data.get('sessions_to_transfer')
            transfer_reason = data.get('transfer_reason', 'Sibling transfer')
            
            if not all([from_student_id, to_student_id, subject_id, sessions_to_transfer]):
                return {'error': 'from_student_id, to_student_id, subject_id, and sessions_to_transfer are required'}, 400
            
            # Validate session amount
            is_valid, error_msg = validate_session_amount(sessions_to_transfer, 'sessions_to_transfer')
            if not is_valid:
                return {'error': error_msg}, 400
            
            if from_student_id == to_student_id:
                return {'error': 'Cannot transfer sessions to the same student'}, 400
            
            # Get current balance for source student
            current_balance = session_dao.get_student_subject_balance(from_student_id, subject_id)
            
            if sessions_to_transfer > current_balance:
                return {'error': f'Cannot transfer {sessions_to_transfer} sessions. Current balance is {current_balance}'}, 400
            
            if sessions_to_transfer <= 0:
                return {'error': 'Transfer amount must be positive'}, 400
            
            # Process sibling transfer using ledger
            result = session_dao.process_sibling_transfer(from_student_id, to_student_id, subject_id, sessions_to_transfer, transfer_reason)
            
            return {
                'message': f'Sibling transfer processed: {sessions_to_transfer} sessions transferred',
                'from_balance': result['from_new_balance'],
                'to_balance': result['to_new_balance'],
                'transfer_application_id': result['transfer_application_id']
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/applications/<int:application_id>/ledger')
class ApplicationLedger(Resource):
    @jwt_required()
    def get(self, application_id):
        """Get transaction ledger for a specific application"""
        try:
            ledger_entries = session_dao.get_application_ledger(application_id)
            
            # Calculate running balance for each entry
            current_balance = 0.0
            for entry in ledger_entries:
                sessions_changed = float(entry.get('sessions_changed', 0))
                current_balance += sessions_changed
                entry['balance_after'] = current_balance
            
            return ledger_entries, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/balances/add-sessions')
class AddSessions(Resource):
    @jwt_required()
    def post(self):
        """Add more sessions to student's subject"""
        try:
            data = request.json
            student_id = data.get('student_id')
            subject_id = data.get('subject_id')
            sessions_to_add = data.get('sessions_to_add')
            application_type = data.get('application_type', 'additional')
            notes = data.get('notes', 'Additional sessions purchased')
            
            if not all([student_id, subject_id, sessions_to_add]):
                return {'error': 'student_id, subject_id, and sessions_to_add are required'}, 400
            
            # Validate session amount
            is_valid, error_msg = validate_session_amount(sessions_to_add, 'sessions_to_add')
            if not is_valid:
                return {'error': error_msg}, 400
            
            # Create new application and ledger entry
            result = session_dao.add_sessions(student_id, subject_id, sessions_to_add, application_type, notes)
            
            return {
                'message': f'Added {sessions_to_add} sessions successfully',
                'new_balance': result['new_balance'],
                'application_id': result['application_id'],
                'ledger_entry_id': result['ledger_entry_id']
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': str(e)}, 500

# Data Integrity Routes
@sessions_ns.route('/validate-integrity')
class ValidateDataIntegrity(Resource):
    @jwt_required()
    def get(self):
        """Validate data integrity across session tables"""
        try:
            issues = session_dao.validate_data_integrity()
            return {'issues': issues, 'count': len(issues)}, 200
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/fix-integrity')
class FixDataIntegrity(Resource):
    @jwt_required()
    def post(self):
        """Fix data integrity issues"""
        try:
            result = session_dao.fix_data_integrity()
            return {'message': 'Data integrity fixes applied', 'fixed_issues': result['fixed_count']}, 200
        except Exception as e:
            return {'error': str(e)}, 500

@sessions_ns.route('/fix-david-kim')
class FixDavidKimSessions(Resource):
    @jwt_required()
    def post(self):
        """Fix specific David Kim session issues"""
        try:
            result = session_dao.fix_david_kim_sessions()
            return {'message': 'David Kim sessions fixed', 'fixed_count': result['fixed_count']}, 200
        except Exception as e:
            return {'error': str(e)}, 500