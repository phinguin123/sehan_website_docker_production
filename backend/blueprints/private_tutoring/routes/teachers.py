"""
Teacher management routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required

from .common import PTTeacherDAO

# Create teachers namespace
from flask_restx import Namespace
teachers_ns = Namespace('teachers', description='Teacher management operations')

# API Models for teachers
teacher_model = teachers_ns.model('Teacher', {
    'teacher_id': fields.Integer(description='Teacher ID'),
    'name': fields.String(description='Teacher name'),
    'username': fields.String(description='Teacher username'),
    'subjects': fields.List(fields.String, description='Teacher subjects')
})

@teachers_ns.route('')
class TeacherList(Resource):
    @teachers_ns.marshal_list_with(teacher_model)
    @jwt_required()
    def get(self):
        """Get all teachers"""
        try:
            result = PTTeacherDAO.get_all_teachers()
            if result['status'] == 'success':
                return result['teachers'], 200
            else:
                return {'error': result['message']}, 500
        except Exception as e:
            return {'error': str(e)}, 500

    @teachers_ns.expect(teacher_model)
    @jwt_required()
    def post(self):
        """Create a new teacher"""
        try:
            data = request.json
            result = PTTeacherDAO.create_teacher(
                name=data.get('name'),
                username=data.get('username'),
                password=data.get('password', 'password123'),  # Pass plain password, will be hashed in DAO
                subjects=data.get('subjects', [])
            )
            if result['status'] == 'success':
                return {'teacher_id': result['teacher_id'], 'message': result['message']}, 201
            else:
                return {'error': result['message']}, 400
        except Exception as e:
            return {'error': str(e)}, 500

@teachers_ns.route('/<int:teacher_id>')
class Teacher(Resource):
    @teachers_ns.marshal_with(teacher_model)
    @jwt_required()
    def get(self, teacher_id):
        """Get a specific teacher by ID"""
        try:
            result = PTTeacherDAO.get_teacher_by_id(teacher_id)
            if result['status'] == 'success':
                return result['teacher'], 200
            else:
                return {'error': result['message']}, 404
        except Exception as e:
            return {'error': str(e)}, 500

    @teachers_ns.expect(teacher_model)
    @jwt_required()
    def put(self, teacher_id):
        """Update a teacher"""
        try:
            data = request.json
            result = PTTeacherDAO.update_teacher(
                teacher_id=teacher_id,
                name=data.get('name'),
                username=data.get('username'),
                subjects=data.get('subjects')
            )
            if result['status'] == 'success':
                return {'message': result['message']}, 200
            else:
                return {'error': result['message']}, 400
        except Exception as e:
            return {'error': str(e)}, 500

    @jwt_required()
    def delete(self, teacher_id):
        """Delete a teacher"""
        try:
            result = PTTeacherDAO.delete_teacher(teacher_id)
            if result['status'] == 'success':
                return {'message': result['message']}, 200
            else:
                return {'error': result['message']}, 400
        except Exception as e:
            return {'error': str(e)}, 500

@teachers_ns.route('/by-subject/<string:subject_name>')
class TeachersBySubject(Resource):
    @teachers_ns.marshal_list_with(teacher_model)
    @jwt_required()
    def get(self, subject_name):
        """Get teachers who teach a specific subject"""
        try:
            result = PTTeacherDAO.get_teachers_by_subject(subject_name)
            if result['status'] == 'success':
                return result['teachers'], 200
            else:
                return {'error': result['message']}, 500
        except Exception as e:
            return {'error': str(e)}, 500

@teachers_ns.route('/<int:teacher_id>/dependencies')
class TeacherDependencies(Resource):
    @jwt_required()
    def get(self, teacher_id):
        """Get detailed information about what prevents teacher deletion"""
        try:
            result = PTTeacherDAO.get_teacher_dependencies(teacher_id)
            if result['status'] == 'success':
                return result['dependencies'], 200
            else:
                return {'error': result['message']}, 404
        except Exception as e:
            return {'error': str(e)}, 500
