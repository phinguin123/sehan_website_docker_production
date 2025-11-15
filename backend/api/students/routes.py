from flask_restx import Namespace, Resource, fields, reqparse, abort
from api.subjects.routes import subject_model
from flask_jwt_extended import get_jwt_identity, jwt_required
from services.student_service import (
    StudentService,
    DuplicateEmailError,
    InvalidSubjectError,
    InvalidClassError,
    NoCurrentClassError,
)
from flask import request, jsonify
from api.homework.routes import (
    homework_get_model,
    get_grade_by_student_id,
)
from utils.utils import get_grade_id_by_student_id, get_subject_id_by_name
from dto.student_homework_submission import student_homework_submission_model

students_ns = Namespace("Students", description="Student-related operations")

# fmt: off
student_output_model = students_ns.model(
    "Student Output",
    {
        "student_id": fields.Integer(
            description="Student ID", required=False, example=1
        ),
        "name": fields.String(
            description="Name of the student", required=True, example="홍길동"
        ),
        "school": fields.String(
            description="School of the student", required=True, example="서울대학교"
        ),
        "grade": fields.String(
            description="Grade of the student", required=True, example="pre-IB"
        ),
        "email": fields.String(
            description="Email of the student (must be unique)", required=True, example="asdf@gmail.com"
        ),
        "subjects": fields.List(fields.Nested(subject_model), description="List of subjects the student is taking"),
    },
)

student_input_model = students_ns.model(
    "Student Input",
    {
        "name": fields.String(
            description="Name of the student", required=True, example="홍길동"
        ),
        "school": fields.String(
            description="School of the student", required=True, example="서울대학교"
        ),
        "grade": fields.String(
            description="Grade of the student", required=True, example="pre-IB"
        ),
        "email": fields.String(
            description="Email of the student (must be unique)", required=True, example="asdf@gmail.com"
        ),
        "subjects": fields.List(fields.Nested(subject_model), description="List of ids of subjects the student is taking"),
    },
)

# fmt: on
student_service = StudentService()
students_ns.models[student_homework_submission_model.name] = (
    student_homework_submission_model
)


@students_ns.route("/")
class Students(Resource):
    @students_ns.marshal_list_with(student_output_model)
    def get(self):
        """Get list of all students"""
        students = student_service.get_students()

        return students, 200

    @students_ns.expect(student_input_model)
    @students_ns.marshal_with(student_output_model)
    def post(self):
        """Create a new student"""
        data = students_ns.payload

        try:
            # Delegate all business logic to the service layer
            student = student_service.create_student(
                name=data.get("name"),
                school=data.get("school"),
                grade=data.get("grade"),
                email=data.get("email"),
                subjects_info=data.get("subjects", []),
            )
            return student, 201
        except DuplicateEmailError as e:
            abort(400, message=str(e))
        except InvalidSubjectError as e:
            abort(400, message=str(e))
        except InvalidClassError as e:
            abort(400, message=str(e))

        # # Check if the student already exists
        # existing_student = student_dao.get_student_by_email(email)
        # if existing_student:
        #     abort(400, message="Student with this email already exists.")

        # # Create the student
        # student_id = student_dao.create_student(name, school, grade, email)

        # # Add subjects to the student
        # for subject in subjects:
        #     subject_name = subject.get("name")
        #     subject_id = get_subject_id(subject_name)
        #     if subject_id:
        #         db_helper.add_student_subject(student_id, subject_id)

        # return db_helper.get_student_by_id(student_id), 201


@students_ns.route("/<int:student_id>")
class Student(Resource):
    @students_ns.expect(student_input_model)
    @students_ns.marshal_with(student_output_model)
    def put(self, student_id):
        """Edit a student"""
        data = students_ns.payload

        try:
            # Delegate all business logic to the service layer
            student = student_service.edit_student(
                student_id=student_id,
                name=data.get("name"),
                school=data.get("school"),
                grade=data.get("grade"),
                email=data.get("email"),
                subjects_info=data.get("subjects", []),
            )
            return student, 201
        except DuplicateEmailError as e:
            abort(400, message=str(e))
        except InvalidSubjectError as e:
            abort(400, message=str(e))
        except InvalidClassError as e:
            abort(400, message=str(e))


