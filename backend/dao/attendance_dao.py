class AttendanceDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    # get attendance details for a specific date, grade, and mode
    def get_attendance(self, attendance_date, grade_id, mode_id):
        query = """
        SELECT
            a.student_id,
            s.subject_name,
            a.attendance_id,
            a.status,
            a.attendance_date,
            c.level_id
        FROM (
        SELECT
            sc.student_id,
            c.class_id,
            MAX(a.attendance_id) AS latest_attendance_id
        FROM student_classes sc
        JOIN classes c ON sc.class_id = c.class_id
            AND ((c.level_id IN (1, 2) AND sc.level_id = c.level_id)
                OR (c.level_id = 3 AND sc.level_id IN (1, 2)))
        JOIN subjects s ON c.subject_id = s.subject_id
        LEFT JOIN timetable t ON c.class_id = t.class_id
        LEFT JOIN attendance a ON a.student_id = sc.student_id
            AND a.timetable_id = t.timetable_id
            AND a.attendance_date = %s
        WHERE c.grade_id = %s AND c.mode_id = %s
        GROUP BY sc.student_id, c.class_id
        ) latest
        JOIN attendance a ON a.attendance_id = latest.latest_attendance_id
        JOIN classes c ON latest.class_id = c.class_id
        JOIN subjects s ON c.subject_id = s.subject_id;

        """
        return self.db.fetch_all(query, (attendance_date, grade_id, mode_id))

    def get_attendance_code(self):
        query = """
        SELECT code FROM attendance_code;
        """
        result = self.db.fetch_one(query)
        return result["code"]

    def submit_attendance(self, student_id, attendance_date, status, attendance_data):
        query = """
        INSERT INTO attendance (student_id, attendance_date, status, subject_name, timetable_id)
        VALUES (%s, %s, %s, %s, %s);
        """
        return self.db.execute(
            query,
            (
                student_id,
                attendance_date,
                status,
                attendance_data.get("subject_name"),
                attendance_data.get("timetable_id"),
            ),
        )

    def check_attendance_submission(self, student_id, attendance_data, current_date):
        query = """
            SELECT 
                a.status
            FROM 
                attendance a
            JOIN 
                timetable t ON a.timetable_id = t.timetable_id
            JOIN
                time_slots ts ON t.time_slot_id = ts.time_slot_id
            WHERE 
                a.student_id = %s AND
                ts.start_time = %s AND 
                a.attendance_date = %s
            ORDER BY
                a.attendance_id DESC
        """
        return self.db.fetch_one(
            query, (student_id, attendance_data.get("start_time"), current_date)
        )
