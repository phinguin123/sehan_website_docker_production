"""
Sehan IBP Website - Flask Application
Clean, modular entry point for the application
"""
# Load environment variables first
from dotenv import load_dotenv
import os

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)
load_dotenv()  # Fallback to current directory

# Flask imports
from flask import Flask, send_from_directory, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import jwt_required
from datetime import timedelta
import logging
import sys

# Import custom JSON encoder
from utils.utils import DecimalEncoder

# Import JWT configuration
from auth.jwt import register_jwt_callbacks

"""
Flask application entrypoint for the Sehan IBP backend.

NOTE:
- Legacy blueprints under `backend/blueprints/*` have been removed during
  the RESTX refactor.
- All HTTP endpoints should now be exposed via Flask‑RESTX namespaces
  defined in `backend/api/*` and registered on the shared `api` instance.
"""

# Import RESTX API (registers all namespaces under /api/*)
from api import api

# Import services
from services.scheduler_service import SchedulerService

# Configure logging
os.makedirs("logs", exist_ok=True)

# Root logger configuration
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)

# Remove existing handlers
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# File handler
file_handler = logging.FileHandler("logs/server.log", mode="a", encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
file_handler.setFormatter(file_formatter)
root_logger.addHandler(file_handler)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
console_handler.setFormatter(console_formatter)
root_logger.addHandler(console_handler)

# Suppress verbose loggers
logging.getLogger("matplotlib").setLevel(logging.WARNING)
logging.getLogger("PIL").setLevel(logging.WARNING)


# ============================================================================
# APPLICATION FACTORY
# ============================================================================

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # ========================================================================
    # CONFIGURATION
    # ========================================================================
    
    app.json_encoder = DecimalEncoder
    
    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "***REMOVED-JWT-SECRET***")
    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    app.config["JWT_COOKIE_SECURE"] = False
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config["JWT_COOKIE_SAMESITE"] = "Lax"
    app.config["JWT_COOKIE_PATH"] = "/"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JWT_SESSION_COOKIE"] = False
    app.config["JWT_CSRF_CHECK_FORM"] = True
    
    # Upload Configuration
    app.config["UPLOAD_FOLDER"] = os.environ.get(
        "UPLOAD_FOLDER", 
        "/home/ubuntu/sehan_website/homework"
    )
    
    # Misc Configuration
    app.config["PREFERRED_URL_SCHEME"] = "https"
    app.config["PROPAGATE_EXCEPTIONS"] = True
    app.url_map.strict_slashes = False
    
    # CORS Configuration
    cors_config = {
        "origins": [
            "https://dev.sehanibp.kr",
            "https://sehanibp.kr",
            "https://www.sehanibp.kr",
        ],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization", "Content-Disposition"],
        "expose_headers": ["Authorization", "Content-Disposition"],
    }
    
    CORS(app, resources={r"/*": cors_config})
    
    # ========================================================================
    # JWT SETUP
    # ========================================================================
    
    register_jwt_callbacks(app)
    
    # ========================================================================
    # REGISTER RESTX API
    # ========================================================================
    #
    # All namespaces are declared and added to `api` in `api/__init__.py`.
    # Calling `api.init_app(app)` mounts them under their configured prefixes,
    # e.g.:
    #   - /api/homework
    #   - /api/reference
    #   - /api/files
    #   - etc.
    #
    # This replaces the old blueprint‑based routing.
    api.init_app(app)
    
    # ========================================================================
    # ERROR HANDLERS
    # ========================================================================
    
    from flask_jwt_extended.exceptions import NoAuthorizationError
    from jwt.exceptions import ExpiredSignatureError
    
    IGNORED_EXCEPTIONS = (
        NoAuthorizationError,
        ExpiredSignatureError,
    )
    
    @app.errorhandler(Exception)
    def handle_global_error(error):
        """Global error handler"""
        if not isinstance(error, IGNORED_EXCEPTIONS) and "Missing cookie" in str(error):
            app.logger.error("Unhandled exception: %s", error, exc_info=True)
        
        return {"message": str(error)}, getattr(error, "code", 500)
    
    # ========================================================================
    # ESSENTIAL ROUTES (Infrastructure)
    # ========================================================================
    
    @app.route("/.well-known/pki-verification/<path:filename>")
    def https_validate(filename):
        """SSL certificate validation"""
        return send_from_directory(".well-known/pki-validation", filename)
    
    @app.route("/test")
    def test_page():
        """Health check endpoint"""
        return jsonify({"status": "ok", "message": "Server is running"}), 200
    
    @app.route("/logout")
    @jwt_required()
    def logout():
        """Logout endpoint - clear JWT cookies"""
        response = make_response(jsonify({"message": "Logged out"}))
        response.set_cookie("access_token_cookie", "", expires=0, path="/")
        response.set_cookie("refresh_token_cookie", "", expires=0, path="/")
        return response
    
    # ========================================================================
    # INITIALIZE SERVICES
    # ========================================================================
    
    # Initialize scheduler (production only)
    scheduler = SchedulerService(app)
    scheduler.initialize()
    
    return app


# ============================================================================
# CREATE APP INSTANCE
# ============================================================================

app = create_app()


# ============================================================================
# DEVELOPMENT SERVER
# ============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    
    app.logger.info(f"Starting Flask server on port {port}")
    app.logger.info(f"Debug mode: {debug}")
    app.logger.info(f"Environment: {os.environ.get('APP_MODE', 'development')}")
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=debug,
    )
