from flask_restx import Namespace, Resource, fields, abort
from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from services.submission_service import SubmissionService
import os
from utils.utils import get_current_time, get_subject_id_by_name
from dto.student_homework_submission import student_homework_submission_model
import re


submissions_ns = Namespace(
    "Submission", description="Homework Submission related operations by admin only"
)

# fmt: off
submission_base_model = submissions_ns.model(
    "Submission Base",
    {
        "student_id": fields.Integer(
            required=True, description="ID of the student who sumitted this file"
        ),
        "student_name": fields.String(
            required=True, description="Name of the student"
        ),
        "homework_id": fields.Integer(
            required=True, description="ID of the homework"
        ),
    },
)

submission_output_model = submissions_ns.inherit(
    "Submission output model",
    submission_base_model,
    {
        "submission_date": fields.String(
            required=False,
            description="Date the student submitted the homework (YYYY-MM-DD)",
        ),
        "marks": fields.Integer(
            required=False, description="Final IB score (out of 7)"
        ),
        "raw_marks": fields.Integer(
            required=False, description="Percentage of the score (70%)"
        ),
        "raw_score": fields.Integer(
            required=False, description="The raw score given by teacher"
        ),
        "total_score": fields.Integer(
            required=False, description="The raw total score given by teacher"
        ),
        "comment": fields.String(
            required=False, description="Comment given by teacher"
        ),
        "graded_by": fields.String(
            required=False, description="Teacher who graded the homework"
        ),
    },
)


submission_input_model = submissions_ns.inherit(
    "Submission input model",
    submission_base_model,
    {
        "file_name": fields.String(
            required=False, description="File attachment of student"
        ),
        "textAttachment": fields.String(
            required=False, description="Text attachment of student"
        ),
    },
)

# fmt: on

submission_service = SubmissionService()


@submissions_ns.route("/")
class HomeworkSubmissions(Resource):
    @jwt_required()
    def get(self):
        """
        Get all homework submissions for specific subject (for students).
        """
        subject = request.args.get("subject")
        subject_id = get_subject_id_by_name(subject)["subject_id"]
        student_id = get_jwt_identity()

        submissions = submission_service.get_submissions_by_subject_id(
            student_id, subject_id
        )
        return submissions, 200

    @submissions_ns.expect(submission_input_model)
    @jwt_required()
    def post(self):
        """
        Create a new homework submission (by student)
        """
        student_id = get_jwt_identity()
        file = request.files.get("file")
        file_path = ""
        filename = None

        

        if file:
            if file.filename == "":
                return {"error": "No file name"}, 400
            timestamp = get_current_time().strftime("%Y%m%d%H%M%S")
            bad_chars_pattern = re.compile(r'[<>#%]')
            if bad_chars_pattern.search(file.filename):
                return {"message": "File name should not contain any special characters!"}, 400
            filename = f"{timestamp}_{file.filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
            file.save(file_path)

        submission_data = request.form

        submission_service.create_submission(student_id, submission_data, filename)

        return {"message": "Submission created successfully"}, 201


@submissions_ns.route("/<int:submission_id>")
class HomeworkSubmission(Resource):
    @submissions_ns.expect(submission_output_model)
    @jwt_required()
    def post(self, submission_id):
        """
        Grade a homework submission (by teacher).
        """
        file = request.files.get("teacher_comment_file")
        file_path = ""
        teacher_comment_file_name = None

        if file:
            if file.filename == "":
                return {"message": "No file name"}, 400
            bad_chars_pattern = re.compile(r'[<>#%]')
            if bad_chars_pattern.search(file.filename):
                return {"message": "File name should not contain any special characters!"}, 400
            timestamp = get_current_time().strftime("%Y%m%d%H%M%S")
            teacher_comment_file_name = f"{timestamp}_{file.filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], teacher_comment_file_name)
            file.save(file_path)

        submission_data = dict(request.form)
        submission_data["teacher_comment_file_name"] = teacher_comment_file_name
        submission_data["graded_by"] = get_jwt()["name"]
        submission_data["id"] = submission_id

        # convert to integers
        submission_data["raw_score"] = int(submission_data.get("raw_score", 0))
        submission_data["total_score"] = int(submission_data.get("total_score", 0))
        submission_data["marks"] = int(submission_data.get("marks", 0))

        print("submission_data", submission_data)

        submission_service.grade_submission(submission_data)

    @submissions_ns.expect(submission_input_model)
    @jwt_required()
    def put(self, submission_id):
        """Edit homework submission (only if not graded)"""
        file = request.files.get("file")
        file_path = ""
        filename = None

        if file:
            if file.filename == "":
                return {"message": "No file name"}, 400
            timestamp = get_current_time().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_{file.filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
            file.save(file_path)

        submission_data = request.form

        # homework_id = homework_data.get("id")
        # title = homework_data.get("title")
        # subject_id = homework_data.get("subject_id")
        # assignedDate = homework_data.get("assignedDate")
        # dueDate = homework_data.get("dueDate")
        # grade_id = homework_data.get("grade_id")
        # level_id = homework_data.get("level_id")
        # description = homework_data.get("description")
        # homework_type = homework_data.get("type")

        submission_service.edit_submission(submission_data, submission_id, filename)

# @submissions_ns.route("/<int:homework_id>/submissions/<int:submission_id>")
# class HomeworkSubmissionDetail(Resource):
#     @jwt_required()
#     def get(self, homework_id, submission_id):
#         """
#         Get a specific submission for a homework.
#         """
#         pass

#     @jwt_required()
#     def put(self, homework_id, submission_id):
#         """
#         Update a specific submission (if allowed).
#         """
#         pass

#     @jwt_required()
#     def delete(self, homework_id, submission_id):
#         """
#         Delete a specific submission (if allowed).
#         """
#         pass