# get the current class the student takes
@students_ns.route("/me/current-class")
class StudentCurrentClass(Resource):
    @jwt_required()
    def get(self):
        student_id = get_jwt_identity()

        try:
            current_class = student_service.get_current_class(student_id)

            return current_class, 200

        except NoCurrentClassError as e:
            abort(400, message=str(e))


# get the timetable the student takes
@students_ns.route("/me/timetable")
class StudentTimetable(Resource):
    @jwt_required()
    def get(self):
        student_id = get_jwt_identity()

        try:
            timetable = student_service.get_student_timetable(student_id)

            return timetable, 200

        except NoCurrentClassError as e:
            abort(400, message=str(e))


# get average scores for each subject the student takes
@students_ns.route("/me/subjects/averages")
class StudentSubjectAverages(Resource):
    @jwt_required()
    def get(self):
        student_id = get_jwt_identity()

        try:
            averages = student_service.get_student_subject_averages(student_id)

            return averages, 200

        except NoCurrentClassError as e:
            abort(400, message=str(e))


# get average scores for each subject the student takes (Parents only)
@students_ns.route("/<int:student_id>/subjects/averages")
class StudentSubjectAveragesParent(Resource):
    @jwt_required()
    def get(self, student_id):
        """For subject carousel in parent dashboard"""
        try:
            averages = student_service.get_student_subject_averages(student_id)

            return averages, 200

        except NoCurrentClassError as e:
            abort(400, message=str(e))


@students_ns.route("/me/homework")
class StudentHomework(Resource):
    @students_ns.marshal_list_with(student_homework_submission_model)
    @jwt_required()
    def get(self):
        # TODO: need to change grade to grade id
        student_id = get_jwt_identity()
        subject = request.args.get("subject")
        subject_id = get_subject_id_by_name(subject)["subject_id"]
        grade_id = get_grade_id_by_student_id(student_id)["grade_id"]

        homework_status = student_service.get_student_homework(
            student_id, subject_id, grade_id
        )

        return homework_status

    def post(self):
        pass


@students_ns.route("/<int:student_id>/homework")
class StudentHomeworkMaster(Resource):
    @jwt_required()
    def get(self, student_id):
        """For anyone to see homework status of students"""
        status = request.args.get("status")
        subject_filter = request.args.getlist("subject")

        if subject_filter:
            subject_filter = [int(sid) for sid in subject_filter]
        else:
            subject_filter = "all"

        homework_status = student_service.get_student_homework_master(
            student_id, status=status, subject_filter=subject_filter
        )

        return jsonify(homework_status)


@students_ns.route("/me/homework/master")
class StudentMeHomeworkMaster(Resource):
    @jwt_required()
    def get(self):
        """For anyone to see homework status of students"""
        student_id = get_jwt_identity()
        status = request.args.get("status")
        subject_filter = request.args.getlist("subject")

        if subject_filter:
            subject_filter = [int(sid) for sid in subject_filter]
        else:
            subject_filter = "all"

        homework_status = student_service.get_student_homework_master(
            student_id, status=status, subject_filter=subject_filter
        )

        print("I am sending back", homework_status)

        return jsonify(homework_status)


@students_ns.route("/me/homework/pending")
class StudentPendingHomework(Resource):
    @jwt_required()
    def get(self, student_id):
        """For parent/admin to see homework status of their child"""
        # TODO: need to change grade to grade id
        grade = get_grade_by_student_id(student_id)["grade"]

        homework_status = student_service.get_student_subjects_homework(
            student_id, grade
        )

        # print("I am sending back", homework_status)

        return jsonify(homework_status)


@students_ns.route("/me/attendance")
class StudentAttendance(Resource):
    @jwt_required()
    def post(self):
        """Submit attendance for the student"""
        student_id = get_jwt_identity()
        attendance_data = students_ns.payload
        print("Attendance data received:", attendance_data)

        attendance_status = student_service.submit_attendance(
            student_id, attendance_data
        )

        return attendance_status, 200


@students_ns.route("/comments")
class StudentComments(Resource):
    @students_ns.marshal_list_with(student_output_model)
    def get(self):
        """Get list of all students with comments"""
        students = student_service.get_students_with_comments()

        return students, 200