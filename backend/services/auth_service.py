"""Authentication service for handling login, token management, and OAuth"""
from flask import jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
)
from utils.db import DBHelper
from controller import Oauth
from model import UserData
import base64
import requests
from datetime import datetime, timedelta

db_helper = DBHelper()


class AuthService:
    """Service for authentication operations"""

    def __init__(self):
        self.db_helper = DBHelper()

    def student_login(self, email, password):
        """Authenticate a student"""
        default_password = "2550"
        
        # Get student by email
        student_query = "SELECT * FROM students WHERE email = %s"
        student = self.db_helper.fetch_one(student_query, (email,))

        # Validate credentials
        if not student or password != default_password:
            return None, {"msg": "Invalid username or password", "code": "INVALID_CREDENTIALS"}, 401

        # Ensure name is not None
        student_name = student["name"] if student.get("name") else ""
        
        additional_claims = {
            "name": student_name,
            "role": "student",
            "grade": student.get("grade", ""),
        }

        # Create tokens
        access_token = create_access_token(
            identity=student["student_id"], additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=student["student_id"], additional_claims=additional_claims
        )

        response = jsonify({"msg": "Created jwt token"})
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, None, 200

    def parent_login(self, email, password):
        """Authenticate a parent"""
        # Get parent by email
        parent_query = "SELECT * FROM parents WHERE email = %s"
        parent = self.db_helper.fetch_one(parent_query, (email,))

        # Validate credentials
        if not parent or parent.get("password") != password:
            return None, {"msg": "Invalid username or password", "code": "INVALID_CREDENTIALS"}, 401

        additional_claims = {
            "name": parent.get("parent_name", ""),
            "role": "parent",
        }

        # Create tokens
        access_token = create_access_token(
            identity=parent["parent_id"], additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=parent["parent_id"], additional_claims=additional_claims
        )

        response = jsonify({"msg": "Created jwt token"})
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, None, 200

    def admin_login(self, username, password):
        """Authenticate an admin/teacher"""
        # Get teacher by username
        teacher_query = "SELECT * FROM teachers WHERE username = %s"
        teacher = self.db_helper.fetch_one(teacher_query, (username,))

        # Validate credentials
        if not teacher or teacher.get("password") != password:
            return None, {"msg": "Invalid username or password", "code": "INVALID_CREDENTIALS"}, 401

        additional_claims = {
            "name": teacher.get("name", ""),
            "role": "admin",
        }

        # Create tokens
        access_token = create_access_token(
            identity=teacher["id"], additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=teacher["id"], additional_claims=additional_claims
        )

        response = jsonify({"msg": "Created jwt token"})
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, None, 200

    def kakao_oauth(self, code):
        """Handle Kakao OAuth authentication"""
        oauth = Oauth()
        
        # Get Kakao token
        kakao_token_info, token_status_code = oauth.auth(code)
        if token_status_code != 200:
            return None, {"error": kakao_token_info}, token_status_code

        # Get user info
        user, user_status_code = oauth.userinfo(f"Bearer {kakao_token_info['access_token']}")
        if user_status_code != 200:
            return None, {"error": user}, user_status_code

        # Check if user exists
        student_name, student_id, grade = self._check_user_exists(user["id"])

        # Create new user if doesn't exist
        if student_id is None:
            student_id = self._insert_new_user(
                user["id"],
                user["kakao_account"]["profile"]["thumbnail_image_url"],
                kakao_token_info["access_token"],
                kakao_token_info["refresh_token"],
            )
            # After creating, get the student name and grade
            student_query = "SELECT name, grade FROM students WHERE student_id = %s"
            student_data = self.db_helper.fetch_one(student_query, (student_id,))
            if student_data:
                student_name = student_data.get("name", "")
                grade = student_data.get("grade", "")

        # Create JWT tokens
        additional_claims = {
            "kakao_access_token": kakao_token_info["access_token"],
            "kakao_refresh_token": kakao_token_info["refresh_token"],
            "name": student_name,
            "role": "student",
            "grade": grade,
        }

        access_token = create_access_token(
            identity=student_id, additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=student_id, additional_claims=additional_claims
        )

        response = jsonify({
            "jwt_access_token": access_token,
            "jwt_refresh_token": refresh_token,
            "name": student_name,
        })
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, None, 200

    def _check_user_exists(self, kakao_user_id):
        """Check if user exists by Kakao ID"""
        query = "SELECT name, student_id, grade FROM students WHERE kakao_id = %s"
        result = self.db_helper.fetch_one(query, (kakao_user_id,))
        
        if result:
            return result.get("name"), result.get("student_id"), result.get("grade")
        return None, None, None

    def _insert_new_user(self, kakao_user_id, thumbnail_url, access_token, refresh_token):
        """Insert a new Kakao user"""
        insert_query = """
            INSERT INTO students (kakao_id, kakao_thumbnail_url, kakao_access_token, kakao_refresh_token)
            VALUES (%s, %s, %s, %s)
        """
        self.db_helper.execute(
            insert_query,
            (kakao_user_id, thumbnail_url, access_token, refresh_token)
        )
        
        # Get the newly created student ID
        query = "SELECT student_id FROM students WHERE kakao_id = %s"
        result = self.db_helper.fetch_one(query, (kakao_user_id,))
        return result["student_id"] if result else None

    def logout(self):
        """Logout and clear cookies"""
        response = make_response(jsonify({"message": "Logged out"}))
        response.set_cookie("access_token_cookie", "", expires=0, path="/")
        response.set_cookie("refresh_token_cookie", "", expires=0, path="/")
        return response, 200


