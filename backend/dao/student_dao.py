class StudentDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_number_of_matching_student_names(self, name):
        query = "SELECT COUNT(*) FROM students WHERE name = %s"
        # This will match 'Alice', 'Alice2', 'Alice3', etc.
        return self.db.fetch_one(query, (name,))

    def get_student_by_id(self, student_id):
        query = "SELECT * FROM students WHERE student_id = %s"
        return self.db.fetch_one(query, (student_id,))

    def get_student_by_email(self, email):
        query = "SELECT * FROM students WHERE email = %s"
        return self.db.fetch_one(query, (email,))

    def get_students_by_grade_id(self, grade_id):
        query = "SELECT s.student_id, s.name FROM students s JOIN grades g ON s.grade = g.grade WHERE g.grade_id = %s"
        return self.db.fetch_all(query, (grade_id,))

    def get_subject_ids_for_student(self, student_id):
        """Get all subject IDs for a student in list format"""
        query = """
            SELECT DISTINCT c.subject_id
            FROM student_classes sc
            JOIN classes c ON sc.class_id = c.class_id
            WHERE sc.student_id = %s;
        """
        rows = self.db.fetch_all(query, (student_id,))
        subject_ids = [row["subject_id"] for row in rows]

        return subject_ids

    def get_all_students(self, fields=None):
        query = """
            SELECT 
                s.student_id,
                s.name,
                s.grade,
                s.school,
                s.email,
                sub.subject_id,
                sub.subject_name,
                l.id AS level_id,
                l.level_name,
                m.id AS mode_id,
                m.mode_name
            FROM 
                students s
            JOIN 
                student_classes sc ON s.student_id = sc.student_id
            JOIN
                classes c ON sc.class_id = c.class_id
            JOIN 
                subjects sub ON c.subject_id = sub.subject_id
            JOIN
                levels l ON sc.level_id = l.id
            JOIN
                modes m ON c.mode_id = m.id
            ORDER BY 
                s.name, sub.subject_name;
        """
        rows = self.db.fetch_all(query)

        students_map = {}
        students_list = []

        for row in rows:
            student_id = row["student_id"]

            if student_id not in students_map:
                student_data = {
                    "student_id": row["student_id"],
                    "name": row["name"],
                    "school": row["school"],
                    "grade": row["grade"],
                    "email": row.get("email"),  # if included
                    "subjects": [],
                }
                students_map[student_id] = student_data
                students_list.append(student_data)

            students_map[student_id]["subjects"].append(
                {
                    "subject_id": row["subject_id"],
                    "subject_name": row["subject_name"],
                    "level_id": row["level_id"],
                    "level_name": row["level_name"],
                    "mode_id": row["mode_id"],
                    "mode_name": row["mode_name"],
                }
            )

        return students_list
    

    def get_students_with_comments(self):
        query = """
            SELECT 
                s.student_id,
                s.name,
                s.grade,
                s.school,
                s.email,
                sub.subject_id,
                sub.subject_name,
                l.id AS level_id,
                l.level_name,
                m.id AS mode_id,
                m.mode_name,
                scomment.comment_text
            FROM 
                students s
            JOIN 
                student_classes sc ON s.student_id = sc.student_id
            JOIN
                classes c ON sc.class_id = c.class_id
            JOIN 
                subjects sub ON c.subject_id = sub.subject_id
            JOIN
                levels l ON sc.level_id = l.id
            JOIN
                modes m ON c.mode_id = m.id
            LEFT JOIN student_comments scomment 
                ON s.student_id = scomment.student_id 
                AND sub.subject_name = scomment.subject_name
            ORDER BY 
                s.name, sub.subject_name;
        """
        rows = self.db.fetch_all(query)

        students_map = {}
        students_list = []

        for row in rows:
            student_id = row["student_id"]

            if student_id not in students_map:
                student_data = {
                    "student_id": row["student_id"],
                    "name": row["name"],
                    "school": row["school"],
                    "grade": row["grade"],
                    "email": row.get("email"),  # if included
                    "subjects": [],
                }
                students_map[student_id] = student_data
                students_list.append(student_data)

            students_map[student_id]["subjects"].append(
                {
                    "subject_id": row["subject_id"],
                    "subject_name": row["subject_name"],
                    "level_id": row["level_id"],
                    "level_name": row["level_name"],
                    "mode_id": row["mode_id"],
                    "mode_name": row["mode_name"],
                    "comment_text": row.get("comment_text", ""),  # if included
                }
            )

        return students_list

    def create_student(self, name, school, grade, email, connection=None):
        query = (
            "INSERT INTO students (name, school, grade, email) VALUES (%s, %s, %s, %s)"
        )
        if connection:
            # Use execute_in_transaction when connection is provided (transaction mode)
            return self.db.execute_in_transaction(
                connection,
                query,
                (name, school, grade, email),
                return_id=True,
            )
        else:
            # Use execute when no connection provided (auto-commit mode)
            return self.db.execute(
                query,
                (name, school, grade, email),
                return_id=True,
            )

    def edit_student(self, student_id, name, school, grade, email, connection=None):
        query = "UPDATE students SET name=%s, school=%s, grade=%s, email=%s WHERE student_id = %s"
        return self.db.execute(
            query,
            (
                name,
                school,
                grade,
                email,
                student_id,
            ),
            connection=connection,
        )

    def add_student_classes_info(self, student_id, class_id, level_id, connection=None):
        query = "INSERT INTO student_classes (student_id, class_id, level_id) VALUES (%s, %s, %s)"
        return self.db.execute(
            query,
            (
                student_id,
                class_id,
                level_id,
            ),
            connection=connection,
        )

    def delete_student_classes_info(self, student_id, connection=None):
        query = "DELETE FROM student_classes WHERE student_id = %s"
        return self.db.execute(
            query,
            (student_id,),
            connection=connection,
        )

    def get_attendance_rate(self, student_id):
        pass

    def get_students_with_subjects(self, grade_id, mode_id):
        """Get all students with their subjects for a grade/mode in one query"""
        query = """
            SELECT DISTINCT
                s.student_id,
                s.name AS student_name,
                sub.subject_id,
                sub.subject_name,
                l.id as level_id,
                l.level_name
            FROM 
                students s
            JOIN 
                student_classes sc ON s.student_id = sc.student_id
            JOIN 
                classes c ON sc.class_id = c.class_id
            JOIN 
                subjects sub ON c.subject_id = sub.subject_id
            JOIN 
                levels l ON sc.level_id = l.id
            WHERE 
                c.grade_id = %s
                AND c.mode_id = %s
            ORDER BY 
                s.name, sub.subject_name;
        """
        return self.db.fetch_all(query, (grade_id, mode_id))

    def get_student_current_class(self, student_id, current_time, current_day_id):
        """Get current class. Attendance time is between (start time - 5) and endtime"""
        print(student_id, current_time, current_day_id)
        # First, try the student's assigned class_id
        query = """
            SELECT 
                t.timetable_id, -- timetable id is required to be sent by student for submitted attendance
                sub.subject_name, 
                l.level_name, 
                m.mode_name,
                ts.start_time,
                ts.end_time
            FROM student_classes sc
            JOIN timetable t ON sc.class_id = t.class_id
            JOIN classes c ON sc.class_id = c.class_id
            JOIN subjects sub ON c.subject_id = sub.subject_id
            JOIN levels l ON c.level_id = l.id
            JOIN modes m ON c.mode_id = m.id
            JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
            WHERE sc.student_id = %s
            AND t.day_id = %s
            AND (
                -- Case 1: end_time is after start_time (normal case)
                (ts.end_time > ts.start_time AND %s BETWEEN DATE_SUB(ts.start_time, INTERVAL 5 MINUTE) AND ts.end_time)
                -- Case 2: end_time is before start_time (overnight case)
                OR
                (ts.end_time < ts.start_time AND (
                    %s >= DATE_SUB(ts.start_time, INTERVAL 5 MINUTE)
                    OR
                    %s <= ts.end_time
                ))
            );
        """
        result = self.db.fetch_one(
            query,
            (student_id, current_day_id, current_time, current_time, current_time),
        )

        if result:
            return result

        # Fallback: if the student's class is SL or HL but the scheduled class is a combined SL/HL section,
        # allow them to see the SL/HL timetable for the same subject/grade/mode.
        fallback_query = """
            SELECT 
                t.timetable_id,
                sub.subject_name,
                l.level_name,
                m.mode_name,
                ts.start_time,
                ts.end_time
            FROM student_classes sc
            JOIN classes c ON sc.class_id = c.class_id
            JOIN classes c_slhl 
                ON c_slhl.subject_id = c.subject_id
                AND c_slhl.grade_id = c.grade_id
                AND c_slhl.mode_id = c.mode_id
                AND c_slhl.level_id = (SELECT id FROM levels WHERE level_name = 'SL/HL' LIMIT 1)
            JOIN timetable t ON c_slhl.class_id = t.class_id
            JOIN subjects sub ON c_slhl.subject_id = sub.subject_id
            JOIN levels l ON c_slhl.level_id = l.id
            JOIN modes m ON c_slhl.mode_id = m.id
            JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
            WHERE sc.student_id = %s
            AND t.day_id = %s
            AND (
                (ts.end_time > ts.start_time AND %s BETWEEN DATE_SUB(ts.start_time, INTERVAL 5 MINUTE) AND ts.end_time)
                OR
                (ts.end_time < ts.start_time AND (
                    %s >= DATE_SUB(ts.start_time, INTERVAL 5 MINUTE)
                    OR
                    %s <= ts.end_time
                ))
            );
        """

        return self.db.fetch_one(
            fallback_query,
            (student_id, current_day_id, current_time, current_time, current_time),
        )

    def get_student_timetable(self, student_id, day_id):
        """Get timetable for a student"""
        query = """
            SELECT 
                sub.subject_name,
                sub.fg_color,
                l.level_name,
                m.mode_name,
                ts.start_time,
                ts.end_time,
                te.name AS teacher_name
            FROM student_classes sc
            JOIN timetable t ON sc.class_id = t.class_id
            JOIN teachers te ON t.teacher_id = te.id
            JOIN classes c ON sc.class_id = c.class_id
            JOIN subjects sub ON c.subject_id = sub.subject_id
            JOIN levels l ON c.level_id = l.id
            JOIN modes m ON c.mode_id = m.id
            JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
            WHERE sc.student_id = %s AND
                    t.day_id = %s
            ORDER BY t.day_id, ts.start_time
        """
        return self.db.fetch_all(query, (student_id, day_id))

    def get_student_subject_averages(self, student_id):
        """Get average scores for each subject the student takes"""
        query = """
            SELECT 
                sub.subject_name,
                sub.fg_color,
                sub.bg_color,
                sub.gradient,
                l.level_name,
                CAST(COALESCE(ROUND(AVG(shs.raw_marks)), 0) AS UNSIGNED) AS percent
            FROM student_classes sc
            JOIN classes c ON sc.class_id = c.class_id
            JOIN subjects sub ON c.subject_id = sub.subject_id
            JOIN levels l ON sc.level_id = l.id
            LEFT JOIN student_homework_submission shs 
                ON sc.student_id = shs.student_id
                AND shs.homework_id IN (
                    SELECT id 
                    FROM homework 
                    WHERE subject_id = sub.subject_id
                )
            WHERE sc.student_id = %s
            GROUP BY sub.subject_name
        """
        return self.db.fetch_all(query, (student_id,))
