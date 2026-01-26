from flask_restx import Namespace, Resource, fields, abort
from flask_jwt_extended import jwt_required
from flask import request
from utils.db import DBHelper
from werkzeug.security import generate_password_hash
import re

admins_ns = Namespace("Admins", description="Admin/Teacher management operations")

db_helper = DBHelper()

admin_model = admins_ns.model(
    "Admin",
    {
        "name": fields.String(required=True, description="Admin name"),
        "email": fields.String(required=True, description="Admin email"),
        "username": fields.String(required=False, description="Admin username"),
    },
)


@admins_ns.route("/")
class AdminList(Resource):
    @jwt_required()
    def get(self):
        """Get list of all admins/teachers"""
        try:
            query = "SELECT teacher_id as id, name, email, username FROM teachers"
            admins = db_helper.fetch_all(query)
            return admins, 200
        except Exception as e:
            abort(500, f"Error fetching admins: {str(e)}")

    @admins_ns.expect(admin_model)
    @jwt_required()
    def post(self):
        """Register a new admin/teacher"""
        try:
            data = request.json
            name = data.get("name")
            email = data.get("email")
            username = data.get("username")

            if not name or not email:
                abort(400, "Name and email are required")

            # Check if admin with this email already exists
            check_query = "SELECT * FROM teachers WHERE email = %s"
            existing = db_helper.fetch_one(check_query, (email,))
            
            if existing:
                abort(400, "Admin with this email already exists")

            # Insert new admin
            insert_query = """
                INSERT INTO teachers (name, email, username) 
                VALUES (%s, %s, %s)
            """
            db_helper.execute(insert_query, (name, email, username))

            return {"message": "Admin registered successfully"}, 201
        except Exception as e:
            abort(500, f"Error registering admin: {str(e)}")


@admins_ns.route("/<int:admin_id>")
class AdminDetail(Resource):
    @admins_ns.expect(admin_model)
    @jwt_required()
    def put(self, admin_id):
        """Edit an admin/teacher"""
        try:
            data = request.json
            name = data.get("name")
            email = data.get("email")
            username = data.get("username")

            if not name or not email:
                abort(400, "Name and email are required")

            # Check if another admin has this email
            check_query = "SELECT * FROM teachers WHERE email = %s AND teacher_id != %s"
            existing = db_helper.fetch_one(check_query, (email, admin_id))
            
            if existing:
                abort(400, "Another admin with this email already exists")

            # Update admin
            update_query = """
                UPDATE teachers 
                SET name = %s, email = %s, username = %s
                WHERE teacher_id = %s
            """
            db_helper.execute(update_query, (name, email, username, admin_id))

            return {"message": "Admin updated successfully"}, 200
        except Exception as e:
            abort(500, f"Error updating admin: {str(e)}")

    @jwt_required()
    def delete(self, admin_id):
        """Delete an admin/teacher"""
        try:
            # Check if admin exists
            check_query = "SELECT * FROM teachers WHERE teacher_id = %s"
            admin = db_helper.fetch_one(check_query, (admin_id,))
            
            if not admin:
                abort(404, "Admin not found")

            # Delete admin
            delete_query = "DELETE FROM teachers WHERE teacher_id = %s"
            db_helper.execute(delete_query, (admin_id,))

            return {"message": "Admin deleted successfully"}, 200
        except Exception as e:
            abort(500, f"Error deleting admin: {str(e)}")
