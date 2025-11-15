from utils.utils import (
    get_grade_id_by_name,
    get_current_time,
    get_current_datetime,
    get_current_day_id,
    get_subject_id_by_name,
)
from dao.student_dao import StudentDAO
from dao.subject_dao import SubjectDAO
from dao.class_dao import ClassDAO
from dao.homework_dao import HomeworkDAO
from dao.attendance_dao import AttendanceDAO
from utils.db import DBHelper
from utils.utils import get_adjusted_current_date
from datetime import datetime, time, timedelta

import pytz

db_helper = DBHelper()


# services/student_service.py
class DuplicateEmailError(Exception):
    pass


class InvalidSubjectError(Exception):
    pass


class InvalidClassError(Exception):
    pass


class NoCurrentClassError(Exception):
    pass


class AttendanceExist(Exception):
    pass


class StudentService:
    def __init__(self):
        self.student_dao = StudentDAO(db_helper)
        self.subject_dao = SubjectDAO(db_helper)
        self.class_dao = ClassDAO(db_helper)
        self.homework_dao = HomeworkDAO(db_helper)
        self.attendance_dao = AttendanceDAO(db_helper)

    def get_students(self):
        return self.student_dao.get_all_students()

    def get_students_with_comments(self):
        """
        Get all students with their comments.
        This method retrieves students and their associated comments.
        """
        return self.student_dao.get_students_with_comments()

    def create_student(self, name, school, grade, email, subjects_info):
        manual_connection = self.student_dao.db.get_connection()

        try:
            manual_connection.begin()

            # Check for email duplicates. Email should be unique
            if self.student_dao.get_student_by_email(email):
                raise DuplicateEmailError("Student with this email already exists.")

            # Check for name duplicates
            number_of_matching_names = (
                self.student_dao.get_number_of_matching_student_names(name)
            )

            # Just add number to names Alice2 Alice3
            # In reports where names should not contain numbers, remove the number Alice3 => Alice
            if number_of_matching_names["COUNT(*)"] > 0:
                name = name + str(number_of_matching_names["COUNT(*)"] + 1)

            student_id = self.student_dao.create_student(
                name, school, grade, email, connection=manual_connection
            )

            list_of_subject_ids = self.subject_dao.get_subjects(fields=["subject_id"])

            valid_subject_ids = {
                s["subject_id"] for s in list_of_subject_ids
            }  # using set!!!! for hash

            for subject_info in subjects_info:
                # Example validation: subject must be a non-empty string
                if subject_info["subject_id"] not in valid_subject_ids:
                    raise InvalidSubjectError(
                        f"Invalid subject id: {subject_info['subject_id']}"
                    )

                # TODO: should not get grade_id by grade
                grade_id = get_grade_id_by_name(grade)["grade_id"]
                subject_id = subject_info["subject_id"]
                level_id = subject_info["level_id"]
                mode_id = subject_info["mode_id"]

                # Using level id, subject id, mode id and grade_id
                # Fetch the class id that the student needs to take
                class_id_row = self.class_dao.find_class_id(
                    grade_id, subject_id, level_id, mode_id
                )

                # No such class exist
                if not class_id_row:
                    raise InvalidClassError("No such class exists")

                class_id = class_id_row["class_id"]

                self.student_dao.add_student_classes_info(
                    student_id, class_id, level_id, connection=manual_connection
                )

            manual_connection.commit()
            # Return the created student (for demonstration)
            return {
                "id": student_id,
                "name": name,
                "school": school,
                "grade": grade,
                "email": email,
                "subjects": subjects_info,
            }
        except Exception:
            manual_connection.rollback()
            raise
        finally:
            manual_connection.close()

    def edit_student(self, student_id, name, school, grade, email, subjects_info):
        manual_connection = self.student_dao.db.get_connection()

        try:
            manual_connection.begin()

            # Check for email duplicates. If there is a student with the email but with different student id
            student_email_check = self.student_dao.get_student_by_email(email)

            if student_email_check and student_email_check["student_id"] != student_id:
                raise DuplicateEmailError("Student with this email already exists.")

            previous_name = self.student_dao.get_student_by_id(student_id)["name"]

            # Check for name duplicates
            number_of_matching_names = (
                self.student_dao.get_number_of_matching_student_names(name)
            )

            # Just add number to names Alice2 Alice3
            # In reports where names should not contain numbers, remove the number Alice3 => Alice
            if previous_name != name and number_of_matching_names["COUNT(*)"] > 0:
                name = name + str(number_of_matching_names["COUNT(*)"] + 1)

            self.student_dao.edit_student(
                student_id, name, school, grade, email, connection=manual_connection
            )

            # IMPORTANT
            # Before inserting student subjects, delete all student classes
            self.student_dao.delete_student_classes_info(
                student_id, connection=manual_connection
            )

            list_of_subject_ids = self.subject_dao.get_subjects(fields=["subject_id"])

            valid_subject_ids = {
                s["subject_id"] for s in list_of_subject_ids
            }  # using set!!!! for hash

            for subject_info in subjects_info:
                # Example validation: subject must be a non-empty string
                if subject_info["subject_id"] not in valid_subject_ids:
                    raise InvalidSubjectError(
                        f"Invalid subject id: {subject_info['subject_id']}"
                    )

                # TODO: should not get grade_id by grade
                grade_id = get_grade_id_by_name(grade)["grade_id"]
                subject_id = subject_info["subject_id"]
                level_id = subject_info["level_id"]
                mode_id = subject_info["mode_id"]
                # Using level id, subject id, mode id and grade_id
                # Fetch the class id that the student needs to take
                class_id_row = self.class_dao.find_class_id(
                    grade_id, subject_id, level_id, mode_id
                )

                # No such class exist
                if not class_id_row:
                    raise InvalidClassError("No such class exists")

                class_id = class_id_row["class_id"]

                self.student_dao.add_student_classes_info(
                    student_id, class_id, level_id, connection=manual_connection
                )

            manual_connection.commit()
            # Return the created student (for demonstration)
            return {
                "id": student_id,
                "name": name,
                "school": school,
                "grade": grade,
                "email": email,
                "subjects": subjects_info,
            }
        except Exception:
            manual_connection.rollback()
            raise
        finally:
            manual_connection.close()

    def get_current_class(self, student_id):
        current_time = get_current_time()
        day_id = get_current_day_id()
        # for testing
        # day_id = 1

        current_class = self.student_dao.get_student_current_class(
            student_id, current_time, day_id
        )

        if not current_class:
            raise NoCurrentClassError("No current class!")

        current_class["start_time"] = str(current_class["start_time"])
        current_class["end_time"] = str(current_class["end_time"])

        return current_class

    def get_student_timetable(self, student_id):
        day_id = get_current_day_id()
        timetable = self.student_dao.get_student_timetable(student_id, day_id)

        if not timetable:
            return []

        # Convert datetime objects to strings for JSON serialization
        for class_info in timetable:
            class_info["start_time"] = str(class_info["start_time"])
            class_info["end_time"] = str(class_info["end_time"])

        return timetable

    def get_student_subject_averages(self, student_id):
        averages = self.student_dao.get_student_subject_averages(student_id)

        if not averages:
            return []

        return averages

    def get_student_homework(self, student_id, subject_id, grade_id):
        return self.homework_dao.get_student_homework(student_id, subject_id, grade_id)

    def get_student_subjects_homework(self, student_id, grade):
        grade_id = get_grade_id_by_name(grade)["grade_id"]
        return self.homework_dao.get_student_subjects_homework(student_id, grade_id)

    def get_student_homework_master(self, student_id, status, subject_filter="all"):
        # Get all subject_ids if filter is 'all'
        if subject_filter == "all":
            subject_ids = self.student_dao.get_subject_ids_for_student(student_id)
        else:
            subject_ids = subject_filter  # list of IDs passed from frontend

        return self.homework_dao.get_student_homework_master(
            student_id, status=status, subject_ids=subject_ids
        )

    def submit_attendance(self, student_id, attendance_data):
        # get today's date (but if after 12am, then previous date)
        current_date = get_adjusted_current_date()

        # check if there is already attendance
        check_attendance = self.attendance_dao.check_attendance_submission(
            student_id, attendance_data, current_date
        )

        if check_attendance:
            if check_attendance["status"] != "reset":
                raise AttendanceExist("Attendance already marked!")

        # check the attendance code
        attendance_code = self.attendance_dao.get_attendance_code()

        if attendance_data.get("code") != attendance_code:
            raise ValueError("Invalid attendance code")

        # otherwise, first get the attendance date
        current_time = get_current_time()
        current_datetime = get_current_datetime()

        attendance_date = ""
        # If current time is between midnight and 3 AM
        if time(0, 0) <= current_time <= time(3, 0):
            # Set attendance date to yesterday
            attendance_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            attendance_date = current_datetime.strftime("%Y-%m-%d")

        # Convert string to time object
        start_time = datetime.strptime(
            attendance_data.get("start_time"), "%H:%M:%S"
        ).time()

        # Create datetime objects by combining date with time
        current_date = current_datetime.date()
        start_datetime = datetime.combine(current_date, start_time)
        start_datetime = pytz.timezone("Asia/Seoul").localize(start_datetime)

        # Calculate time difference
        time_difference = current_datetime - start_datetime
        time_difference_minutes = time_difference.total_seconds() / 60

        # Determine status based on time difference
        if -5 <= time_difference_minutes <= 10:
            status = "present"
        elif 10 < time_difference_minutes <= 30:
            status = "late"
        else:
            return {"message", "too late!"}, 400

        return self.attendance_dao.submit_attendance(
            student_id, attendance_date, status, attendance_data
        )
