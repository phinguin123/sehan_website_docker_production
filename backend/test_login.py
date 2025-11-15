#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from flask import Flask, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token
from dao.private_tutoring.pt_teacher_dao import PTTeacherDAO

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "***REMOVED-JWT-SECRET***"

# Initialize JWT
from flask_jwt_extended import JWTManager
jwt = JWTManager(app)

@app.route('/test-login', methods=['POST'])
def test_login():
    """Test login without Flask-RESTX"""
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
        print(f"Error in test login: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'message': f'Login error: {str(e)}'}, 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5003, debug=True)
