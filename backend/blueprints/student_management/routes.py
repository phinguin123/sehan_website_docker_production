from flask import Blueprint
from flask_restx import Api

# Import all existing namespaces
from api.timetable.routes import timetable_ns
from api.scores.scores import scores_ns
from api.subjects.routes import subjects_ns
from api.students.routes import students_ns
from api.homework.routes import homework_ns
from api.attendance.routes import attendance_ns
from api.reference_data.routes import reference_data_ns
from api.settings.routes import settings_ns
from api.levels.routes import level_ns
from api.modes.routes import mode_ns
from api.grades.routes import grade_ns
from api.parents.routes import parents_ns
from api.teachers.routes import teachers_ns
from api.submissions.routes import submissions_ns
from api.reports.routes import reports_ns
from api.comments.routes import comments_ns

# Create the student management blueprint
student_management_bp = Blueprint(
    'student_management',
    __name__,
    url_prefix='/api'
)

# Create API instance for this blueprint
student_management_api = Api(
    student_management_bp,
    title="Student Management System API",
    version="1.0",
    description="API for student management, homework, grades, and reports",
    contact="koysr20@gmail.com",
    license="MIT",
)

# Register all existing namespaces to this blueprint
namespaces = [
    (comments_ns, "/comments"),
    (attendance_ns, "/attendance"),
    (grade_ns, "/grades"),
    (homework_ns, "/homework"),
    (level_ns, "/levels"),
    (mode_ns, "/modes"),
    (parents_ns, "/parents"),
    (reference_data_ns, "/reference"),
    (scores_ns, "/scores"),
    (settings_ns, "/settings"),
    (students_ns, "/students"),
    (subjects_ns, "/subjects"),
    (submissions_ns, "/submissions"),
    (teachers_ns, "/teachers"),
    (timetable_ns, "/settings/timetable"),
    (reports_ns, "/reports"),
]

# Add namespaces to the student management API
for ns, path in sorted(namespaces, key=lambda x: x[1].split("/")[-1]):
    student_management_api.add_namespace(ns, path)
