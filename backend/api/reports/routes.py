from flask_restx import Namespace, Resource, fields
from flask import request, send_file, current_app, jsonify
from services.report_service import ReportService
from celery_tasks import process_generate_student_report
from flask_jwt_extended import get_jwt_identity, jwt_required
from celery_app import celery_app
import os

reports_ns = Namespace("Reports", description="Reports related operations")

report_attendance_model = reports_ns.model(
    "Report attendance model",
    {
        "levels": fields.Raw(description="csv file of the attendance report"),
    },
)

task_status_model = reports_ns.model(
    "TaskStatus",
    {
        "task_id": fields.String(description="Task ID"),
        "status": fields.String(description="Task status: PENDING, STARTED, SUCCESS, FAILURE"),
        "result": fields.Raw(description="Task result if completed"),
        "error": fields.String(description="Error message if failed"),
    },
)

report_service = ReportService()


@reports_ns.route("/pdf/<int:student_id>")
class StudentPDFReport(Resource):
    def get(self, student_id):
        """Generate PDF report for a specific student"""
        try:
            pdf_buffer = report_service.generate_student_pdf(student_id)
            
            # Get student name for filename
            from utils.db import DBHelper
            db_helper = DBHelper()
            query = "SELECT name FROM students WHERE student_id = %s"
            student = db_helper.fetch_one(query, (student_id,))
            student_name = student.get("name", "Unknown") if student else "Unknown"
            
            # Get week number
            from datetime import datetime
            import pytz
            import os
            
            SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")
            seoul_tz = pytz.timezone("Asia/Seoul")
            start_date = datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d")
            current_date = datetime.now(seoul_tz).replace(tzinfo=None)
            days_difference = (current_date - start_date).days
            week_number = (days_difference // 7) if days_difference >= 0 else 0
            last_week_number = week_number
            
            from urllib.parse import quote
            filename = f"{student_name}_week_{last_week_number}_report.pdf"
            safe_filename = quote(filename)
            
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=False,
                download_name=filename
            )
        except Exception as e:
            current_app.logger.error(f"Error generating PDF: {str(e)}", exc_info=True)
            from flask_restx import abort
            abort(500, f"Error generating PDF report: {str(e)}")


