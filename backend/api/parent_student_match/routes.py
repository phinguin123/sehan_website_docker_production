from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from flask_jwt_extended import jwt_required
from utils.db import DBHelper

parent_student_ns = Namespace(
    "ParentStudentMatch", description="Parent-Student matching operations"
)

match_insert_model = parent_student_ns.model(
    "ParentStudentMatchInsert",
    {
        "parentId": fields.Integer(required=True, description="Parent ID"),
        "studentIds": fields.List(
            fields.Integer, required=True, description="List of student IDs"
        ),
    },
)

match_output_model = parent_student_ns.model(
    "ParentStudentMatch",
    {
        "parentId": fields.Integer(description="Parent ID"),
        "studentIds": fields.String(
            description="Comma-separated list of student IDs"
        ),
    },
)


db_helper = DBHelper()


@parent_student_ns.route("/get")
class ParentStudentMatchGet(Resource):
    @parent_student_ns.marshal_list_with(match_output_model)
    @jwt_required()
    def get(self):
        connection = db_helper.get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                SELECT 
                    p.parent_id AS parentId,
                    GROUP_CONCAT(ps.student_id) AS studentIds
                FROM 
                    parents_students ps
                JOIN 
                    parents p ON ps.parent_id = p.parent_id
                GROUP BY 
                    p.parent_id;
                """
                cursor.execute(sql)
                matches = cursor.fetchall()

                return matches, 200
        finally:
            connection.close()


@parent_student_ns.route("/insert")
class ParentStudentMatchInsert(Resource):
    @parent_student_ns.expect(match_insert_model)
    @jwt_required()
    def post(self):
        return self._upsert()

    @parent_student_ns.expect(match_insert_model)
    @jwt_required()
    def put(self):
        return self._upsert()

    def _upsert(self):
        data = request.json or {}
        parent_id = data.get("parentId")
        student_ids = data.get("studentIds")

        if not parent_id or not student_ids:
            return jsonify({"error": "Missing parentId or studentIds"}), 400

        connection = db_helper.get_connection()

        try:
            with connection.cursor() as cursor:
                # delete existing links
                cursor.execute(
                    "DELETE FROM parents_students WHERE parent_id = %s;", (parent_id,)
                )
                # insert new links
                insert_sql = """
                    INSERT INTO parents_students (parent_id, student_id) VALUES (%s, %s); 
                """
                for student_id in student_ids:
                    cursor.execute(insert_sql, (parent_id, student_id))

                connection.commit()

        except Exception as e:
            return jsonify({"error": str(e)}), 500

        finally:
            connection.close()

        # Return plain dict so Flask-RESTx can serialize without wrapping a Response
        return {"msg": "parent-student match saved"}, 200


@parent_student_ns.route("/delete")
class ParentStudentMatchDelete(Resource):
    @jwt_required()
    def delete(self):
        data = request.json or {}
        parent_id = data.get("parent_id")

        connection = db_helper.get_connection()

        try:
            with connection.cursor() as cursor:
                sql = "DELETE FROM parents_students WHERE parent_id = %s"
                cursor.execute(sql, (parent_id,))
                connection.commit()
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            connection.close()

        # Return plain dict so Flask-RESTx can serialize without wrapping a Response
        return {"msg": "parent-student match deleted"}, 200


@parent_student_ns.route("/cleanup-orphans")
class ParentStudentMatchCleanup(Resource):
    @jwt_required()
    def post(self):
        """
        Delete orphaned parent-student links where the parent or student no longer exists.
        """
        connection = db_helper.get_connection()
        deleted = 0
        try:
            with connection.cursor() as cursor:
                sql = """
                    DELETE ps FROM parents_students ps
                    LEFT JOIN parents p ON ps.parent_id = p.parent_id
                    LEFT JOIN students s ON ps.student_id = s.student_id
                    WHERE p.parent_id IS NULL OR s.student_id IS NULL
                """
                cursor.execute(sql)
                deleted = cursor.rowcount
                connection.commit()
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            connection.close()

        # Return plain dict so Flask-RESTx can serialize without wrapping a Response
        return {"msg": "cleanup completed", "deleted": deleted}, 200

