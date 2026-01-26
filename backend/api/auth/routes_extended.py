"""Extended authentication routes including login, logout, and OAuth"""
from flask import request, redirect, jsonify, current_app
from flask_restx import Resource, Namespace, fields, abort
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt,
    create_access_token,
    create_refresh_token,
    set_access_cookies
)
from services.auth_service import AuthService, ZoomOAuthService
from zoom_api_config import ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
from utils.db import DBHelper

auth_ext_ns = Namespace("Auth Extended", description="Extended authentication operations")

db_helper = DBHelper()
auth_service = AuthService()
zoom_service = ZoomOAuthService(ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)

# Models
login_model = auth_ext_ns.model(
    "Login",
    {
        "email": fields.String(required=False, description="Email for student/parent login"),
        "username": fields.String(required=False, description="Username for admin login"),
        "password": fields.String(required=True, description="Password"),
    },
)

kakao_oauth_model = auth_ext_ns.model(
    "Kakao OAuth",
    {
        "code": fields.String(required=True, description="Kakao authorization code"),
    },
)

zoom_oauth_model = auth_ext_ns.model(
    "Zoom OAuth",
    {
        "code": fields.String(required=True, description="Zoom authorization code"),
    },
)


@auth_ext_ns.route("/logout")
class Logout(Resource):
    @jwt_required()
    def post(self):
        """Logout and clear JWT cookies"""
        response, status_code = auth_service.logout()
        return response

    @jwt_required()
    def get(self):
        """Logout and clear JWT cookies (GET method for compatibility)"""
        response, status_code = auth_service.logout()
        return response


@auth_ext_ns.route("/student/login")
class StudentLogin(Resource):
    @auth_ext_ns.expect(login_model)
    def post(self):
        """Student login"""
        email = request.json.get("email")
        password = request.json.get("password")

        if not email or not password:
            abort(400, "Email and password are required")

        response, error, status_code = auth_service.student_login(email, password)
        
        if error:
            return error, status_code
        
        return response


@auth_ext_ns.route("/parent/login")
class ParentLogin(Resource):
    @auth_ext_ns.expect(login_model)
    def post(self):
        """Parent login"""
        email = request.json.get("email")
        password = request.json.get("password")

        if not email or not password:
            abort(400, "Email and password are required")

        response, error, status_code = auth_service.parent_login(email, password)
        
        if error:
            return error, status_code
        
        return response


@auth_ext_ns.route("/admin/login")
class AdminLogin(Resource):
    @auth_ext_ns.expect(login_model)
    def post(self):
        """Admin/Teacher login"""
        username = request.json.get("username")
        password = request.json.get("password")

        if not username or not password:
            abort(400, "Username and password are required")

        response, error, status_code = auth_service.admin_login(username, password)
        
        if error:
            return error, status_code
        
        return response


@auth_ext_ns.route("/oauth/kakao")
class KakaoOAuth(Resource):
    @auth_ext_ns.expect(kakao_oauth_model)
    def post(self):
        """Handle Kakao OAuth authentication"""
        code = request.json.get("code")

        if not code:
            abort(400, "Authorization code is required")

        try:
            response, error, status_code = auth_service.kakao_oauth(code)
            
            if error:
                return error, status_code
            
            return response
        except Exception as e:
            current_app.logger.error(f"Kakao OAuth error: {str(e)}", exc_info=True)
            abort(500, f"OAuth authentication failed: {str(e)}")


@auth_ext_ns.route("/oauth/zoom/url")
class ZoomOAuthUrl(Resource):
    def get(self):
        """Get Zoom OAuth authorization URL"""
        oauth_url = zoom_service.get_oauth_url()
        return redirect(oauth_url)


@auth_ext_ns.route("/oauth/zoom")
class ZoomOAuth(Resource):
    @auth_ext_ns.expect(zoom_oauth_model)
    @jwt_required()
    def post(self):
        """Handle Zoom OAuth authentication"""
        teacher_id = get_jwt_identity()
        code = request.json.get("code")

        if not code:
            abort(400, "Authorization code is required")

        try:
            result, status_code = zoom_service.exchange_code_for_tokens(code, teacher_id)
            return result, status_code
        except Exception as e:
            current_app.logger.error(f"Zoom OAuth error: {str(e)}", exc_info=True)
            abort(500, f"OAuth authentication failed: {str(e)}")


@auth_ext_ns.route("/verify-token")
class TokenVerify(Resource):
    @jwt_required()
    def get(self):
        """Verify JWT token and return user info"""
        current_user_id = get_jwt_identity()
        jwt_token = get_jwt()
        role = jwt_token.get("role")

        if not role:
            abort(400, "Role not found in token")

        # Verify user exists based on role
        if role == "student":
            query = "SELECT * FROM students WHERE student_id = %s"
            user = db_helper.fetch_one(query, (current_user_id,))
            if not user:
                abort(404, "Student not found")
            return {"role": "student", "user_id": current_user_id, "name": jwt_token.get("name")}, 200

        elif role == "parent":
            query = "SELECT * FROM parents WHERE parent_id = %s"
            user = db_helper.fetch_one(query, (current_user_id,))
            if not user:
                abort(404, "Parent not found")
            return {"role": "parent", "user_id": current_user_id, "name": jwt_token.get("name")}, 200

        elif role == "admin" or role == "teacher":
            query = "SELECT * FROM teachers WHERE id = %s"
            user = db_helper.fetch_one(query, (current_user_id,))
            if not user:
                abort(404, "Admin not found")
            return {"role": role, "user_id": current_user_id, "name": jwt_token.get("name")}, 200

        else:
            abort(400, "Invalid role")

@auth_ext_ns.route("/token/reissue")  # This matches your Frontend URL if you change base to /api/auth-ext
class TokenReissue(Resource):
    @jwt_required(refresh=True) # Important: requires the Refresh Token cookie
    def get(self):
        """
        Refresh access token using the refresh token cookie.
        """
        current_user = get_jwt_identity()
        
        # Create a new access token
        new_access_token = create_access_token(identity=current_user)
        
        response = jsonify({"msg": "Token refreshed"})
        
        # Set the new access token in the cookie (if you use cookies for access tokens)
        set_access_cookies(response, new_access_token)
        
        return response