from dao.submission_dao import SubmissionDAO
from dao.student_dao import StudentDAO
from utils.db import DBHelper

db_helper = DBHelper()


class SubmissionAlreadyGradedException(Exception):
    pass


class SubmissionService:
    def __init__(self):
        self.submission_dao = SubmissionDAO(db_helper)
        self.student_dao = StudentDAO(db_helper)

    def get_submissions_by_subject_id(self, student_id, subject_id):
        """
        Fetch all homework submissions for a specific subject.
        """
        return self.submission_dao.get_submissions_by_subject_id(student_id, subject_id)

    def create_submission(self, student_id, submission_data, filename=None):
        """
        Create a new homework submission. (by student)
        """
        student_name = self.student_dao.get_student_by_id(student_id).get("name")
        return self.submission_dao.create_submission(
            student_id, student_name, submission_data, filename
        )

    def edit_submission(self, submission_data, submission_id, filename=None):
        """
        Edit a submission if it has not been graded yet. (by student)
        """
        check_graded = self.submission_dao.check_submission_graded(submission_id)

        if check_graded:
            raise SubmissionAlreadyGradedException(
                "Cannot edit homework that has already been graded"
            )

        return self.submission_dao.edit_submission(
            submission_data, submission_id, filename
        )

    def grade_submission(self, submission_data):
        """
        Grade a homework submission. (by teacher)
        """
        raw_score = submission_data.get("raw_score")
        total_score = submission_data.get("total_score")

        raw_marks = int((raw_score / total_score) * 100)
        submission_data["raw_marks"] = raw_marks

        return self.submission_dao.grade_submission(
            submission_data
        )