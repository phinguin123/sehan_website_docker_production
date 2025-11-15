"""
Dashboard routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required

from .common import session_dao, student_dao

# Create dashboard namespace
from flask_restx import Namespace
dashboard_ns = Namespace('dashboard', description='Dashboard and statistics')

@dashboard_ns.route('/stats')
class DashboardStats(Resource):
    @jwt_required()
    def get(self):
        """Get dashboard statistics"""
        try:
            stats = {
                'total_students': student_dao.get_total_students_count(),
                'total_sessions': session_dao.get_total_sessions_count(),
                'active_applications': session_dao.get_active_applications_count(),
                'completed_sessions_today': session_dao.get_completed_sessions_today_count()
            }
            return stats, 200
        except Exception as e:
            return {'error': str(e)}, 500
