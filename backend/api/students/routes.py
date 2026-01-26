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
from utils.db import DBHelper
from utils.agent_log import agent_log

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
    @jwt_required()
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

    @jwt_required()
    def delete(self, student_id):
        """Delete a student"""
        try:
            db_helper = DBHelper()
            with db_helper.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT COUNT(*) AS cnt FROM parents_students WHERE student_id = %s",
                        (student_id,),
                    )
                    link_cnt = cur.fetchone()["cnt"]
                    agent_log(
                        {
                            "location": "students/routes.py:delete",
                            "message": "pre-delete link check",
                            "data": {"student_id": student_id, "link_count": link_cnt},
                            "sessionId": "debug-session",
                            "runId": "delete-run1",
                        }
                    )
                    if link_cnt > 0:
                        # Return plain dict so Flask-RESTx can serialize it
                        return (
                            {
                                "msg": "Cannot delete student: remove parent-student matches first",
                                "code": "STUDENT_LINKED",
                                "link_count": link_cnt,
                            },
                            400,
                        )

            result = student_service.delete_student(student_id)
            return result, 200
        except ValueError as e:
            abort(404, message=str(e))
        except Exception as e:
            abort(500, message=f"Error deleting student: {str(e)}")


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


@students_ns.route("/me/attendance/rate")
class StudentAttendanceRate(Resource):
    @jwt_required()
    def get(self):
        """Get attendance rate for logged-in student"""
        import pytz
        import os
        from datetime import datetime
        
        role = get_jwt()["role"]
        student_id = None

        if role == "student":
            student_id = get_jwt_identity()
        elif role == "parent":
            student_id = request.args.get("student_id")
        else:
            abort(400, "You should be either parent or student")

        SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")
        seoul_tz = pytz.timezone("Asia/Seoul")
        start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
        current_date = datetime.now(seoul_tz)

        number_of_days = (current_date - start_date).days + 1
        if number_of_days <= 0:
            number_of_days = 1

        try:
            # Get student's subjects count
            query1 = "SELECT * FROM student_classes WHERE student_id = %s"
            subject_count = db_helper.fetch_all(query1, (student_id,)) or []

            # Get distinct days
            query2 = "SELECT DISTINCT day_id from timetable"
            distinct_days = len(db_helper.fetch_all(query2))

            week_number = (number_of_days - 1) // 7
            total_days_passed_in_current_week = number_of_days % 7
            
            if total_days_passed_in_current_week == 0:
                valid_days_passed_in_current_week = distinct_days
            elif total_days_passed_in_current_week > distinct_days:
                valid_days_passed_in_current_week = distinct_days
            else:
                valid_days_passed_in_current_week = total_days_passed_in_current_week

            rate_excluding_today = len(subject_count) * (
                week_number * distinct_days + (valid_days_passed_in_current_week - 1)
            )

            # Get classes passed today
            query3 = """
                SELECT COUNT(DISTINCT c.class_id) AS classes_passed
                FROM student_classes sc
                JOIN classes c ON sc.class_id = c.class_id
                JOIN timetable t ON t.class_id = c.class_id
                JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
                WHERE sc.student_id = %s
                AND t.day_id = (DAYOFWEEK(CURDATE())-1)
                AND ts.start_time < CURTIME()
            """
            rate_today_row = db_helper.fetch_one(query3, (student_id,))
            rate_today = rate_today_row.get("classes_passed", 0) if rate_today_row else 0

            total_rate = rate_excluding_today + rate_today

            # Get actual attendance count
            query4 = """
                SELECT attendance_date, subject_name, COUNT(*) as count
                FROM attendance
                WHERE student_id = %s
                AND attendance_date between %s and CURDATE()
                AND status != "absent" AND status != "reset"
                GROUP BY attendance_date, subject_name
            """
            number_of_attendance = len(db_helper.fetch_all(query4, (student_id, SEHAN_START_DATE)))

            if total_rate <= 0:
                total_rate = number_of_attendance + 1

            attendance_rate = int((number_of_attendance / total_rate) * 100)
            if attendance_rate > 100:
                attendance_rate = 100

            return attendance_rate, 200
        except Exception as e:
            abort(500, f"Error calculating attendance rate: {str(e)}")


