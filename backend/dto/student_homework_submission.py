from flask_restx import fields, Model

student_homework_submission_model = Model(
    "StudentHomeworkSubmission",
    {
        "submission_id": fields.Integer(required=True),
        "homework_id": fields.Integer(required=True),
        "description": fields.String(),
        "title": fields.String(required=True),
        "subject_id": fields.Integer(required=True),
        "subject_name": fields.String(),
        "assignedDate": fields.String(),
        "dueDate": fields.String(),
        "level_id": fields.Integer(),
        "type": fields.String(),
        "homework_file_name": fields.String(),
        # Submission fields
        "submitted": fields.Boolean(),
        "submission_date": fields.String(),
        "marks": fields.Integer(),
        "raw_marks": fields.Integer(),
        "raw_score": fields.Integer(),
        "total_score": fields.Integer(),
        "comment": fields.String(),
        "student_file_name": fields.String(),
        "text_attachment": fields.String(),
        "teacher_comment_file_name": fields.String(),
        # Calculated fields
        "status": fields.String(enum=["pending", "submitted", "graded"]),
        "days_remaining": fields.Integer(),
    },
)
