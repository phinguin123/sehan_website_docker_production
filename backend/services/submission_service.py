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

    def get_all_submissions(self, filters):
        """
        Fetch all submissions with filters for Admin Dashboard.
        """
        return self.submission_dao.get_all_submissions(filters)

    def create_submission(self, student_id, submission_data, filename=None):
        """
        Create a new homework submission. (by student)
        """
        # Check if homework is past due
        homework_id = submission_data.get("homework_id")
        if homework_id:
            is_past_due = self.submission_dao.check_homework_past_due(homework_id)
            if is_past_due:
                raise ValueError("Cannot submit homework past the due date")
        
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
        
        # Check if homework is past due - get homework_id from submission
        homework_id = submission_data.get("homework_id")
        if not homework_id:
            # Get homework_id from the submission record
            submission = self.submission_dao.get_submission_by_id(submission_id)
            if submission:
                homework_id = submission.get("homework_id")
        
        if homework_id:
            is_past_due = self.submission_dao.check_homework_past_due(homework_id)
            if is_past_due:
                raise ValueError("Cannot edit submission for homework past the due date")

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

    def delete_submission(self, submission_id):
        return self.submission_dao.delete_submission(submission_id)