from flask_restx import Namespace, Resource, abort
from flask import request, current_app
from celery_tasks import process_recording
import os

webhooks_ns = Namespace("Webhooks", description="Webhook handlers")

ZOOM_WEBHOOK_SECRET_TOKEN = os.environ.get("ZOOM_WEBHOOK_SECRET_TOKEN")


@webhooks_ns.route("/zoom")
class ZoomWebhook(Resource):
    def post(self):
        """Handle Zoom webhook events"""
        try:
            # Get the authorization header
            auth_header = request.headers.get("authorization")
            
            if not auth_header or auth_header != ZOOM_WEBHOOK_SECRET_TOKEN:
                current_app.logger.warning("Unauthorized Zoom webhook attempt")
                abort(401, "Unauthorized")

            # Parse the JSON body
            data = request.get_json()

            if not data:
                abort(400, "No data provided")

            event_type = data.get("event")

            # Handle different event types
            if event_type == "endpoint.url_validation":
                # Respond to URL validation
                plain_token = data.get("payload", {}).get("plainToken")
                if plain_token:
                    return {
                        "plainToken": plain_token,
                        "encryptedToken": plain_token  # Simplified for now
                    }, 200
                abort(400, "No plain token provided")

            elif event_type == "recording.completed":
                current_app.logger.info(f"Recording completed event received: {data}")
                
                # Extract recording details
                payload = data.get("payload", {})
                object_data = payload.get("object", {})
                
                # Process recording asynchronously
                process_recording.delay(object_data)
                
                return {"message": "Recording event received"}, 200

            else:
                current_app.logger.info(f"Unhandled Zoom event type: {event_type}")
                return {"message": f"Event type {event_type} received but not processed"}, 200

        except Exception as e:
            current_app.logger.error(f"Error processing Zoom webhook: {str(e)}", exc_info=True)
            abort(500, f"Error processing webhook: {str(e)}")
