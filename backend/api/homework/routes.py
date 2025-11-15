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
        """Get all homework list created (admin only)"""
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
            filename = f"{timestamp}_{file.filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
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
            filename = f"{timestamp}_{file.filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
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
