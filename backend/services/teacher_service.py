from dao.teacher_dao import TeacherDAO
from utils.db import DBHelper

db_helper = DBHelper()


class DuplicateUsernameError(Exception):
    """Custom exception for duplicate teacher entries."""

    pass

class NoSuchTeacherException(Exception):
    pass


class TeacherService:
    def __init__(self):
        self.teacher_dao = TeacherDAO(db_helper)

    def _check_duplicate_username(self, username, teacher_id=None):
        # check for duplicate teacher username
        existing_teacher = self.teacher_dao.get_teacher_by_username(username)
        if existing_teacher and existing_teacher["teacher_id"] != teacher_id:
            raise DuplicateUsernameError("A teacher with this username already exists.")

    def get_teacher_by_id(self, teacher_id):
        return self.teacher_dao.get_teacher_by_id(teacher_id)

    def get_teachers(self):
        rows = self.teacher_dao.get_teachers()

        teacher_map = {}
        teacher_list = []

        for row in rows:
            teacher_id = row["teacher_id"]

            if teacher_id not in teacher_map:
                teacher_data = {
                    "teacher_id": row["teacher_id"],
                    "teacher_name": row["teacher_name"],
                    "teacher_type": row["teacher_type"],
                    "zoom_user_id": row.get("zoom_user_id", ""),
                    "username": row["username"],
                    "subjects": [],
                }
                teacher_map[teacher_id] = teacher_data
                teacher_list.append(teacher_data)

            teacher_map[teacher_id]["subjects"].append(
                {
                    "subject_id": row["subject_id"],
                    "subject_name": row["subject_name"],
                }
            )

        return teacher_list

    def create_teacher(self, teacher_data):
        manual_connection = self.teacher_dao.db.get_connection()

        try:
            manual_connection.begin()
            # Check for username duplicates. Username should be unique
            self._check_duplicate_username(teacher_data.get("username"))

            # If no duplicate username, just create the teacher
            teacher_id = self.teacher_dao.create_teacher(teacher_data, connection=manual_connection)

            subjects_info = teacher_data.get("subjects", [])
            if not subjects_info:
                teacher_data["subjects"] = []

            # Now, fill in teachers_subjects table
            for subject in subjects_info:
                subject_id = subject.get("subject_id","")
                if not subject_id:
                    raise ValueError("Subject ID cannot be empty.")
                # Create the teacher
                self.teacher_dao.add_teachers_subjects_info(teacher_id, subject_id, connection=manual_connection)

            manual_connection.commit()

            return {
                "id": teacher_id,
                **teacher_data,
            }
        except Exception as e:
            manual_connection.rollback()
            raise e
        finally:
            manual_connection.close()

    def edit_teacher(self, teacher_data):
        manual_connection = self.teacher_dao.db.get_connection()

        try:
            manual_connection.begin()
            # Check for username duplicates. Username should be unique
            self._check_duplicate_username(
                teacher_data.get("username"), teacher_data.get("teacher_id")
            )

            # If no duplicate username, just edit the teacher
            self.teacher_dao.edit_teacher(teacher_data, connection=manual_connection)

            # IMPORTANT
            # Before inserting teacher subjects, delete all teacher subjects
            self.teacher_dao.delete_teachers_subjects_info(
                teacher_data.get("teacher_id"), connection=manual_connection
            )

            subjects_info = teacher_data.get("subjects", [])
            if not subjects_info:
                teacher_data["subjects"] = []

            # Now, fill in teachers_subjects table
            for subject in subjects_info:
                subject_id = subject.get("subject_id", "")
                if not subject_id:
                    raise ValueError("Subject ID cannot be empty.")
                # Create the teacher
                self.teacher_dao.add_teachers_subjects_info(
                    teacher_data["teacher_id"], subject_id, connection=manual_connection
                )

            manual_connection.commit()

            return {
                "id": teacher_data["teacher_id"],
                **teacher_data,
            }
        except Exception as e:
            manual_connection.rollback()
            raise e
        finally:
            manual_connection.close()

    def delete_teacher(self, teacher_id):
        return self.teacher_dao.delete_teacher(teacher_id)
    
    def get_teacher_name(self, teacher_id):
        # check if such teacher_exists
        if not self.teacher_dao.check_teacher_id(teacher_id):
            raise NoSuchTeacherException("No such teacher. Login again please")
        
        return self.teacher_dao.get_teacher_name(teacher_id).get("name", "")
