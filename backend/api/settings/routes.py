from flask_restx import Namespace, Resource, fields, abort
from flask import request
from utils.db import DBHelper
from sehan_kakao_alimtalk import send_before_summer_message
import os

SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")

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
class StudentScores(Resource):
    def get(self):
        pass

    def post(self):
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

            send_before_summer_message(
                parent_phone_number, SEHAN_START_DATE, student_email, parent_email
            )


@settings_ns.route("/credentials/<int:student_id>")
class StudentScores(Resource):
    def get(self):
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

        result = db_helper.fetch_one(query, (student_id))

        if not result:
            abort("No such student matched")

        parent_phone_number = result["phone_number"]
        student_email = result["student_email"]
        parent_email = result["parent_email"]

        send_before_summer_message(
            parent_phone_number, SEHAN_START_DATE, student_email, parent_email
        )
