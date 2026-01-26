from flask_restx import Namespace, Resource, fields, abort
from flask import request, current_app
from utils.db import DBHelper
from utils.utils import get_current_time
from dao.homework_dao import HomeworkDAO
from services.homework_service import HomeworkService, HomeworkCreationError
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
import os  # for saving homework files
import re


homework_ns = Namespace(
    "Homework", description="Homework related operations by admin only"
)
homework_post_model = homework_ns.model(
    "Homework Post",
    {
        "title": fields.String(required=True, description="Homework title"),
        "subject_id": fields.Integer(required=True, description="Subject id"),
        "description": fields.String(description="Homework description"),
        "assignedDate": fields.String(
            required=True, description="Date homework was assigned (YYYY-MM-DD)"
        ),
        "dueDate": fields.String(
            required=True, description="Date homework is due (YYYY-MM-DD)"
        ),
        "grade_id": fields.Integer(
            required=True, description='Applicable grade levels, e.g., "10,11"'
        ),
        "level_id": fields.Integer(required=True, description="Level id"),
        "type": fields.String(
            required=True, description="type of homework, enum: homework, exam"
        ),
    },
)

# Base model without ID
homework_base_model = homework_ns.model(
    "Homework Base",
    {
        "title": fields.String(required=True, description="Homework title"),
        "subject_id": fields.Integer(required=True, description="Subject id"),
        "subject_name": fields.String(
            required=False, description="Name of the subject (optional)"
        ),
        "description": fields.String(description="Homework description"),
        "assignedDate": fields.String(
            required=True, description="Date homework was assigned (YYYY-MM-DD)"
        ),
        "dueDate": fields.String(
            required=True, description="Date homework is due (YYYY-MM-DD)"
        ),
        "grade_id": fields.Integer(
            required=True, description="Applicable grade levels"
        ),
        "grade_name": fields.String(
            required=False, description="Name of the grade (optional)"
        ),
        "created_at": fields.String(
            required=False, description="Creation timestamp (optional)"
        ),
        "level_id": fields.Integer(required=True, description="Level id"),
        "level_name": fields.String(
            required=False, description="Name of the level (optional)"
        ),
        "type": fields.String(
            required=True, description="type of homework, enum: homework, exam"
        ),
        "file_name": fields.String(
            required=False, description="Name of the teacher file"
        ),
    },
)

# POST model (for creation)
homework_post_model = homework_ns.clone("Homework Post", homework_base_model)

# GET model (includes ID and other response fields)
homework_get_model = homework_ns.clone(
    "Homework",
    homework_base_model,
    {
        "homework_id": fields.Integer(required=True, description="Homework ID"),
        "created_at": fields.String(description="Creation timestamp"),
    },
)
homework_get_model_old = homework_ns.model(
    "Homework",
    {
        "id": fields.Integer(
            readOnly=True, description="The unique ID of the homework"
        ),
        "title": fields.String(required=True, description="Homework title"),
        "subject": fields.String(required=True, description="Subject name"),
        "description": fields.String(description="Homework description"),
        "assignedDate": fields.String(
            required=True, description="Date homework was assigned (YYYY-MM-DD)"
        ),
        "submittedDate": fields.String(
            required=True, description="Date homework was assigned (YYYY-MM-DD)"
        ),
        "dueDate": fields.String(
            required=True, description="Date homework is due (YYYY-MM-DD)"
        ),
        "grades": fields.String(description='Applicable grade levels, e.g., "10,11"'),
        "levels": fields.String(description='Applicable levels, e.g., "SL,HL"'),
        "type": fields.String(description="Homework type, e.g., essay, quiz"),
        "is_over": fields.Boolean(
            description="Flag indicating if the homework is over"
        ),
        "createdDate": fields.String(
            readOnly=True, description="Timestamp when homework was created"
        ),
        "file_name": fields.String(description="Name of the attached file, if any"),
        "submitted": fields.Boolean(
            description="Flag indicating if the homework is submitted"
        ),
        "marks": fields.Integer(),
        "raw_marks": fields.Integer(),
        "raw_score": fields.Integer(),
        "total_score": fields.Integer(),
        "comment": fields.String(),
    },
)

db_helper = DBHelper()
homework_dao = HomeworkDAO(db_helper)

homework_service = HomeworkService()


