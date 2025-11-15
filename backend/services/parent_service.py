from dao.parent_dao import ParentDAO
from dao.student_dao import StudentDAO
from utils.db import DBHelper

db_helper = DBHelper()


class DuplicateEmailError(Exception):
    """Custom exception for duplicate parent entries."""

    pass


class NoDeleteParent(Exception):
    """If there is a match in parent student, do not delete parent"""

    pass


class ParentService:
    def __init__(self):
        self.parent_dao = ParentDAO(db_helper)
        self.student_dao = StudentDAO(db_helper)

    def _check_duplicate_email(self, email, parent_id=None):
        # check for duplicate parent email
        existing_parent = self.parent_dao.get_parent_by_email(email)
        if existing_parent and existing_parent["parent_id"] != parent_id:
            raise DuplicateEmailError("A parent with this email already exists.")

        # check if the email belongs to an existing student
        existing_student = self.student_dao.get_student_by_email(email)
        if existing_student:
            raise DuplicateEmailError(
                "This email is already associated with an existing student."
            )

    def get_parent_by_id(self, parent_id):
        return self.parent_dao.get_parent_by_id(parent_id)

    def create_parent(self, parent_data):
        self._check_duplicate_email(parent_data.get("email"))
        return self.parent_dao.create_parent(parent_data)

    def edit_parent(self, parent_data):
        self._check_duplicate_email(
            parent_data.get("email"), parent_data.get("parent_id")
        )
        return self.parent_dao.edit_parent(parent_data)

    def delete_parent(self, parent_id):
        # Do not delete if there is a parent student match
        parent_student_match_count = self.parent_dao.check_parent_student_match(
            parent_id
        )["COUNT(*)"]

        print(parent_student_match_count)

        if parent_student_match_count > 0:
            raise NoDeleteParent("Parent is matched with a student!!")

        return self.parent_dao.delete_parent(parent_id)
