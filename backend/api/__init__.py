# api/__init__.py
"""
Flask-RESTX API initialization
Registers all namespace modules for the application
"""
from flask_restx import Api
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt.exceptions import PyJWTError

# Import existing namespaces
from .timetable.routes import timetable_ns
from .scores.scores import scores_ns
from .subjects.routes import subjects_ns
from .students.routes import students_ns
from .homework.routes import homework_ns
from .attendance.routes import attendance_ns
from .reference_data.routes import reference_data_ns
from .settings.routes import settings_ns
from .parent_student_match.routes import parent_student_ns
from .levels.routes import level_ns
from .modes.routes import mode_ns
from .grades.routes import grade_ns
from .parents.routes import parents_ns
from .teachers.routes import teachers_ns
from .submissions.routes import submissions_ns
from .reports.routes import reports_ns
from .comments.routes import comments_ns

# Import new namespaces
from .auth.routes import Auth  # Existing auth namespace
from .auth.routes_extended import auth_ext_ns  # Extended auth routes
from .admins.routes import admins_ns
from .files.routes import files_ns
from .webhooks.routes import webhooks_ns

# Create API instance
api = Api(
    title="Sehan IBP Website API",
    version="2.0",
    description="RESTful API for Sehan IBP student management system",
    contact="koysr20@gmail.com",
    license="MIT",
    doc="/api/docs",  # Swagger documentation endpoint
)

# Register all namespaces with their URL prefixes
# Format: (namespace_object, url_prefix)
namespaces = [
    # Authentication & Authorization
    (Auth, "/api/auth"),       # Legacy/basic auth endpoints
    (auth_ext_ns, "/api/auth-ext"),  # Extended auth (login, logout, OAuth)
    
    # Core Entities
    (students_ns, "/api/students"),
    (teachers_ns, "/api/teachers"),
    (parents_ns, "/api/parents"),
    (admins_ns, "/api/admins"),
    
    # Academic Operations
    (attendance_ns, "/api/attendance"),
    (homework_ns, "/api/homework"),
    (submissions_ns, "/api/submissions"),
    (scores_ns, "/api/scores"),
    (comments_ns, "/api/comments"),
    (reports_ns, "/api/reports"),
    
    # Configuration & Reference Data
    (timetable_ns, "/api/timetable"),
    (subjects_ns, "/api/subjects"),
    (grade_ns, "/api/grades"),
    (level_ns, "/api/levels"),
    (mode_ns, "/api/modes"),
    (settings_ns, "/api/settings"),
    (reference_data_ns, "/api/reference"),
    
    # Parent-Student Relationships
    (parent_student_ns, "/api/parent-student-match"),
    
    # Infrastructure
    (files_ns, "/api/files"),
    (webhooks_ns, "/api/webhooks"),
]

# Sort namespaces alphabetically by path for better organization
for ns, path in sorted(namespaces, key=lambda x: x[1]):
    api.add_namespace(ns, path)


# Custom error handlers for JWT exceptions
@api.errorhandler(JWTExtendedException)
def handle_jwt_exception(error):
    """Handle JWT-related errors"""
    return {"message": str(error), "code": "JWT_ERROR"}, 401


@api.errorhandler(PyJWTError)
def handle_pyjwt_exception(error):
    """Handle PyJWT-related errors"""
    return {"message": str(error), "code": "JWT_ERROR"}, 401


@api.errorhandler(Exception)
def handle_generic_exception(error):
    """Handle generic exceptions"""
    return {"message": str(error), "code": "INTERNAL_ERROR"}, 500
