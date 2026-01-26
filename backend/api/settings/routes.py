from flask_restx import Namespace, Resource, fields, abort
from flask import request
from utils.db import DBHelper
from sehan_kakao_alimtalk import send_before_summer_message, send_before_winter_message
import os
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta
import pytz

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")
SEHAN_END_DATE = os.environ.get("SEHAN_END_DATE")

settings_ns = Namespace("Settings", description="Settings related operations")

# settings_model = settings_ns.model("Score", {
#     "student_id": fields.Integer,
#     "student_name": fields.String,
#     "subject_id": fields.Integer,
#     "subject_name": fields.String,
#     "daily_scores": fields.List(fields.Nested(settings_ns.model("DailyScore", {
#         "date": fields.String,
#         "score": fields.Integer,
#     })))
# })

db_helper = DBHelper()


@settings_ns.route("/credentials")
class CredentialsSettings(Resource):
    def get(self):
        """Get credentials notice text"""
        try:
            # Try to get credentials_notice_text from settings table
            query = """
                SELECT setting_value 
                FROM settings 
                WHERE setting_key = 'credentials_notice_text'
                LIMIT 1
            """
            result = db_helper.fetch_one(query)
            credentials_notice_text = result.get("setting_value", "") if result else ""
            
            return {"credentials_notice_text": credentials_notice_text}, 200
        except Exception as e:
            # If settings table doesn't exist, return empty string
            logger.warning(f"Error fetching credentials notice text: {e}")
            return {"credentials_notice_text": ""}, 200

    def post(self):
        """Send credentials to all students"""
        query = """
            SELECT 
                s.email AS student_email, 
                p.email AS parent_email, 
                p.phone_number 
            from parents_students ps 
            JOIN parents p ON ps.parent_id = p.parent_id
            JOIN students s ON ps.student_id = s.student_id
            """

        results = db_helper.fetch_all(query)

        for row in results:
            parent_phone_number = row["phone_number"]
            student_email = row["student_email"]
            parent_email = row["parent_email"]

            send_before_winter_message(
                parent_phone_number, SEHAN_START_DATE, student_email, parent_email
            )
        
        return {"message": "Credentials sent to all students"}, 200


@settings_ns.route("/credentials/<int:student_id>")
class CredentialsStudent(Resource):
    def get(self, student_id):
        pass

    def post(self, student_id):
        query = """
            SELECT 
                s.email AS student_email, 
                p.email AS parent_email, 
                p.phone_number 
            from parents_students ps 
            JOIN parents p ON ps.parent_id = p.parent_id
            JOIN students s ON ps.student_id = s.student_id
            WHERE ps.student_id = %s
            """

        result = db_helper.fetch_one(query, (student_id,))

        if not result:
            abort(404, "No such student matched")

        parent_phone_number = result["phone_number"]
        student_email = result["student_email"]
        parent_email = result["parent_email"]
        
        if not parent_phone_number:
            abort(400, "Parent phone number is missing")

        logger.info(f"Sending winter message to student_id={student_id}, phone={parent_phone_number}, email={student_email}")
        
        success = send_before_winter_message(
            parent_phone_number, SEHAN_START_DATE, student_email, parent_email
        )
        
        if success:
            return {"message": "Message sent successfully", "student_id": student_id}, 200
        else:
            return {"message": "Failed to send message. Check logs for details.", "student_id": student_id}, 500


@settings_ns.route("/report/notice_text")
class ReportNoticeText(Resource):
    """Manage report notice text setting"""
    
    def get(self):
        """Get the current report notice text"""
        try:
            # Ensure settings table exists
            create_table_query = """
                CREATE TABLE IF NOT EXISTS settings (
                    setting_key VARCHAR(255) PRIMARY KEY,
                    setting_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            """
            db_helper.execute(create_table_query)
            
            query = """
                SELECT setting_value 
                FROM settings 
                WHERE setting_key = 'report_notice_text'
                LIMIT 1
            """
            result = db_helper.fetch_one(query)
            notice_text = result.get("setting_value", "") if result else ""
            
            return {"notice_text": notice_text}, 200
        except Exception as e:
            logger.error(f"Error fetching report notice text: {e}")
            abort(500, f"Error fetching report notice text: {str(e)}")
    
    def post(self):
        """Set the report notice text"""
        try:
            data = request.get_json()
            if not data or "reportNotice" not in data:
                abort(400, "reportNotice is required")
            
            notice_text = data["reportNotice"]
            
            # Ensure settings table exists
            create_table_query = """
                CREATE TABLE IF NOT EXISTS settings (
                    setting_key VARCHAR(255) PRIMARY KEY,
                    setting_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            """
            db_helper.execute(create_table_query)
            
            # Insert or update the setting
            query = """
                INSERT INTO settings (setting_key, setting_value)
                VALUES ('report_notice_text', %s)
                ON DUPLICATE KEY UPDATE 
                    setting_value = %s,
                    updated_at = CURRENT_TIMESTAMP
            """
            db_helper.execute(query, (notice_text, notice_text))
            
            return {"message": "Report notice text set successfully", "notice_text": notice_text}, 200
        except Exception as e:
            logger.error(f"Error setting report notice text: {e}")
            abort(500, f"Error setting report notice text: {str(e)}")


