from flask_restx import Namespace, Resource, fields
from flask import request
from utils.db import DBHelper
from dao.level_dao import LevelDAO

level_ns = Namespace("Levels", description="Level related operations")

level_model = level_ns.model(
    "Level",
    {
        "level_id": fields.Integer(description="Unique ID of the level record"),
        "level_name": fields.String(description="Name of the level"),
    },
)

db_helper = DBHelper()
level_dao = LevelDAO(db_helper)


@level_ns.route("/")
class Levels(Resource):
    @level_ns.marshal_list_with(level_model)
    def get(self):
        # TODO: need to change grade to grade id
        return level_dao.get_levels()
