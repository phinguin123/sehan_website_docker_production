from flask_restx import Namespace, Resource, fields
from services.teacher_service import TeacherService
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.subjects.routes import subject_names_model

teachers_ns = Namespace("Teachers", description="Teachers related operations")

teacher_base_model = teachers_ns.model(
    "TeacherBase",
    {
        "teacher_name": fields.String(required=True, description="Name of the teacher"),
        "teacher_type": fields.String(
            required=True, description="Type of the teacher (only two: teacher, TA)"
        ),
        "subjects": fields.List(
            fields.Nested(subject_names_model),
            description="List of subjects the teacher teaches",
        ),
        "zoom_user_id": fields.String(
            required=True, description="Zoom user ID of the teacher"
        ),
        "username": fields.String(required=True, description="Username of the teacher"),
    },
)

teacher_input_model = teachers_ns.inherit(
    "TeacherInput",
    teacher_base_model,
    {
        "password": fields.String(required=True, description="Password of the teacher"),
    },
)

teacher_output_model = teachers_ns.inherit(
    "TeacherOutput",
    teacher_base_model,
    {
        "teacher_id": fields.Integer(
            required=True, description="Unique ID of the teacher record"
        ),
    },
)

teacher_service = TeacherService()


@teachers_ns.route("/")
class Teachers(Resource):
    @teachers_ns.marshal_list_with(teacher_output_model)
    @jwt_required()
    def get(self):
        return teacher_service.get_teachers()

    @teachers_ns.expect(teacher_input_model)
    @teachers_ns.marshal_with(teacher_input_model)
    @teachers_ns.doc(responses={201: "Teacher created successfully"})
    @teachers_ns.doc(description="Create a new teacher")
    @jwt_required()
    def post(self):
        """Create a new teacher"""
        data = teachers_ns.payload
        teacher = teacher_service.create_teacher(data)

        return teacher, 201

    @teachers_ns.expect(teacher_output_model)
    @teachers_ns.marshal_with(teacher_output_model)
    @teachers_ns.doc(responses={201: "Teacher edited successfully"})
    @teachers_ns.doc(description="Edit a teacher")
    @jwt_required()
    def put(self):
        """Edit a teacher"""
        data = teachers_ns.payload
        print("Data received for editing teacher:", data)
        teacher = teacher_service.edit_teacher(data)

        return teacher, 200

    # @teachers_ns.route("/<int:teacher_id>")
    # @teachers_ns.doc(description="Delete a teacher")
    # @jwt_required()
    # def delete_parent(self, parent_id):
    #     """Delete a parent by ID"""
    #     parent_service.delete_parent(parent_id)
    #     return {"message": "Parent deleted successfully"}, 204
@teachers_ns.route("/name")
class TeacherName(Resource):
    @jwt_required()
    def get(self):
        teacher_id = get_jwt_identity()
        name = teacher_service.get_teacher_name(teacher_id)

        return {"name": name}, 200