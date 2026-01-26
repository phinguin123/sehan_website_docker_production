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
        result = self.homework_dao.get_all_homework()
        # Convert tuple to list for Flask-RESTX marshaling
        if isinstance(result, tuple):
            return list(result)
        return result
    
    def get_homework_by_subject_for_student(self, student_id, subject_id, grade):
        """
        Fetch homework for a specific subject and student, including submission status.
        This replicates the old /api/get-homework endpoint functionality.
        """
        query = """
            SELECT 
                h.id AS homework_id,
                h.title,
                h.assignedDate,
                h.dueDate,
                h.description,
                h.file_name AS homework_file_name,
                s.subject_name AS subject,
                filtered_shs.id AS submission_id,
                filtered_shs.comment,
                filtered_shs.marks,
                filtered_shs.submission_date,
                filtered_shs.text_attachment,
                filtered_shs.raw_score,
                filtered_shs.total_score,
                filtered_shs.file_name AS student_file_name,
                filtered_shs.teacher_comment_file_name
            FROM homework AS h
            JOIN subjects AS s 
                ON h.subject_id = s.subject_id
            JOIN levels AS l
                ON h.level_id = l.id
            JOIN grades AS g
                ON h.grade_id = g.grade_id
            LEFT JOIN (
                SELECT shs.*
                FROM student_homework_submission AS shs
                INNER JOIN (
                    SELECT homework_id, MAX(submission_date) AS latest_submission_date
                    FROM student_homework_submission
                    WHERE student_id = %s
                    GROUP BY homework_id
                ) AS latest_shs
                ON shs.homework_id = latest_shs.homework_id
                AND shs.submission_date = latest_shs.latest_submission_date
                AND shs.student_id = %s
            ) AS filtered_shs
                ON h.id = filtered_shs.homework_id
            WHERE s.subject_id = %s
                AND (
                    h.level_id = (
                        SELECT sc.level_id
                        FROM student_classes sc
                        JOIN classes c ON sc.class_id = c.class_id
                        JOIN subjects sub ON c.subject_id = sub.subject_id AND sub.subject_id = s.subject_id
                        WHERE sc.student_id = %s
                        LIMIT 1
                    )
                    OR h.level_id = 3  -- SL/HL homework (id=3) is visible to all students (both SL and HL)
                )
                AND g.grade = %s
            ORDER BY h.assignedDate DESC
        """
        
        result = db_helper.fetch_all(query, (student_id, student_id, subject_id, student_id, grade))
        return list(result) if result else []

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
