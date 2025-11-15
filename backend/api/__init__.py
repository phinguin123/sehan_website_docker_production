# api/__init__.py
from flask_restx import Api
from .timetable.routes import timetable_ns
from .scores.scores import scores_ns
from .subjects.routes import subjects_ns
from .students.routes import students_ns
from .homework.routes import homework_ns
from .attendance.routes import attendance_ns
from .reference_data.routes import reference_data_ns
from .settings.routes import settings_ns
from .levels.routes import level_ns
from .modes.routes import mode_ns
from .grades.routes import grade_ns
from .parents.routes import parents_ns
from .teachers.routes import teachers_ns
from .submissions.routes import submissions_ns
from .reports.routes import reports_ns
from .comments.routes import comments_ns

from flask_jwt_extended.exceptions import JWTExtendedException
from jwt.exceptions import PyJWTError

api = Api(
    title="Sehan Website API",
    version="1.0",
    description="An API for Sehan website",
    contact="koysr20@gmail.com",
    license="MIT",
)

# Register namespaces
namespaces = [
    (comments_ns, "/api/comments"),
    (attendance_ns, "/api/attendance"),
    (grade_ns, "/api/grades"),
    (homework_ns, "/api/homework"),
    (level_ns, "/api/levels"),
    (mode_ns, "/api/modes"),
    (parents_ns, "/api/parents"),
    (reference_data_ns, "/api/reference"),
    (scores_ns, "/api/scores"),
    (settings_ns, "/api/settings"),
    (students_ns, "/api/students"),
    (subjects_ns, "/api/subjects"),
    (submissions_ns, "/api/submissions"),
    (teachers_ns, "/api/teachers"),
    (timetable_ns, "/api/settings/timetable"),
    (reports_ns, "/api/reports"),
]


# Sort alphabetically by URL
for ns, path in sorted(namespaces, key=lambda x: x[1].split("/")[-1]):
    api.add_namespace(ns, path)
