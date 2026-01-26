import math

class SubmissionDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_all_submissions(self, filters):
        """
        Get submissions with pagination and filtering.
        """
        params = []
        where_clauses = ["1=1"]  # Default true for appending AND clauses

        # Dynamic Filtering
        if filters.get("graded_status") == "pending":
            where_clauses.append("shs.graded_by IS NULL")
        elif filters.get("graded_status") == "graded":
            where_clauses.append("shs.graded_by IS NOT NULL")

        if filters.get("subject_id"):
            where_clauses.append("h.subject_id = %s")
            params.append(filters["subject_id"])

        if filters.get("grade_id"):
            where_clauses.append("h.grade_id = %s")
            params.append(filters["grade_id"])

        if filters.get("level_id"):
            where_clauses.append("h.level_id = %s")
            params.append(filters["level_id"])
        
        if filters.get("type"):
            where_clauses.append("h.type = %s")
            params.append(filters["type"])
            
        if filters.get("graded_by"):
            where_clauses.append("shs.graded_by = %s")
            params.append(filters["graded_by"])

        if filters.get("search_query"):
            query_str = f"%{filters['search_query']}%"
            where_clauses.append("(shs.student_name LIKE %s OR h.title LIKE %s)")
            params.extend([query_str, query_str])

        where_sql = " AND ".join(where_clauses)

        # Count Total Query
        count_query = f"""
            SELECT COUNT(*) as total
            FROM student_homework_submission shs
            JOIN homework h ON shs.homework_id = h.id
            WHERE {where_sql}
        """
        total_count_res = self.db.fetch_one(count_query, tuple(params))
        total_count = total_count_res['total'] if total_count_res else 0

        # Main Data Query
        # Sort mapping - UPDATED to use submission_date
        sort_map = {
            "submittedDate": "shs.submission_date",
            "submission_date": "shs.submission_date",
            "dueDate": "h.dueDate",
            "due_date": "h.dueDate"
        }
        # Default to submission_date if key not found
        sort_col = sort_map.get(filters.get("sort_by"), "shs.submission_date")
        sort_order = "DESC" if filters.get("sort_order") == "desc" else "ASC"
        
        limit = filters.get("limit", 50)
        offset = (filters.get("page", 1) - 1) * limit

        # UPDATED SELECT query to use shs.submission_date
        query = f"""
            SELECT 
                shs.*, 
                shs.submission_date,
                h.title, 
                h.dueDate, 
                h.assignedDate,
                h.type,
                sub.subject_name,
                g.grade as grade_name,
                l.level_name as level_name
            FROM student_homework_submission shs
            JOIN homework h ON shs.homework_id = h.id
            LEFT JOIN subjects sub ON h.subject_id = sub.subject_id
            LEFT JOIN grades g ON h.grade_id = g.grade_id
            LEFT JOIN levels l ON h.level_id = l.id
            WHERE {where_sql}
            ORDER BY {sort_col} {sort_order}
            LIMIT %s OFFSET %s
        """
        
        # Add limit/offset to params
        params.extend([limit, offset])
        
        data = self.db.fetch_all(query, tuple(params))
        
        return {
            "data": data,
            "totalCount": total_count,
            "totalPages": math.ceil(total_count / limit),
            "currentPage": filters.get("page")
        }

    def delete_submission(self, submission_id):
        query = "DELETE FROM student_homework_submission WHERE id = %s"
        return self.db.execute(query, (submission_id,))

    def check_submission_graded(self, submission_id):
        query = """
            SELECT * from student_homework_submission WHERE id = %s AND graded_by IS NOT NULL;
        """

        return self.db.fetch_one(query, (submission_id))
    
    def get_submission_by_id(self, submission_id):
        """
        Get submission by ID.
        """
        query = """
            SELECT * from student_homework_submission WHERE id = %s;
        """
        return self.db.fetch_one(query, (submission_id,))

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
        return self.db.fetch_all(query, (student_id, subject_id))

    def check_submission_by_homework_id(self, homework_id):
        query = "SELECT * from student_homework_submission WHERE homework_id = %s"

        return self.db.fetch_all(query, (homework_id,))
    
    def check_homework_past_due(self, homework_id):
        """
        Check if homework due date has passed.
        Returns True if past due, False otherwise.
        """
        query = """
            SELECT dueDate FROM homework WHERE id = %s
        """
        result = self.db.fetch_one(query, (homework_id,))
        
        if not result or not result.get("dueDate"):
            return False
        
        from datetime import datetime, date
        due_date = result["dueDate"]
        
        # Handle both date objects and strings
        if isinstance(due_date, str):
            # Parse date string (format: YYYY-MM-DD or YYYY/MM/DD)
            due_date = datetime.strptime(due_date.replace("/", "-"), "%Y-%m-%d").date()
        elif isinstance(due_date, date):
            due_date = due_date
        else:
            return False
        
        today = date.today()
        return due_date < today
    
def grade_submission(self, submission_data):
        # Build query dynamically to handle optional file updates
        set_clauses = [
            "raw_marks = %s", "raw_score = %s", "total_score = %s",
            "marks = %s", "comment = %s", "graded_by = %s"
        ]
        params = [
            submission_data.get("raw_marks"),
            submission_data.get("raw_score"),
            submission_data.get("total_score"),
            submission_data.get("marks"),
            submission_data.get("comment"),
            submission_data.get("graded_by")
        ]

        if "teacher_comment_file_name" in submission_data:
            set_clauses.append("teacher_comment_file_name = %s")
            params.append(submission_data["teacher_comment_file_name"])

        query = f"""
            UPDATE student_homework_submission 
            SET {', '.join(set_clauses)}
            WHERE id = %s
        """
        params.append(submission_data.get("id"))
        
        return self.db.execute(query, tuple(params))