@settings_ns.route("/exam_end_time")
class ExamEndTime(Resource):
    """Manage exam end time setting"""
    
    def get(self):
        """Get the current exam end time and hours before"""
        try:
            # Ensure settings table exists
            create_table_query = """
                CREATE TABLE IF NOT EXISTS settings (
                    setting_key VARCHAR(255) PRIMARY KEY,
                    setting_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            """
            db_helper.execute(create_table_query)
            
            query = """
                SELECT setting_value 
                FROM settings 
                WHERE setting_key = 'exam_end_time'
                LIMIT 1
            """
            result = db_helper.fetch_one(query)
            exam_end_time = result.get("setting_value", "") if result else ""
            
            query_hours = """
                SELECT setting_value 
                FROM settings 
                WHERE setting_key = 'hours_before'
                LIMIT 1
            """
            result_hours = db_helper.fetch_one(query_hours)
            hours_before = result_hours.get("setting_value", "0") if result_hours else "0"
            
            return {
                "exam_end_time": exam_end_time,
                "hours_before": hours_before
            }, 200
        except Exception as e:
            logger.error(f"Error fetching exam end time: {e}")
            abort(500, f"Error fetching exam end time: {str(e)}")
    
    def post(self):
        """Set the exam end time and hours before"""
        try:
            data = request.get_json()
            if not data or "examEndTime" not in data:
                abort(400, "examEndTime is required")
            
            exam_end_time = data["examEndTime"]
            hours_before = str(data.get("hoursBefore", 0))
            
            # Ensure settings table exists
            create_table_query = """
                CREATE TABLE IF NOT EXISTS settings (
                    setting_key VARCHAR(255) PRIMARY KEY,
                    setting_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            """
            db_helper.execute(create_table_query)
            
            # Insert or update exam_end_time
            query = """
                INSERT INTO settings (setting_key, setting_value)
                VALUES ('exam_end_time', %s)
                ON DUPLICATE KEY UPDATE 
                    setting_value = %s,
                    updated_at = CURRENT_TIMESTAMP
            """
            db_helper.execute(query, (exam_end_time, exam_end_time))
            
            # Insert or update hours_before
            query_hours = """
                INSERT INTO settings (setting_key, setting_value)
                VALUES ('hours_before', %s)
                ON DUPLICATE KEY UPDATE 
                    setting_value = %s,
                    updated_at = CURRENT_TIMESTAMP
            """
            db_helper.execute(query_hours, (hours_before, hours_before))
            
            return {
                "message": "Exam end time set successfully",
                "exam_end_time": exam_end_time,
                "hours_before": hours_before
            }, 200
        except Exception as e:
            logger.error(f"Error setting exam end time: {e}")
            abort(500, f"Error setting exam end time: {str(e)}")


@settings_ns.route("/reset")
class ResetServer(Resource):
    """Reset server (placeholder - implement actual reset logic)"""
    
    def post(self):
        """Reset the server"""
        try:
            # TODO: Implement actual server reset logic
            # This is a placeholder endpoint
            logger.warning("Server reset requested - not implemented")
            return {"message": "Server reset functionality not yet implemented"}, 200
        except Exception as e:
            logger.error(f"Error resetting server: {e}")
            abort(500, f"Error resetting server: {str(e)}")


@settings_ns.route("/academic-calendar")
class AcademicCalendar(Resource):
    """
    Get academic calendar information including start date, end date, and week calculation helpers.
    This endpoint provides the necessary data for frontend components to calculate week dates dynamically.
    """
    
    def get(self):
        """
        Returns academic calendar information:
        - start_date: The start date of the academic term (YYYY-MM-DD)
        - end_date: The end date of the academic term (YYYY-MM-DD)
        - current_week_number: The current week number based on the start date
        - total_weeks: Total number of weeks in the academic term
        """
        if not SEHAN_START_DATE:
            abort(500, "SEHAN_START_DATE is not configured in environment variables")
        
        if not SEHAN_END_DATE:
            abort(500, "SEHAN_END_DATE is not configured in environment variables")
        
        try:
            seoul_tz = pytz.timezone("Asia/Seoul")
            start_date_obj = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
            end_date_obj = seoul_tz.localize(datetime.strptime(SEHAN_END_DATE, "%Y-%m-%d"))
            current_date = datetime.now(seoul_tz)
            
            # Calculate current week number
            days_difference = (current_date.date() - start_date_obj.date()).days
            current_week_number = max(1, (days_difference // 7) + 1) if days_difference >= 0 else 0
            
            # Calculate total weeks
            total_days = (end_date_obj.date() - start_date_obj.date()).days
            total_weeks = max(1, (total_days // 7) + 1)
            
            # Find the Monday of the start week (week starts on Monday)
            start_date_weekday = start_date_obj.weekday()  # 0 = Monday, 6 = Sunday
            monday_of_start_week = start_date_obj - timedelta(days=start_date_weekday)
            
            return {
                "start_date": SEHAN_START_DATE,
                "end_date": SEHAN_END_DATE,
                "monday_of_start_week": monday_of_start_week.strftime("%Y-%m-%d"),
                "current_week_number": current_week_number,
                "total_weeks": total_weeks,
            }, 200
            
        except ValueError as e:
            logger.error(f"Error parsing dates: {e}")
            abort(500, f"Invalid date format in environment variables: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in academic calendar endpoint: {e}", exc_info=True)
            abort(500, f"Internal server error: {str(e)}")
