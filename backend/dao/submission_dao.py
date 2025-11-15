class SubmissionDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def check_submission_graded(self, submission_id):
        query = """
            SELECT * from student_homework_submission WHERE id = %s AND graded_by IS NOT NULL;
        """

        return self.db.fetch_one(query, (submission_id))

    def create_submission(
        self, student_id, student_name, submission_data, filename=None
    ):
        query = """
            INSERT INTO student_homework_submission (student_id, student_name, homework_id, text_attachment, file_name)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (
            student_id,
            student_name,
            submission_data.get("homework_id"),
            submission_data.get("text_attachment", ""),
            filename,
        )

        return self.db.execute(query, params)

    def edit_submission(self, submission_data, submission_id, filename=None):
        set_clauses = []
        params = []
        if "text_attachment" in submission_data:
            set_clauses.append("text_attachment = %s")
            params.append(submission_data["text_attachment"])
        if filename:
            set_clauses.append("file_name = %s")
            params.append(filename)
        params.append(submission_id)
        query = f"UPDATE student_homework_submission SET {', '.join(set_clauses)} WHERE id = %s"

        return self.db.execute(query, params)

    def get_submissions_by_subject_id(self, student_id, subject_id):
        query = """
            SELECT shs.id, shs.student_id, shs.student_name, shs.homework_id, shs.text_attachment, shs.file_name,
                   h.title AS homework_title, h.assignedDate AS assigned_date, h.dueDate AS due_date
            FROM student_homework_submission shs
            JOIN homework h ON shs.homework_id = h.id
            WHERE shs.student_id = %s AND h.subject_id = %s
        """

        return self.db.fetch_all(
            query,
            (
                student_id,
                subject_id,
            ),
        )

    def check_submission_by_homework_id(self, homework_id):
        query = "SELECT * from student_homework_submission WHERE homework_id = %s"

        return self.db.fetch_all(query, (homework_id,))
    
    def grade_submission(self, submission_data):
        query = """
            UPDATE 
                student_homework_submission 
            SET 
                raw_marks = %s, 
                raw_score = %s, 
                total_score = %s, 
                marks = %s, 
                comment = %s, 
                graded_by = %s,
                teacher_comment_file_name = %s
            WHERE 
                id = %s
        """
        return self.db.execute(
            query,
            (
                submission_data.get("raw_marks"),
                submission_data.get("raw_score"),
                submission_data.get("total_score"),
                submission_data.get("marks"),
                submission_data.get("comment"),
                submission_data.get("graded_by"),
                submission_data.get("teacher_comment_file_name"),
                submission_data.get("id")
            ),
        )
