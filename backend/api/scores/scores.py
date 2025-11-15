from flask_restx import Namespace, Resource, fields
from flask import request
from utils.db import DBHelper
from dao.score_dao import ScoreDAO

scores_ns = Namespace("Scores", description="Scores related operations")

score_model = scores_ns.model(
    "Score",
    {
        "student_id": fields.Integer,
        "student_name": fields.String,
        "subject_id": fields.Integer,
        "subject_name": fields.String,
        "daily_scores": fields.List(
            fields.Nested(
                scores_ns.model(
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


@scores_ns.route("/")
class StudentScores(Resource):
    @scores_ns.marshal_list_with(score_model)
    def get(self):
        # TODO: need to change grade to grade id
        data = request.args
        grade = data.get("grade")
        subject_id = data.get("subject_id")
        week_dates_string = data.get("week_dates")
        level_id = data.get("level_id")
        mode_id = data.get("mode_id")

        week_dates = week_dates_string.split(",")

        rows = score_dao.get_scores_for_week_and_subject(
            week_dates, grade, mode_id, level_id, subject_id
        )

        print(rows)

        # Transform into grouped format
        student_map = {}
        for row in rows:
            student_id = row["student_id"]
            if student_id not in student_map:
                student_map[student_id] = {
                    "student_id": student_id,
                    "student_name": row["name"],
                    "subject_id": row["subject_id"],
                    "subject_name": row["subject_name"],
                    "daily_scores": [],
                }
            student_map[student_id]["daily_scores"].append(
                {
                    "date": row["assignedDate"],
                    "score": (
                        row["raw_marks"]
                        if row["raw_marks"] is not None
                        else (-1 if row["submission_id"] is not None else -100)
                    ),  # -1 means not submitted, 0 means literally 0 score
                }
            )

        # print(list(student_map.values()))

        return list(student_map.values())

    def post(self):
        pass
