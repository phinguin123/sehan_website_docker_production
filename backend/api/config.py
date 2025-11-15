from flask_restx import Namespace, Resource

config_ns = Namespace("config", description="Configuration operations")


@config_ns.route("/")
class Config(Resource):
    def get(self):
        pass