@reports_ns.route("/all")
class AllStudentReports(Resource):
    @jwt_required()
    def get(self):
        """Get all student reports as ZIP file"""
        try:
            import zipfile
            import tempfile
            from datetime import datetime
            import pytz
            
            # Get all students
            from utils.db import DBHelper
            db_helper = DBHelper()
            query = "SELECT student_id, name FROM students ORDER BY name"
            students = db_helper.fetch_all(query)
            
            if not students:
                from flask_restx import abort
                abort(404, "No students found")
            
            # Create temporary directory for PDFs
            with tempfile.TemporaryDirectory() as temp_dir:
                zip_path = os.path.join(temp_dir, "all_reports.zip")
                
                with zipfile.ZipFile(zip_path, 'w') as zip_file:
                    for student in students:
                        try:
                            student_id = student["student_id"]
                            student_name = student["name"]
                            
                            # Generate PDF
                            pdf_buffer = report_service.generate_student_pdf(student_id)
                            
                            # Get week number
                            SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")
                            seoul_tz = pytz.timezone("Asia/Seoul")
                            start_date = datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d")
                            current_date = datetime.now(seoul_tz).replace(tzinfo=None)
                            days_difference = (current_date - start_date).days
                            week_number = (days_difference // 7) if days_difference >= 0 else 0
                            
                            filename = f"{student_name}_week_{week_number}_report.pdf"
                            
                            # Add PDF to ZIP
                            zip_file.writestr(filename, pdf_buffer.getvalue())
                            
                            current_app.logger.info(f"Added {filename} to ZIP")
                        except Exception as e:
                            current_app.logger.error(
                                f"Error generating PDF for student {student_id}: {str(e)}"
                            )
                            continue
                
                # Send ZIP file
                return send_file(
                    zip_path,
                    mimetype='application/zip',
                    as_attachment=True,
                    download_name='all_student_reports.zip'
                )
        except Exception as e:
            current_app.logger.error(f"Error generating all reports: {str(e)}", exc_info=True)
            from flask_restx import abort
            abort(500, f"Error generating all reports: {str(e)}")


@reports_ns.route("/attendance")
class ReportsAttendance(Resource):
    def get(self):
        grade_name = request.args.get("grade_name")
        return report_service.get_report_attendance(grade_name)


@reports_ns.route("/students")
class ReportsStudents(Resource):
    def get(self):
        """
        Trigger async generation of student reports.
        Returns task_id immediately for status polling.
        """
        try:
            # Trigger the Celery task
            task = process_generate_student_report.delay()
            
            current_app.logger.info(f"Started report generation task: {task.id}")
            
            return {
                "message": "Report generation started. Please check status using the task_id.",
                "task_id": task.id,
                "status_url": f"/api/reports/students/status/{task.id}"
            }, 202  # 202 Accepted - request accepted for processing
        except Exception as e:
            current_app.logger.error(f"Error starting report generation task: {str(e)}", exc_info=True)
            return {"error": f"Failed to start report generation: {str(e)}"}, 500


@reports_ns.route("/students/status/<string:task_id>")
class ReportsStudentsStatus(Resource):
    @reports_ns.marshal_with(task_status_model)
    def get(self, task_id):
        """
        Check the status of a report generation task.
        """
        try:
            task = celery_app.AsyncResult(task_id)
            
            response = {
                "task_id": task_id,
                "status": task.status,
            }
            
            if task.status == "SUCCESS":
                response["result"] = task.result
            elif task.status == "FAILURE":
                response["error"] = str(task.info) if task.info else "Unknown error"
                if isinstance(task.info, Exception):
                    response["error"] = str(task.info)
            
            return response, 200
        except Exception as e:
            current_app.logger.error(f"Error checking task status {task_id}: {str(e)}", exc_info=True)
            return {
                "task_id": task_id,
                "status": "ERROR",
                "error": str(e)
            }, 500


@reports_ns.route("/students/download/<string:task_id>")
class ReportsStudentsDownload(Resource):
    def get(self, task_id):
        """
        Download the generated student reports ZIP file.
        Only works if the task has completed successfully.
        """
        try:
            # Check task status
            task = celery_app.AsyncResult(task_id)
            
            if task.status != "SUCCESS":
                response = jsonify({
                    "error": f"Report generation not complete. Current status: {task.status}",
                    "status": task.status
                })
                response.status_code = 400
                return response
            
            # Get file path from task result
            result = task.result
            
            # Check if task failed
            if not result:
                response = jsonify({
                    "error": "Report generation task returned no result",
                    "task_status": task.status
                })
                response.status_code = 404
                return response
            
            if result.get("status") != "success":
                error_msg = result.get("error", "Unknown error")
                response = jsonify({
                    "error": f"Report generation failed: {error_msg}",
                    "details": result,
                    "task_status": task.status
                })
                response.status_code = 500
                return response
            
            file_path = result.get("file_path")
            filename = result.get("filename", f"student_reports_{task_id}.zip")
            
            if not file_path or not os.path.exists(file_path):
                response = jsonify({
                    "error": "Generated report file not found",
                    "file_path": file_path
                })
                response.status_code = 404
                return response
            
            # Send the file
            return send_file(
                file_path,
                mimetype="application/zip",
                as_attachment=True,
                download_name=filename
            )
            
        except Exception as e:
            current_app.logger.error(f"Error downloading report for task {task_id}: {str(e)}", exc_info=True)
            return {"error": f"Failed to download report: {str(e)}"}, 500


@reports_ns.route("/students/<int:student_id>")
class ReportsStudentsDetail(Resource):
    def get(self, student_id):
        # maybe later I can add week number for convenience
        # week_number = request.args.get("week_number")
        return report_service.generate_one_student_reports(student_id)


@reports_ns.route("/students/<int:student_id>/weekly")
class ReportsStudentsWeekly(Resource):
    def get(self, student_id):
        """
        Generate a week-based report for a student.
        Query parameters:
        - num_weeks: Number of weeks to include (default: 6)
        """
        num_weeks = request.args.get("num_weeks", default=6, type=int)
        return report_service.generate_one_student_reports_weekly(student_id, num_weeks)


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
