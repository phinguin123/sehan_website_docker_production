# from flask_restx import Resource, fields
# from api import api

# homework_model = api.model('Homework', {
#     'id': fields.Integer(readOnly=True, description='The unique ID of the homework'),
#     'title': fields.String(required=True, description='Homework title'),
#     'subject': fields.String(required=True, description='Subject name'),
#     'description': fields.String(description='Homework description'),
#     'assignedDate': fields.String(required=True, description='Date homework was assigned (YYYY-MM-DD)'),
#     'dueDate': fields.String(required=True, description='Date homework is due (YYYY-MM-DD)'),
#     'grades': fields.String(description='Applicable grade levels, e.g., "10,11"'),
#     'levels': fields.String(description='Applicable levels, e.g., "SL,HL"'),
#     'type': fields.String(description='Homework type, e.g., essay, quiz'),
#     'is_over': fields.Boolean(description='Flag indicating if the homework is over'),
#     'createdDate': fields.String(readOnly=True, description='Timestamp when homework was created'),
#     'file_name': fields.String(description='Name of the attached file, if any')
# })