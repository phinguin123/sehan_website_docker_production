from flask_restx import Namespace, Resource, fields
from flask import request
from utils.db import DBHelper
from dao.grade_dao import GradeDAO

grade_ns = Namespace("Grades", description="Grade related operations")

grade_model = grade_ns.model(
    "Grade",
    {
        "grade_id": fields.Integer(description="Unique ID of the grade record"),
        "grade_name": fields.String(description="Name of the grade"),
    },
)

db_helper = DBHelper()
grade_dao = GradeDAO(db_helper)


@grade_ns.route("/")
class Grades(Resource):
    @grade_ns.marshal_list_with(grade_model)
    def get(self):
        return grade_dao.get_grades()
