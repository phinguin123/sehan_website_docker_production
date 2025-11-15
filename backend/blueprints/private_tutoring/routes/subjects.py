"""
Subject management routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required

from .common import subject_dao

# Create subjects namespace
from flask_restx import Namespace
subjects_ns = Namespace('subjects', description='Subject management operations')

@subjects_ns.route('')
class SubjectList(Resource):
    @jwt_required()
    def get(self):
        """Get all subjects"""
        try:
            subjects = subject_dao.get_all_subjects()
            # Shape response to include a stable color field from fg_color
            shaped = [
                {
                    'subject_id': s.get('subject_id'),
                    'subject_name': s.get('subject_name'),
                    # Prefer the new `color` column; fallback to legacy fg_color
                    'subject_color': s.get('color') or s.get('fg_color') or '#6b7cff',
                }
                for s in subjects
                if s.get('subject_name')
            ]
            return shaped, 200
        except Exception as e:
            return {'error': str(e)}, 500
