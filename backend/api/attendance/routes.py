from flask import request
from flask_restx import Namespace, Resource, abort
from utils.db import DBHelper
from dao.student_dao import StudentDAO
from dao.timetable_dao import TimetableDAO
from dao.attendance_dao import AttendanceDAO
from services.attendance_service import AttendanceService
from api.timetable.routes import timetable_response_model


attendance_ns = Namespace("Attendance", description="Attendance operations")

from flask_restx import fields

# Model for a time slot
attendance_status_model = attendance_ns.model(
    "AttendanceStatus",
    {
        "status": fields.String(enum=["Present", "Absent", "Late", "Excused"]),
        "attendance_date": fields.Date,
    },
)

# Model for student with their subjects
student_subject_model = attendance_ns.model(
    "StudentSubject",
    {
        "subject_id": fields.Integer,
        "subject_name": fields.String,
        "level_id": fields.Integer,
        "level_name": fields.String,
        **attendance_status_model,
    },
)

# Model for student attendance
student_attendance_model = attendance_ns.model(
    "StudentAttendance",
    {
        "student_id": fields.String,
        "name": fields.String,
        "subjects": fields.List(fields.Nested(student_subject_model)),
    },
)

# Main response model
attendance_response_model = attendance_ns.model(
    "AttendanceResponse",
    {
        **timetable_response_model,
        "students": fields.List(fields.Nested(student_attendance_model)),
    },
)

db_helper = DBHelper()
student_dao = StudentDAO(db_helper)
timetable_dao = TimetableDAO(db_helper)
attendance_dao = AttendanceDAO(db_helper)
attendance_service = AttendanceService(student_dao, attendance_dao, timetable_dao)


@attendance_ns.route("/daily")
class DailyAttendance(Resource):
    @attendance_ns.doc(
        params={
            "date": "Date in YYYY-MM-DD format",
            "grade_id": "Grade ID",
            "mode_id": "Mode ID (Online/Offline)",
        }
    )
    @attendance_ns.marshal_with(attendance_response_model)
    def get(self):
        attendance_date = request.args.get("attendance_date")
        grade_id = request.args.get("grade_id")
        mode_id = request.args.get("mode_id")

        if not attendance_date or not grade_id or not mode_id:
            abort(400, "attendance_date, grade_id, and mode_id are required parameters")

        try:
            return attendance_service.get_daily_attendance(
                attendance_date, grade_id, mode_id
            )
        except ValueError as e:
            abort(400, str(e))
        except Exception as e:
            abort(500, f"Error fetching attendance data: {str(e)}")