@students_ns.route("/me/homework/rate")
class StudentHomeworkRate(Resource):
    @jwt_required()
    def get(self):
        """Get homework submission rate for logged-in student"""
        import os
        
        role = get_jwt()["role"]
        student_id = None
        grade = None

        if role == "student":
            student_id = get_jwt_identity()
            grade = get_jwt()["grade"]
        elif role == "parent":
            student_id = request.args.get("student_id")
            query = "SELECT grade FROM students WHERE student_id = %s"
            grade_row = db_helper.fetch_one(query, (student_id,))
            grade = grade_row.get("grade") if grade_row else None
        else:
            abort(400, "You should be either parent or student")

        SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")

        try:
            # Get student's subjects
            query1 = """
                SELECT s.subject_name FROM student_classes sc
                JOIN classes c ON sc.class_id = c.class_id
                JOIN subjects s ON c.subject_id = s.subject_id
                WHERE sc.student_id = %s
            """
            subjects = db_helper.fetch_all(query1, (student_id,))
            subject_names = [s["subject_name"] for s in subjects]

            if not subject_names:
                return 0, 200

            placeholders = ",".join(["%s"] * len(subject_names))
            
            # Get total homework count
            query2 = f"""
                SELECT COUNT(*) as total_homework
                FROM homework h
                JOIN subjects s ON h.subject_id = s.subject_id
                JOIN grades g ON h.grade_id = g.grade_id
                WHERE g.grade = %s
                AND s.subject_name IN ({placeholders})
                AND h.assignedDate >= %s
            """
            params = [grade] + subject_names + [SEHAN_START_DATE]
            total_homework_row = db_helper.fetch_one(query2, tuple(params))
            total_homework = total_homework_row.get("total_homework", 0) if total_homework_row else 0

            # Get submitted homework count
            query3 = f"""
                SELECT COUNT(DISTINCT shs.homework_id) as submitted_count
                FROM student_homework_submission shs
                JOIN homework h ON shs.homework_id = h.homework_id
                JOIN subjects s ON h.subject_id = s.subject_id
                WHERE shs.student_id = %s
                AND s.subject_name IN ({placeholders})
                AND h.assignedDate >= %s
            """
            params2 = [student_id] + subject_names + [SEHAN_START_DATE]
            submitted_row = db_helper.fetch_one(query3, tuple(params2))
            submitted_count = submitted_row.get("submitted_count", 0) if submitted_row else 0

            if total_homework == 0:
                return 100, 200

            homework_rate = int((submitted_count / total_homework) * 100)
            return homework_rate, 200
        except Exception as e:
            abort(500, f"Error calculating homework rate: {str(e)}")


@students_ns.route("/me/grade")
class StudentGrade(Resource):
    @jwt_required()
    def get(self):
        """Get grade for logged-in student"""
        student_id = get_jwt_identity()
        
        try:
            query = "SELECT grade FROM students WHERE student_id = %s"
            data = db_helper.fetch_one(query, (student_id,))
            return data, 200
        except Exception as e:
            abort(500, f"Error fetching student grade: {str(e)}")


@students_ns.route("/me/subjects")
class StudentSubjects(Resource):
    @jwt_required()
    def get(self):
        """Get subjects for logged-in student"""
        student_id = get_jwt_identity()
        
        try:
            query = """
                SELECT s.subject_id, s.subject_name, l.id as level_id, l.level_name
                FROM student_classes sc
                JOIN classes c ON sc.class_id = c.class_id
                JOIN subjects s ON c.subject_id = s.subject_id
                JOIN levels l ON sc.level_id = l.id
                WHERE sc.student_id = %s
            """
            subjects = db_helper.fetch_all(query, (student_id,))
            return subjects, 200
        except Exception as e:
            abort(500, f"Error fetching student subjects: {str(e)}")


