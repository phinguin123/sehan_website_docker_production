from flask_restx import Namespace, Resource, fields
from flask import request
from utils.db import DBHelper
from dao.score_dao import ScoreDAO
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

homework_ns = Namespace("Homework", description="Homework related operations")

homework_model = homework_ns.model(
    "Homework",
    {
        "student_id": fields.Integer,
        "student_name": fields.String,
        "subject_id": fields.Integer,
        "subject_name": fields.String,
        "daily_scores": fields.List(
            fields.Nested(
                homework_ns.model(
                    "DailyScore",
                    {
                        "date": fields.String,
                        "score": fields.Integer,
                    },
                )
            )
        ),
    },
)

db_helper = DBHelper()
score_dao = ScoreDAO(db_helper)


@homework_ns.route("/")
class Homework(Resource):

    @homework_ns.marshal_list_with(homework_model)
    def get(self):
        """For admin table scores for a week and subject"""
        # TODO: need to change grade to grade id
        data = request.args
        student_id = get_jwt_identity()
        grade = data.get("grade")
        subject_id = data.get("subject_id")
        week_dates = data.get("week_dates")
        level_id = data.get("level_id")
        mode_id = data.get("mode_id")

        rows = score_dao.get_scores_for_week_and_subject(
            week_dates, grade, mode_id, level_id, subject_id
        )

        # Transform into grouped format
        student_map = {}
        for student_id, name, sub_id, sub_name, date, score in rows:
            if student_id not in student_map:
                student_map[student_id] = {
                    "student_id": student_id,
                    "student_name": name,
                    "subject_id": sub_id,
                    "subject_name": sub_name,
                    "daily_scores": [],
                }
            student_map[student_id]["daily_scores"].append(
                {
                    "date": date,
                    "score": (
                        score if score is not None else -1
                    ),  # -1 means not submitted, 0 means literally 0 score
                }
            )

        return list(student_map.values())

    def post(self):
        pass
