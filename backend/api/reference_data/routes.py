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


@reference_data_ns.route("/week-number")
class WeekNumber(Resource):
    def get(self):
        """Get current week number since SEHAN_START_DATE"""
        try:
            from datetime import datetime
            import pytz
            import os
            
            SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")
            
            if not SEHAN_START_DATE:
                from flask_restx import abort
                abort(500, "SEHAN_START_DATE not configured")
            
            seoul_tz = pytz.timezone("Asia/Seoul")
            start_date = datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d")
            current_date = datetime.now(seoul_tz).replace(tzinfo=None)
            
            days_difference = (current_date - start_date).days
            
            if days_difference < 0:
                week_number = 0
            else:
                week_number = days_difference // 7 + 1
            
            return {"week_number": week_number}, 200
        except Exception as e:
            from flask_restx import abort
            abort(500, f"Error calculating week number: {str(e)}")
