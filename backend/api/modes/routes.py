from flask_restx import Namespace, Resource, fields
from flask import request
from utils.db import DBHelper
from dao.mode_dao import ModeDAO

mode_ns = Namespace("Modes", description="Mode related operations")

mode_model = mode_ns.model(
    "Mode",
    {
        "mode_id": fields.Integer(description="Unique ID of the mode record"),
        "mode_name": fields.String(description="Name of the mode"),
    },
)

db_helper = DBHelper()
mode_dao = ModeDAO(db_helper)


@mode_ns.route("/")
class Modes(Resource):

    @mode_ns.marshal_list_with(mode_model)
    def get(self):
        return mode_dao.get_modes()
