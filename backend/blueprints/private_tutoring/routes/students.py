"""
Student management routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required

from .common import student_dao, session_dao

# Create students namespace
from flask_restx import Namespace
students_ns = Namespace('students', description='Student management operations')

# API Models for students
student_model = students_ns.model('Student', {
    'student_id': fields.Integer(description='Student ID'),
    'name': fields.String(required=True, description='Student name'),
    'grade': fields.String(required=True, description='Student grade'),
    'school': fields.String(description='Student school'),
    'parent_phone': fields.String(description='Parent phone number'),
    'subjects': fields.List(fields.Raw, description='List of subjects with levels')
})

@students_ns.route('')
class StudentList(Resource):
    @students_ns.marshal_list_with(student_model)
    @jwt_required()
    def get(self):
        """Get all private tutoring students"""
        try:
            students = student_dao.get_all_students()
            return students, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @students_ns.expect(student_model)
    @jwt_required()
    def post(self):
        """Create a new private tutoring student"""
        try:
            data = request.json
            student_id = student_dao.create_student(data)
            return {'student_id': student_id, 'message': 'Student created successfully'}, 201
        except Exception as e:
            return {'error': str(e)}, 500

@students_ns.route('/<int:student_id>')
class Student(Resource):
    @students_ns.marshal_with(student_model)
    @jwt_required()
    def get(self, student_id):
        """Get a specific student"""
        try:
            student = student_dao.get_student_by_id(student_id)
            if not student:
                return {'error': 'Student not found'}, 404
            return student, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @students_ns.expect(student_model)
    @jwt_required()
    def put(self, student_id):
        """Update a student"""
        try:
            data = request.json
            student_dao.update_student(student_id, data)
            return {'message': 'Student updated successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @jwt_required()
    def delete(self, student_id):
        """Delete a student"""
        try:
            student_dao.delete_student(student_id)
            return {'message': 'Student deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

@students_ns.route('/<int:student_id>/progress')
class StudentSessionProgress(Resource):
    @jwt_required()
    def get(self, student_id):
        """Get session progress for a student"""
        try:
            progress = session_dao.get_student_session_progress(student_id)
            return progress, 200
        except Exception as e:
            return {'error': str(e)}, 500

@students_ns.route('/progress')
class AllStudentsProgress(Resource):
    @jwt_required()
    def get(self):
        """Get session progress for all students"""
        try:
            progress = session_dao.get_all_students_session_progress()
            return progress, 200
        except Exception as e:
            return {'error': str(e)}, 500


@students_ns.route('/<int:student_id>/sessions')
class StudentSessions(Resource):
    @jwt_required()
    def get(self, student_id):
        """Get live sessions for a specific student from pt_sessions (not audit)."""
        try:
            sessions = session_dao.get_student_sessions_from_live(student_id)
            return sessions, 200
        except Exception as e:
            return {'error': str(e)}, 500

@students_ns.route('/grades')
class GradesList(Resource):
    @jwt_required()
    def get(self):
        """Get all available grades"""
        try:
            grades = student_dao.get_all_grades()
            return grades, 200
        except Exception as e:
            return {'error': str(e)}, 500

@students_ns.route('/<int:student_id>/applications')
class StudentApplications(Resource):
    @jwt_required()
    def get(self, student_id):
        """Get active applications for a specific student with remaining sessions"""
        try:
            applications = session_dao.get_student_applications_with_remaining_sessions(student_id)
            return applications, 200
        except Exception as e:
            return {'error': str(e)}, 500
