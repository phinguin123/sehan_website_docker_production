# auth/jwt.py
from flask_jwt_extended import JWTManager
from flask import jsonify

jwt = JWTManager()


def register_jwt_callbacks(app):
    jwt.init_app(app)

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        print("callback missing access cookie")
        return jsonify(code="MISSING_ACCESS_COOKIE", msg=reason), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify(code="INVALID_TOKEN", msg=reason), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print("expired token!")
        return jsonify(code="TOKEN_EXPIRED", msg="Token has expired"), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify(code="TOKEN_REVOKED", msg="Token has been revoked"), 401
