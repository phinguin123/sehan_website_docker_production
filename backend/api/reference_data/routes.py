from flask_restx import Namespace, Resource, fields
from services.reference_service import ReferenceService
from api.levels.routes import level_model
from api.grades.routes import grade_model
from api.modes.routes import mode_model
from api.subjects.routes import subject_names_model

reference_data_ns = Namespace("Reference Data", description="Reference data operations")

reference_data_model = reference_data_ns.model(
    "Reference Data",
    {
        "levels": fields.List(fields.Nested(level_model), description="List of levels"),
        "grades": fields.List(fields.Nested(grade_model), description="List of grades"),
        "modes": fields.List(fields.Nested(mode_model), description="List of modes"),
        "subjects": fields.List(
            fields.Nested(subject_names_model), description="List of subjects"
        ),
    },
)

reference_data_service = ReferenceService()


@reference_data_ns.route("/")
class ReferenceData(Resource):

    @reference_data_ns.marshal_list_with(reference_data_model)
    def get(self):
        return reference_data_service.get_reference_data()
