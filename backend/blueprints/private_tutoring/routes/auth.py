"""
Authentication routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token

from .common import teacher_dao, PTTeacherDAO

# Create auth namespace
from flask_restx import Namespace
auth_ns = Namespace('auth', description='Authentication operations')

# API Models for authentication
login_model = auth_ns.model('Login', {
    'username': fields.String(required=True, description='Teacher username'),
    'password': fields.String(required=True, description='Teacher password'),
    'login_type': fields.String(description='Login type identifier')
})

teacher_model = auth_ns.model('Teacher', {
    'teacher_id': fields.Integer(description='Teacher ID'),
    'name': fields.String(description='Teacher name'),
    'username': fields.String(description='Teacher username'),
    'subjects': fields.List(fields.String, description='Teacher subjects')
})

@auth_ns.route('/login')
class TeacherLogin(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        """Teacher login for private tutoring system"""
        try:
            data = request.json
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return {'success': False, 'message': 'Username and password required'}, 400
            
            # Authenticate teacher using database
            result = PTTeacherDAO.authenticate_teacher(username, password)
            
            if result['status'] == 'success':
                teacher = result['teacher']
                
                # Get teacher subjects
                teacher_details = PTTeacherDAO.get_teacher_by_id(teacher['teacher_id'])
                if teacher_details['status'] == 'success':
                    teacher['subjects'] = teacher_details['teacher']['subjects']
                
                # Create JWT tokens
                access_token = create_access_token(identity=teacher['teacher_id'])
                refresh_token = create_refresh_token(identity=teacher['teacher_id'])

                return {
                    'success': True,
                    'message': 'Login successful',
                    'token': access_token,
                    'refresh_token': refresh_token,
                    'teacher': teacher
                }, 200
            else:
                return {'success': False, 'message': result['message']}, 401
                
        except Exception as e:
            return {'success': False, 'message': f'Login error: {str(e)}'}, 500

@auth_ns.route('/verify')
class VerifyToken(Resource):
    @jwt_required()
    def get(self):
        """Verify if token is valid"""
        try:
            current_teacher_id = get_jwt_identity()
            return {
                'success': True,
                'teacher_id': current_teacher_id,
                'message': 'Token is valid'
            }, 200
        except Exception as e:
            return {'success': False, 'message': 'Invalid token'}, 401

@auth_ns.route('/refresh')
class RefreshToken(Resource):
    @jwt_required(refresh=True)
    def post(self):
        """Issue a new access token using refresh token"""
        try:
            current_teacher_id = get_jwt_identity()
            new_access_token = create_access_token(identity=current_teacher_id)
            new_refresh_token = create_refresh_token(identity=current_teacher_id)
            return {
                'success': True,
                'access_token': new_access_token,
                'refresh_token': new_refresh_token
            }, 200
        except Exception:
            return {'success': False, 'message': 'Refresh failed'}, 401
