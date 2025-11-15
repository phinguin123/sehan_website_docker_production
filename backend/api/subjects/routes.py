from flask import request
from flask_restx import Namespace, Resource, fields
from utils.db import DBHelper
from dao.subject_dao import SubjectDAO
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

subjects_ns = Namespace("Subjects", description="Subject-related operations")

# Subject only names model
subject_names_model = subjects_ns.model(
    "Subject Names",
    {
        "subject_id": fields.Integer(
            description="Subject ID", required=True, example=1
        ),
        "subject_name": fields.String(
            description="Name of the subject", required=True, example="Math"
        ),
    },
)

# Subject Model
subject_model = subjects_ns.model(
    "Subject",
    {
        "subject_id": fields.Integer(
            description="Subject ID", required=False, example=1
        ),
        "subject_name": fields.String(
            description="Name of the subject", required=False, example="Math"
        ),
        "level_id": fields.Integer(description="level ID", required=False, example=1),
        "level_name": fields.String(
            description="Level of the subject", required=False, example="HL"
        ),
        "mode_id": fields.Integer(description="Mode ID", required=False, example=1),
        "mode_name": fields.String(
            description="Mode of the subject", required=False, example="Online"
        ),
        "comment_text": fields.String(
            description="Comment text for the subject", required=False, example="This is a comment"
        ),
    },
)

db_helper = DBHelper()
subject_dao = SubjectDAO(db_helper)


def parse_subject_query_args():
    fields = request.args.get("fields")
    if fields:
        fields = fields.split(",")
    filters = {}
    if subject_id := request.args.get("subject_id"):
        filters["subject_id"] = subject_id
    if subject_name := request.args.get("subject_name"):
        filters["subject_name"] = subject_name
    return fields, filters


@subjects_ns.route("/")
class Subjects(Resource):
    @subjects_ns.marshal_list_with(subject_model)
    def get(self):
        """Get list of all subjects"""
        fields, filters = parse_subject_query_args()
        subjects = subject_dao.get_subjects(fields=fields, filters=filters)

        return subjects, 200


@subjects_ns.route("/me")
class StudentSubject(Resource):
    @subjects_ns.marshal_list_with(subject_model)
    @jwt_required()
    def get(self):
        """Get list of subjects for specific student"""
        student_id = get_jwt_identity()

        student_subjects = subject_dao.get_student_subjects(student_id)

        return student_subjects
