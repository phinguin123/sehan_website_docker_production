from flask_restx import Namespace, Resource, fields, abort
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from services.submission_service import SubmissionService, SubmissionAlreadyGradedException
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
        "submission_date": fields.DateTime(
            dt_format="iso8601",
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
        Get homework submissions (Admin: filtered list | Student: their submissions).
        """
        # ---------------------------------------------------------
        # Helper function to fix datetime serialization
        # Handles both camelCase and snake_case naming conventions
        # Converts any datetime/date objects to ISO format strings
        # ---------------------------------------------------------
        def serialize_submission(sub):
            from datetime import datetime, date
            
            # Convert all datetime/date objects to ISO format strings, regardless of field name
            for key, value in sub.items():
                if isinstance(value, (datetime, date)):
                    sub[key] = value.isoformat()
            
            return sub

        # ---------------------------------------------------------
        # 1. Admin Request (Filtered/Paginated)
        # ---------------------------------------------------------
        if request.args.get("graded_status") or request.args.get("itemsPerPage"):
            filters = {
                "subject_id": request.args.get("subject_id"),
                "grade_id": request.args.get("grade_id"),
                "level_id": request.args.get("level_id"),
                "type": request.args.get("type"),
                "graded_by": request.args.get("graded_by"),
                "search_query": request.args.get("searchQuery"),
                "sort_by": request.args.get("sortBy", "submission_date"),
                "sort_order": request.args.get("sortOrder", "desc"),
                "page": int(request.args.get("page", 1)),
                "limit": int(request.args.get("itemsPerPage", 50)),
                "graded_status": request.args.get("graded_status"),
            }
            result = submission_service.get_all_submissions(filters)

            # [FIX]: Transform backend result to match Frontend expectations:
            # Frontend expects: { data: [...], totalPages: int, totalCount: int }
            response_payload = {
                "data": [],
                "totalPages": 0,
                "totalCount": 0
            }
            if isinstance(result, dict):
                # Assuming service returns standard keys like 'items' or 'data'
                # We normalize them here:
                raw_items = result.get("items") or result.get("data", [])
                response_payload["data"] = [serialize_submission(s) for s in raw_items]
                response_payload["totalPages"] = result.get("pages", 0) # Service usually returns 'pages'
                response_payload["totalCount"] = result.get("total", 0) # Service usually returns 'total'
            
            elif isinstance(result, list):
                # If service returns just a list, wrap it manually
                serialized_list = [serialize_submission(s) for s in result]
                response_payload["data"] = serialized_list
                response_payload["totalPages"] = 1
                response_payload["totalCount"] = len(serialized_list)

            return response_payload, 200

        # ---------------------------------------------------------
        # 2. Student Request (My Submissions)
        # ---------------------------------------------------------
        else:
            subject = request.args.get("subject")
            student_id = get_jwt_identity()
            
            if subject:
                from utils.utils import get_subject_id_by_name 
                subject_data = get_subject_id_by_name(subject)
                if not subject_data: return [], 200
                
                subject_id = subject_data["subject_id"]
                submissions = submission_service.get_submissions_by_subject_id(student_id, subject_id)
                if submissions:
                    submissions = [serialize_submission(s) for s in submissions]
                return submissions, 200
            
            return [], 200

    @submissions_ns.expect(submission_input_model)
    @jwt_required()
    def post(self):
        """
        Create a new homework submission (by student)
        """
        student_id = get_jwt_identity()
        file = request.files.get("file")
        filename = None

        if file:
            if file.filename == "":
                return {"error": "No file name"}, 400
            # Sanitize filename
            bad_chars_pattern = re.compile(r'[<>#%]')
            if bad_chars_pattern.search(file.filename):
                return {"message": "File name should not contain any special characters!"}, 400
            
            timestamp = get_current_time().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_{file.filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
            file.save(file_path)

        submission_data = request.form

        try:
            submission_service.create_submission(student_id, submission_data, filename)
            return {"message": "Submission created successfully"}, 201
        except ValueError as e:
            return {"message": str(e)}, 400
        except Exception as e:
            return {"message": f"Error creating submission: {str(e)}"}, 500

@submissions_ns.route("/<int:submission_id>")
class HomeworkSubmission(Resource):
    @submissions_ns.expect(submission_output_model)
    @jwt_required()
    def put(self, submission_id):
        """
        Grade a homework submission (by teacher).
        """
        # Handling file upload for teacher comment
        file = request.files.get("teacher_comment_file")
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
        if teacher_comment_file_name:
            submission_data["teacher_comment_file_name"] = teacher_comment_file_name
        
        # Get grader name from JWT
        jwt_data = get_jwt()
        submission_data["graded_by"] = jwt_data.get("name", "Admin") 
        submission_data["id"] = submission_id

        # Convert numeric fields
        try:
            if "raw_score" in submission_data:
                submission_data["raw_score"] = float(submission_data["raw_score"])
            if "total_score" in submission_data:
                submission_data["total_score"] = float(submission_data["total_score"])
            if "marks" in submission_data:
                submission_data["marks"] = int(submission_data["marks"])
        except ValueError:
            return {"message": "Invalid score format"}, 400

        submission_service.grade_submission(submission_data)
        return {"message": "Submission graded successfully"}, 200

    @jwt_required()
    def delete(self, submission_id):
        """
        Delete a submission (Admin/Teacher only).
        """
        try:
            submission_service.delete_submission(submission_id)
            return {"message": "Submission deleted successfully"}, 200
        except Exception as e:
            return {"message": f"Error deleting submission: {str(e)}"}, 500