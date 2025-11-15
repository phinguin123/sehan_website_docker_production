from flask_restx import Namespace, Resource, fields
from flask import request
from services.report_service import ReportService
from celery_tasks import process_generate_student_report
from flask_jwt_extended import get_jwt_identity, jwt_required

reports_ns = Namespace("Reports", description="Reports related operations")

report_attendance_model = reports_ns.model(
    "Report attendance model",
    {
        "levels": fields.Raw(description="csv file of the attendance report"),
    },
)

report_service = ReportService()


@reports_ns.route("/attendance")
class ReportsAttendance(Resource):
    def get(self):
        grade_name = request.args.get("grade_name")
        return report_service.get_report_attendance(grade_name)


@reports_ns.route("/students")
class ReportsStudents(Resource):
    def get(self):
        # maybe later I can add week number for convenience
        # week_number = request.args.get("week_number")
        print("generating")
        return report_service.generate_student_reports()
        # process_generate_student_report.delay()
        return {"message": "generating report in few minutes!"}


@reports_ns.route("/students/<int:student_id>")
class ReportsStudentsDetail(Resource):
    def get(self, student_id):
        # maybe later I can add week number for convenience
        # week_number = request.args.get("week_number")
        return report_service.generate_one_student_reports(student_id)


@reports_ns.route("/send")
class ReportsSend(Resource):
    @jwt_required()
    def post(self):
        # maybe later I can add week number for convenience
        # week_number = request.args.get("week_number")
        return report_service.send_reports()


@reports_ns.route("/availability")
class ReportsSend(Resource):
    @jwt_required()
    def get(self):
        return report_service.check_availability()
