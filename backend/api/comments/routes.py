from flask_restx import Namespace, Resource, fields
from services.comment_service import CommentService
from flask_jwt_extended import get_jwt_identity, jwt_required

comments_ns = Namespace("Comments", description="Comment related operations")

comment_model = comments_ns.model(
    "Comment",
    {
        "mode_id": fields.Integer(description="Unique ID of the mode record"),
        "mode_name": fields.String(description="Name of the mode"),
    },
)

comment_service = CommentService()

@comments_ns.route("/")
class Comments(Resource):
    def get(self):
        pass

    @jwt_required()
    def delete(self):
        teacher_id = get_jwt_identity()

        return comment_service.delete_all_comments(teacher_id)
