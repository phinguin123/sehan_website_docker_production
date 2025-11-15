"""
Alert management routes for private tutoring system
"""

from flask import request
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required

from .common import alert_dao

# Create alerts namespace
from flask_restx import Namespace
alerts_ns = Namespace('alerts', description='Alert management operations')

@alerts_ns.route('')
class AlertList(Resource):
    @jwt_required()
    def get(self):
        """Get all active alerts"""
        try:
            alerts = alert_dao.get_active_alerts()
            return alerts, 200
        except Exception as e:
            return {'error': str(e)}, 500

@alerts_ns.route('/<int:alert_id>/dismiss')
class DismissAlert(Resource):
    @jwt_required()
    def post(self, alert_id):
        """Dismiss an alert"""
        try:
            alert_dao.dismiss_alert(alert_id)
            return {'message': 'Alert dismissed successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
