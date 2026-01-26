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


@scores_ns.route("/exam/average")
class ExamAverages(Resource):
    def get(self):
        """Get exam average marks per subject for a grade"""
        grade_id = request.args.get("gradeID")
        
        if not grade_id:
            from flask_restx import abort
            abort(400, "gradeID parameter is required")
        
        try:
            query = """
                SELECT sub.subject_name, 
                    IFNULL(AVG(shs.raw_marks), 0) AS average_marks
                FROM homework h
                JOIN subjects sub ON h.subject_id = sub.subject_id
                LEFT JOIN student_homework_submission shs 
                    ON h.homework_id = shs.homework_id 
                    AND shs.submission_date = (
                        SELECT MAX(submission_date)
                        FROM student_homework_submission
                        WHERE homework_id = h.homework_id
                        AND student_id = shs.student_id
                    )
                WHERE h.type = 'Exam'
                AND h.grade_id = %s
                GROUP BY sub.subject_name
                ORDER BY sub.subject_name
            """
            result = db_helper.fetch_all(query, (grade_id,))
            
            exam_average_marks = [row["average_marks"] for row in result]
            
            return {"examAverageMarks": exam_average_marks}, 200
        except Exception as e:
            from flask_restx import abort
            abort(500, f"Error fetching exam averages: {str(e)}")


@scores_ns.route("/percentiles")
class Percentiles(Resource):
    def get(self):
        """Get percentile distribution of scores"""
        subject_id = request.args.get("subject_id")
        grade_id = request.args.get("grade_id")
        
        if not subject_id or not grade_id:
            from flask_restx import abort
            abort(400, "subject_id and grade_id are required")
        
        try:
            # Get all scores for the subject and grade
            query = """
                SELECT shs.raw_marks
                FROM student_homework_submission shs
                JOIN homework h ON shs.homework_id = h.homework_id
                JOIN students s ON shs.student_id = s.student_id
                WHERE h.subject_id = %s
                AND h.grade_id = %s
                AND shs.raw_marks IS NOT NULL
                ORDER BY shs.raw_marks
            """
            scores = db_helper.fetch_all(query, (subject_id, grade_id))
            
            if not scores:
                return {"percentiles": {}}, 200
            
            # Calculate percentiles
            marks = [s["raw_marks"] for s in scores]
            total = len(marks)
            
            percentiles = {}
            for percentile in [10, 25, 50, 75, 90]:
                index = int((percentile / 100) * total)
                if index >= total:
                    index = total - 1
                percentiles[f"p{percentile}"] = marks[index]
            
            return {"percentiles": percentiles}, 200
        except Exception as e:
            from flask_restx import abort
            abort(500, f"Error calculating percentiles: {str(e)}")


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
            # Only add daily_score if assignedDate is not None
            # This prevents adding invalid entries with null dates
            if row["assignedDate"] is not None:
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
