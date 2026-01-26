from flask_restx import Namespace, Resource
from flask import send_from_directory, current_app, request, abort
from flask_jwt_extended import jwt_required
import os

files_ns = Namespace("Files", description="File serving operations")


@files_ns.route("/")
class FileByQuery(Resource):
    def get(self):
        """
        Serve a file specified via the `file` query parameter.

        This matches the frontend usage:
            GET /api/files/?file=<urlencoded_filename>
        """
        filename = request.args.get("file")

        if not filename:
            abort(400, "Missing 'file' query parameter")

        upload_folder = current_app.config.get("UPLOAD_FOLDER")

        # Security: prevent directory traversal
        if ".." in filename or filename.startswith("/"):
            abort(400, "Invalid filename")

        file_path = os.path.join(upload_folder, filename)

        if not os.path.exists(file_path):
            abort(404, "File not found")

        return send_from_directory(upload_folder, filename)


@files_ns.route("/<path:filename>")
class FileServe(Resource):
    def get(self, filename):
        """Serve a file from the uploads folder"""
        try:
            upload_folder = current_app.config.get("UPLOAD_FOLDER")
            
            # Security: prevent directory traversal
            if ".." in filename or filename.startswith("/"):
                abort(400, "Invalid filename")
            
            file_path = os.path.join(upload_folder, filename)
            
            if not os.path.exists(file_path):
                abort(404, "File not found")
            
            return send_from_directory(upload_folder, filename)
        except Exception as e:
            abort(500, f"Error serving file: {str(e)}")


@files_ns.route("/uploads/<path:filename>")
class UploadsServe(Resource):
    def get(self, filename):
        """Legacy uploads endpoint"""
        upload_folder = current_app.config.get("UPLOAD_FOLDER")
        return send_from_directory(upload_folder, filename)
