class HomeworkDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_all_homework(self):
        query = """
            SELECT h.*, h.id AS homework_id, h.createdDate as created_at, s.subject_name, l.level_name, g.grade as grade_name, COALESCE(file_name, '')
            FROM homework AS h
            JOIN subjects AS s ON h.subject_id = s.subject_id
            JOIN levels AS l ON h.level_id = l.id
            JOIN grades AS g ON h.grade_id = g.grade_id
            ORDER BY h.assignedDate DESC;
        """
        return self.db.fetch_all(query)

    # get student homework itself (not submission. Which means just homework to submit)
    def get_student_homework(self, student_id, subject_id, grade_id):
        # query = """
        #     SELECT *
        #     FROM homework AS h
        #     WHERE
        #         h.subject_id = %s AND
        #         (h.level_id =
        #             (SELECT sc.level_id
        #             FROM student_classes sc
        #             JOIN classes c on sc.class_id = c.class_id
        #             JOIN subjects sub on c.subject_id = sub.subject_id AND sub.subject_id = %s
        #             WHERE student_id = %s)
        #         OR h.level_id = 3) AND
        #         (h.grade_id = (
        #             SELECT g.grade_id
        #             FROM students s
        #             JOIN grades g ON s.grade = g.grade
        #             WHERE student_id = %s
        #         ))
        #         AND h.dueDate >= CURDATE()
        # """
        query = """
            SELECT *
            FROM homework AS h
            JOIN subjects AS s 
                ON h.subject_id = s.subject_id
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
            ) AS filtered_shs
                ON h.id = filtered_shs.homework_id
            WHERE h.subject_id = %s 
            AND (
                h.level_id =
                    (SELECT sc.level_id
                    FROM student_classes sc
                    JOIN classes c on sc.class_id = c.class_id
                    JOIN subjects sub on c.subject_id = sub.subject_id AND sub.subject_id = s.subject_id
                    WHERE student_id = %s)
                OR h.level_id = 3   
            )
            AND h.grade_id = %s
            AND (h.dueDate >= CURDATE() OR filtered_shs.submission_date IS NOT NULL)
            AND h.assignedDate <= CURDATE()
        """
        homework_list = self.db.fetch_all(
            query, (student_id, subject_id, student_id, grade_id)
        )
        # print("pending homework list!!", homework_list)

        query = """SELECT * FROM student_homework_submission WHERE student_id = %s
        """

        submissions = self.db.fetch_all(query, (student_id))
        # remove duplicates
        submission_info = {
            submission["homework_id"]: {
                "submission_id": submission["id"],
                "comment": submission["comment"],
                "marks": submission["marks"],
                "raw_marks": submission["raw_marks"],
                "submission_date": submission["submission_date"],
                "text_attachment": submission["text_attachment"],
                "raw_score": submission["raw_score"],
                "total_score": submission["total_score"],
                "student_file_name": submission["file_name"],
                "teacher_comment_file_name": submission["teacher_comment_file_name"],
            }
            for submission in submissions
        }
        homework_status = [
            {
                "submission_id": (
                    submission_info[hw["id"]]["submission_id"]
                    if hw["id"] in submission_info
                    else None
                ),
                "homework_id": hw["id"],
                "grade_id": hw["grade_id"],
                "level_id": hw["level_id"],
                "type": hw["type"],
                "comment": (
                    submission_info[hw["id"]]["comment"]
                    if hw["id"] in submission_info
                    else None
                ),
                "marks": (
                    submission_info[hw["id"]]["marks"]
                    if hw["id"] in submission_info
                    else None
                ),
                "raw_marks": (
                    submission_info[hw["id"]]["raw_marks"]
                    if hw["id"] in submission_info
                    else None
                ),
                "title": hw["title"],
                "homework_file_name": hw["file_name"],
                "assignedDate": hw["assignedDate"],
                "dueDate": hw["dueDate"],
                "description": hw["description"],
                "submitted": hw["id"] in submission_info,
                "submission_date": (
                    submission_info[hw["id"]]["submission_date"]
                    if hw["id"] in submission_info
                    else None
                ),
                "text_attachment": (
                    submission_info[hw["id"]]["text_attachment"]
                    if hw["id"] in submission_info
                    else None
                ),
                "student_file_name": (
                    submission_info[hw["id"]]["student_file_name"]
                    if hw["id"] in submission_info
                    else None
                ),
                "teacher_comment_file_name": (
                    submission_info[hw["id"]]["teacher_comment_file_name"]
                    if hw["id"] in submission_info
                    else None
                ),
                "raw_score": (
                    submission_info[hw["id"]]["raw_score"]
                    if hw["id"] in submission_info
                    else None
                ),
                "total_score": (
                    submission_info[hw["id"]]["total_score"]
                    if hw["id"] in submission_info
                    else None
                ),
            }
            for hw in homework_list
        ]

        return homework_status

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
        query = """
            INSERT INTO homework (title, subject_id, assignedDate, dueDate, grade_id, level_id, description, type, file_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        return self.db.execute(
            query,
            (
                title,
                subject_id,
                assigned_date,
                due_date,
                grade_id,
                level_id,
                description,
                homework_type,
                filename,
            ),
        )

    def edit_homework(self, homework_data):
        query = """
            UPDATE 
                homework 
            SET 
                title = %s, 
                subject_id = %s, 
                assignedDate = %s, 
                dueDate = %s, 
                grade_id = %s, 
                level_id = %s, 
                description = %s, 
                type = %s, 
                file_name = %s
            WHERE 
                id = %s
            """
        return self.db.execute(
            query,
            (
                homework_data.get("title"),
                homework_data.get("subject_id"),
                homework_data.get("assignedDate"),
                homework_data.get("dueDate"),
                homework_data.get("grade_id"),
                homework_data.get("level_id"),
                homework_data.get("description"),
                homework_data.get("type"),
                homework_data.get("file_name", ""),  # Use empty string if no file name
                homework_data.get("id"),
            ),
        )

    def get_homework_by_assigned_date(
        self, assigned_date, subject_id, grade_id, level_id
    ):
        query = """
            SELECT *
            FROM homework
            WHERE assignedDate = %s AND subject_id = %s AND grade_id = %s AND level_id = %s
        """
        return self.db.fetch_one(query, (assigned_date, subject_id, grade_id, level_id))

    def get_all_student_homework(self, student_id, grade_id):
        """Get the homework the student should do for all subject (for parents and students)"""
        query = """
                SELECT h.id, h.title, h.assignedDate, h.dueDate, s.subject_name, s.fg_color
                FROM homework h
                LEFT JOIN student_homework_submission shs
                    ON h.id = shs.homework_id AND shs.student_id = %s
                JOIN subjects s 
                    ON h.subject_id = s.subject_id
                JOIN student_classes sc
                    ON sc.student_id = %s 
                JOIN classes c
                    ON sc.class_id = c.class_id
                    AND c.subject_id = h.subject_id
                WHERE shs.homework_id IS NULL
                AND h.assignedDate < CURDATE()
                AND (sc.level_id = h.level_id or h.level_id = 3)
                AND %s = h.grade_id
                AND h.dueDate >= CURDATE()
            """
        return self.db.fetch_all(query, (student_id, student_id, grade_id))

    def get_student_homework_master(self, student_id, status=None, subject_ids=None):
        """
        Get homework for a student with optional status and subject filter.
        If status is None, it returns all homework.
        """
        query = """
            SELECT 
                h.id, h.title, h.assignedDate, h.dueDate,
                s.subject_name, s.fg_color, shs.id
            FROM homework h
            JOIN subjects s 
                ON h.subject_id = s.subject_id
            JOIN students st
                ON st.student_id = %s
            JOIN grades g
                ON st.grade = g.grade
            JOIN student_classes sc
                ON sc.student_id = st.student_id
            JOIN classes c
                ON sc.class_id = c.class_id AND c.subject_id = h.subject_id
            LEFT JOIN student_homework_submission shs 
                ON h.id = shs.homework_id AND shs.student_id = st.student_id
            WHERE 
                h.assignedDate <= CURDATE() AND
                (sc.level_id = h.level_id OR h.level_id = 3)
                AND (h.grade_id = g.grade_id)
                AND h.dueDate >= CURDATE()
                
        """
        params = [student_id]

        if status:
            if status == "submitted":
                query += " AND shs.id IS NOT NULL"
            elif status == "pending":
                query += " AND shs.id IS NULL"
            # query += " AND shs.id = %s"
            # params.append(status)

        if subject_ids:
            placeholders = ", ".join(["%s"] * len(subject_ids))
            query += f" AND h.subject_id IN ({placeholders})"
            params.extend(subject_ids)

        print("get_student_homework_master query:", query)

        return self.db.fetch_all(query, params)

    def delete_homework(self, homework_id):
        query = "DELETE FROM homework WHERE id = %s"

        return self.db.execute(query, (homework_id))