def get_grade_by_student_id(student_id):
    query = "SELECT grade FROM students where student_id = %s"

    return db_helper.fetch_one(query, (student_id))


@homework_ns.route("/")
class Homework(Resource):
    @homework_ns.marshal_list_with(homework_get_model)
    @jwt_required()
    def get(self):
        """Get all homework list created (admin only) or filtered by subject (student)"""
        subject = request.args.get("subject")
        
        if subject:
            # Student requesting homework for a specific subject
            from flask_jwt_extended import get_jwt, get_jwt_identity
            from urllib.parse import unquote
            from utils.utils import get_subject_id_by_name
            
            subject = unquote(subject)
            grade = get_jwt().get("grade")
            student_id = get_jwt_identity()
            
            if not grade:
                abort(400, "Grade not set for student")
            
            try:
                subject_info = get_subject_id_by_name(subject)
                subject_id = subject_info["subject_id"]
            except:
                abort(404, f"Subject '{subject}' not found")
            
            # Get homework filtered by subject and student's level
            return homework_service.get_homework_by_subject_for_student(
                student_id, subject_id, grade
            )
        
        return homework_service.get_all_homework()

    @homework_ns.expect(homework_post_model)
    @jwt_required()
    def post(self):
        """Create a new homework (admin only)"""
        if "file" in request.files:
            file = request.files["file"]
        else:
            file = None
            filename = None

        if file:
            timestamp = get_current_time().strftime("%Y%m%d%H%M%S")
            # Sanitize filename: replace spaces and special characters
            safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
            filename = f"{timestamp}_{safe_filename}"
            upload_folder = current_app.config["UPLOAD_FOLDER"]
            # Ensure directory exists
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)

        new_homework = request.form

        title = new_homework.get("title")
        subject_id = new_homework.get("subject_id")
        assignedDate = new_homework.get("assignedDate")
        dueDate = new_homework.get("dueDate")
        grade_id = new_homework.get("grade_id")
        level_id = new_homework.get("level_id")
        description = new_homework.get("description")
        homework_type = new_homework.get("type")

        try:
            homework_service.create_homework(
                title=title,
                subject_id=subject_id,
                assigned_date=assignedDate,
                due_date=dueDate,
                grade_id=grade_id,
                level_id=level_id,
                description=description,
                homework_type=homework_type,
                filename=filename,
            )

        except HomeworkCreationError as e:
            abort(400, message=str(e))


@homework_ns.route("/averages")
class HomeworkAverages(Resource):
    def get(self):
        """Get homework average marks per subject for a grade"""
        grade_id = request.args.get("gradeID")
        
        if not grade_id:
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
                WHERE h.type = 'Homework'
                AND h.grade_id = %s
                GROUP BY sub.subject_name
                ORDER BY sub.subject_name
            """
            result = db_helper.fetch_all(query, (grade_id,))
            
            homework_average_marks = [row["average_marks"] for row in result]
            
            return {"homeworkAverageMarks": homework_average_marks}, 200
        except Exception as e:
            abort(500, f"Error fetching homework averages: {str(e)}")


@homework_ns.route("/<int:homework_id>")
class HomeworkDetail(Resource):
    @homework_ns.expect(homework_post_model)
    @jwt_required()
    def put(self, homework_id):
        if "file" in request.files:
            file = request.files["file"]
        else:
            file = None
            filename = None

        if file:
            timestamp = get_current_time().strftime("%Y%m%d%H%M%S")
            bad_chars_pattern = re.compile(r'[<>#%]')
            if bad_chars_pattern.search(file.filename):
                return {"message": "File name should not contain any special characters!"}, 400
            # Sanitize filename: replace spaces and special characters
            safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
            filename = f"{timestamp}_{safe_filename}"
            upload_folder = current_app.config["UPLOAD_FOLDER"]
            # Ensure directory exists
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
        else:
            # if no file is uploaded, keep the existing filename
            filename = request.form.get("file_name", None)
            if filename == "null":
                filename = None

        new_homework = dict(request.form)
        new_homework["id"] = homework_id
        new_homework["file_name"] = filename

        return homework_service.edit_homework(
            new_homework
        )



    @jwt_required()
    def delete(self, homework_id):
        """Delete homework created by admin"""
        homework_service.delete_homework(homework_id)