@students_ns.route("/<int:student_id>/for-parent")
class StudentForParent(Resource):
    def get(self, student_id):
        """Get student data for parent (no auth required for specific use case)"""
        try:
            query = "SELECT student_id, name, grade FROM students WHERE student_id = %s"
            student = db_helper.fetch_one(query, (student_id,))
            
            if not student:
                abort(404, "Student not found")
            
            return student, 200
        except Exception as e:
            abort(500, f"Error fetching student data: {str(e)}")


@students_ns.route("/manual")
class StudentManualList(Resource):
    @jwt_required()
    def get(self):
        """Get list of manually registered students"""
        try:
            query = """
                SELECT student_id, name, email, grade, school
                FROM students
                WHERE kakao_id IS NULL
                ORDER BY name
            """
            students = db_helper.fetch_all(query)
            return students, 200
        except Exception as e:
            abort(500, f"Error fetching manual students: {str(e)}")

    @jwt_required()
    def post(self):
        """Manually register a new student"""
        data = request.json
        name = data.get("name")
        email = data.get("email")
        grade = data.get("grade")
        school = data.get("school")

        if not all([name, email, grade]):
            abort(400, "Name, email, and grade are required")

        try:
            # Check if email exists
            check_query = "SELECT * FROM students WHERE email = %s"
            existing = db_helper.fetch_one(check_query, (email,))
            
            if existing:
                abort(400, "Student with this email already exists")

            # Insert student
            insert_query = """
                INSERT INTO students (name, email, grade, school)
                VALUES (%s, %s, %s, %s)
            """
            db_helper.execute(insert_query, (name, email, grade, school))

            return {"message": "Student registered successfully"}, 201
        except Exception as e:
            abort(500, f"Error registering student: {str(e)}")


@students_ns.route("/me/name")
class StudentName(Resource):
    @jwt_required()
    def get(self):
        """Get name of logged-in student"""
        student_id = get_jwt_identity()
        
        try:
            query = "SELECT name FROM students WHERE student_id = %s"
            data = db_helper.fetch_one(query, (student_id,))
            return data, 200
        except Exception as e:
            abort(500, f"Error fetching student name: {str(e)}")


@students_ns.route("/names")
class StudentNames(Resource):
    @jwt_required()
    def get(self):
        """Get names of students for a specific grade"""
        grade = request.args.get("grade")
        
        if not grade:
            abort(400, "Grade parameter is required")
        
        try:
            query = "SELECT student_id, name FROM students WHERE grade = %s ORDER BY name"
            students = db_helper.fetch_all(query, (grade,))
            return students, 200
        except Exception as e:
            abort(500, f"Error fetching student names: {str(e)}")


@students_ns.route("/all-names")
class AllStudentNames(Resource):
    @jwt_required()
    def get(self):
        """Get all student names"""
        try:
            query = "SELECT student_id, name, grade FROM students ORDER BY grade, name"
            students = db_helper.fetch_all(query)
            return students, 200
        except Exception as e:
            abort(500, f"Error fetching all student names: {str(e)}")


@students_ns.route("/me/marks")
class StudentMarks(Resource):
    @jwt_required()
    def get(self):
        """Get marks/scores for logged-in student"""
        student_id = get_jwt_identity()
        subject = request.args.get("subject")
        
        try:
            if subject:
                query = """
                    SELECT shs.*, h.title, h.assignedDate, h.dueDate, s.subject_name
                    FROM student_homework_submission shs
                    JOIN homework h ON shs.homework_id = h.homework_id
                    JOIN subjects s ON h.subject_id = s.subject_id
                    WHERE shs.student_id = %s AND s.subject_name = %s
                    ORDER BY h.assignedDate DESC
                """
                marks = db_helper.fetch_all(query, (student_id, subject))
            else:
                query = """
                    SELECT shs.*, h.title, h.assignedDate, h.dueDate, s.subject_name
                    FROM student_homework_submission shs
                    JOIN homework h ON shs.homework_id = h.homework_id
                    JOIN subjects s ON h.subject_id = s.subject_id
                    WHERE shs.student_id = %s
                    ORDER BY h.assignedDate DESC
                """
                marks = db_helper.fetch_all(query, (student_id,))
            
            return marks, 200
        except Exception as e:
            abort(500, f"Error fetching student marks: {str(e)}")