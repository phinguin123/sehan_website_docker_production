from utils.db import DBHelper
from dao.homework_dao import HomeworkDAO
from dao.submission_dao import SubmissionDAO

db_helper = DBHelper()


class HomeworkCreationError(Exception):
    pass


class SubmissionExistsException(Exception):
    pass


class HomeworkService:
    def __init__(self):
        self.homework_dao = HomeworkDAO(db_helper)
        self.submission_dao = SubmissionDAO(db_helper)

    def get_all_homework(self):
        """
        Fetch all homework records.
        """
        return self.homework_dao.get_all_homework()

    def create_homework(
        self,
        title,
        subject_id,
        assigned_date,
        due_date,
        grade_id,
        level_id,
        description,
        homework_type,
        filename=None,
    ):
        # check if there is already a homework assigned for the same date, subject, grade and level
        existing_homework = self.homework_dao.get_homework_by_assigned_date(
            assigned_date, subject_id, grade_id, level_id
        )
        if existing_homework:
            raise HomeworkCreationError(
                "Homework for the selected assigned date already exists."
            )

        return self.homework_dao.create_homework(
            title=title,
            subject_id=subject_id,
            assigned_date=assigned_date,
            due_date=due_date,
            grade_id=grade_id,
            level_id=level_id,
            description=description,
            homework_type=homework_type,
            filename=filename,
        )


    def edit_homework(
        self,
        homework_data
    ):
        # check if there is already a homework assigned for the same date, subject, grade and level
        existing_homework = self.homework_dao.get_homework_by_assigned_date(
            homework_data.get('assignedDate'), homework_data.get('subject_id'), homework_data.get('grade_id'), homework_data.get('level_id')
        )
        if existing_homework and existing_homework.get('id') != homework_data.get('id'):
            raise HomeworkCreationError(
                "Homework for the selected assigned date already exists."
            )

        return self.homework_dao.edit_homework(
            homework_data
        )

    def delete_homework(self, homework_id):
        submission_exists = self.submission_dao.check_submission_by_homework_id(
            homework_id
        )

        if submission_exists:
            raise SubmissionExistsException(
                "Should not delete homework since there are already multiple submissions!"
            )

        return self.homework_dao.delete_homework(homework_id)
