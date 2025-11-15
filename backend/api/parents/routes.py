from flask_restx import Namespace, Resource, fields
from services.parent_service import ParentService
from flask_jwt_extended import jwt_required

parents_ns = Namespace("Parents", description="Parents related operations")

parent_base_model = parents_ns.model(
    "ParentBase",
    {
        "parent_name": fields.String(required=True, description="Name of the parent"),
        "email": fields.String(required=True, description="Email of the parent"),
        "phone": fields.String(required=True, description="Phone number of the parent"),
    },
)

parent_input_model = parents_ns.inherit(
    "ParentInput",
    parent_base_model,
    {},
)

parent_output_model = parents_ns.inherit(
    "ParentOutput",
    parent_base_model,
    {
        "parent_id": fields.Integer(
            required=True, description="Unique ID of the parent record"
        ),
    },
)

parent_service = ParentService()


@parents_ns.route("/")
class Parents(Resource):
    @parents_ns.marshal_list_with(parent_output_model)
    @jwt_required()
    def get(self):
        # TODO: need to change grade to grade id
        return parent_service.get_parents()

    @parents_ns.expect(parent_input_model)
    @parents_ns.marshal_with(parent_input_model)
    @parents_ns.doc(responses={201: "Parent created successfully"})
    @parents_ns.doc(description="Create a new parent")
    @jwt_required()
    def post(self):
        """Create a new parent"""
        data = parents_ns.payload
        parent = parent_service.create_parent(data)

        return parent, 201

    @parents_ns.expect(parent_output_model)
    @parents_ns.marshal_with(parent_output_model)
    @parents_ns.doc(responses={201: "Parent edited successfully"})
    @parents_ns.doc(description="Edit a parent")
    @jwt_required()
    def put(self):
        """Edit a parent"""
        data = parents_ns.payload
        print("Data received for editing parent:", data)
        parent = parent_service.edit_parent(data)

        return parent, 200


@parents_ns.route("/<int:parent_id>")
class ParentsDetails(Resource):
    @parents_ns.doc(description="Delete a parent")
    @jwt_required()
    def delete(self, parent_id):
        """Delete a parent by ID"""
        parent_service.delete_parent(parent_id)
        return {"message": "Parent deleted successfully"}, 204
