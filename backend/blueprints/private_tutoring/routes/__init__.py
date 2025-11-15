"""
Private Tutoring Routes Package
Organized route modules for better maintainability
"""

from flask import Blueprint, Response, request
from flask_restx import Api
import json
from flask_jwt_extended import jwt_required, get_jwt_identity

from .auth import auth_ns
from .students import students_ns
from .teachers import teachers_ns
from .sessions import sessions_ns
from .schedules import schedules_ns
from .alerts import alerts_ns
from .subjects import subjects_ns
from .dashboard import dashboard_ns
from .common import DecimalEncoder
from .sessions import session_dao, db_helper

# Create the private tutoring blueprint
private_tutoring_bp = Blueprint(
    'private_tutoring',
    __name__,
    url_prefix='/api/private-tutoring'
)

# Create API instance for this blueprint
private_tutoring_api = Api(
    private_tutoring_bp,
    title="Private Tutoring Service API",
    version="2.0",
    description="Enhanced API for private tutoring student and session management",
    contact="koysr20@gmail.com",
    license="MIT",
)

# Configure Flask-RESTX to use custom JSON encoder for Decimal handling
private_tutoring_api.representations['application/json'] = lambda data, code, headers=None: Response(
    json.dumps(data, cls=DecimalEncoder) + '\n',
    status=code,
    headers=headers,
    mimetype='application/json'
)

# Add all namespaces to the API
private_tutoring_api.add_namespace(auth_ns, path='/auth')
private_tutoring_api.add_namespace(students_ns, path='/students')
private_tutoring_api.add_namespace(teachers_ns, path='/teachers')
private_tutoring_api.add_namespace(sessions_ns, path='/sessions')
private_tutoring_api.add_namespace(schedules_ns, path='/schedules')
private_tutoring_api.add_namespace(alerts_ns, path='/alerts')
private_tutoring_api.add_namespace(dashboard_ns, path='/dashboard')
private_tutoring_api.add_namespace(subjects_ns, path='/subjects')

# Backward-compatible aliases (without '/sessions' segment)
@private_tutoring_bp.route('/session-history', methods=['GET'])
@private_tutoring_bp.route('/session-history/', methods=['GET'])
@jwt_required()
def session_history_alias():
    try:
        student_id = request.args.get('student_id', type=int)
        subject_name = request.args.get('subject_name')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        teacher_id = request.args.get('teacher_id', type=int)

        # Use the new unified endpoint
        history = session_dao.get_session_summaries()
        return history, 200
    except Exception as e:
        return {'error': str(e)}, 500


@private_tutoring_bp.route('/session-history/<int:audit_id>', methods=['PUT'])
@private_tutoring_bp.route('/session-history/<int:audit_id>/', methods=['PUT'])
@jwt_required()
def update_session_alias(audit_id):
    try:
        data = request.json
        current_teacher_id = get_jwt_identity()

        required_fields = ['session_date', 'session_time', 'duration_hours', 'comments']
        for field in required_fields:
            if not data.get(field):
                return {'error': f'Missing required field: {field}'}, 400

        valid_durations = [0.5, 1.0, 1.5, 2.0]
        if data.get('duration_hours') not in valid_durations:
            return {'error': 'Duration must be 0.5, 1.0, 1.5, or 2.0 hours'}, 400

        check_query = "SELECT * FROM pt_session_audit WHERE audit_id = %s AND is_deleted = FALSE"
        current_session = db_helper.fetch_one(check_query, (audit_id,))
        if not current_session:
            return {'error': 'Session not found'}, 404

        update_query = """
        UPDATE pt_session_audit 
        SET session_date = %s,
            session_time = %s,
            duration_hours = %s,
            session_notes = %s,
            subject_name = %s,
            student_name = %s,
            teacher_name = %s,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = %s
        WHERE audit_id = %s AND is_deleted = FALSE
        """

        subject_name = data.get('subject_name')
        if not subject_name and data.get('subject_id'):
            subject_query = "SELECT subject_name FROM pt_subjects WHERE subject_id = %s"
            subject_result = db_helper.fetch_one(subject_query, (data['subject_id'],))
            subject_name = subject_result['subject_name'] if subject_result else current_session['subject_name']

        student_name = data.get('student_name')
        if not student_name and data.get('student_id'):
            student_query = "SELECT name FROM pt_students WHERE student_id = %s"
            student_result = db_helper.fetch_one(student_query, (data['student_id'],))
            student_name = student_result['name'] if student_result else current_session['student_name']

        teacher_name = data.get('teacher_name')
        if not teacher_name and data.get('teacher_id'):
            teacher_query = "SELECT name FROM pt_teachers WHERE teacher_id = %s"
            teacher_result = db_helper.fetch_one(teacher_query, (data['teacher_id'],))
            teacher_name = teacher_result['name'] if teacher_result else current_session['teacher_name']

        db_helper.execute(update_query, (
            data['session_date'],
            data['session_time'],
            data['duration_hours'],
            data['comments'],
            subject_name or current_session['subject_name'],
            student_name or current_session['student_name'],
            teacher_name or current_session['teacher_name'],
            current_teacher_id,
            audit_id
        ))

        return {
            'status': 'success',
            'message': 'Session updated successfully',
            'audit_id': audit_id
        }, 200
    except Exception as e:
        return {'error': str(e)}, 500


# Also support updating by sending audit_id in the body (for clients that PUT/POST to /session-history)
@private_tutoring_bp.route('/session-history', methods=['PUT', 'POST'])
@private_tutoring_bp.route('/session-history/', methods=['PUT', 'POST'])
@jwt_required()
def update_session_alias_without_id():
    try:
        data = request.json or {}
        audit_id = data.get('audit_id')
        if not audit_id:
            return {'error': 'Missing audit_id in request body'}, 400
        return update_session_alias(int(audit_id))
    except Exception as e:
        return {'error': str(e)}, 500

__all__ = [
    'private_tutoring_bp',
    'auth_ns',
    'students_ns', 
    'teachers_ns',
    'sessions_ns',
    'schedules_ns',
    'alerts_ns',
    'subjects_ns',
    'dashboard_ns'
]