class ZoomOAuthService:
    """Service for Zoom OAuth operations"""

    def __init__(self, zoom_client_id, zoom_client_secret):
        self.zoom_client_id = zoom_client_id
        self.zoom_client_secret = zoom_client_secret
        self.db_helper = DBHelper()

    def get_oauth_url(self):
        """Get Zoom OAuth URL"""
        # Note: Update with proper redirect URI based on environment
        return f"https://zoom.us/oauth/authorize?response_type=code&client_id={self.zoom_client_id}&redirect_uri=https://dev.sehanibp.kr/oauth/zoom"

    def exchange_code_for_tokens(self, code, teacher_id):
        """Exchange authorization code for access and refresh tokens"""
        credentials = f"{self.zoom_client_id}:{self.zoom_client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")

        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "https://dev.sehanibp.kr/oauth/zoom",
        }

        response = requests.post("https://zoom.us/oauth/token", headers=headers, data=data)

        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in")

            # Calculate expiration timestamp
            current_time = datetime.now()
            expires_at = current_time + timedelta(seconds=expires_in)

            # Update teacher's zoom tokens
            self._update_teacher_zoom_token(
                access_token, refresh_token, expires_at, teacher_id
            )

            return {"msg": "teacher zoom setting complete"}, 200
        else:
            return {"error": "Failed to exchange code for tokens"}, 400

    def refresh_access_token(self, teacher_id, zoom_refresh_token):
        """Refresh the Zoom access token using the refresh token"""
        credentials = f"{self.zoom_client_id}:{self.zoom_client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")

        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {
            "grant_type": "refresh_token",
            "refresh_token": zoom_refresh_token,
        }

        response = requests.post("https://zoom.us/oauth/token", headers=headers, data=data)

        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in")

            # Calculate expiration timestamp
            current_time = datetime.now()
            expires_at = current_time + timedelta(seconds=expires_in)

            # Update teacher's zoom tokens
            self._update_teacher_zoom_token(
                access_token, refresh_token, expires_at, teacher_id
            )

            return token_data
        else:
            return None

    def _update_teacher_zoom_token(self, access_token, refresh_token, expires_at, teacher_id):
        """Update teacher's Zoom tokens in database"""
        update_query = """
            UPDATE teachers 
            SET zoom_access_token = %s, zoom_refresh_token = %s, zoom_expires_in = %s 
            WHERE id = %s
        """
        self.db_helper.execute(
            update_query,
            (access_token, refresh_token, expires_at, teacher_id)
        )
