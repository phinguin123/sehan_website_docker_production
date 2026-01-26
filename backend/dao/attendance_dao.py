class AttendanceDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    # get attendance details for a specific date, grade, and mode
    def get_attendance(self, attendance_date, grade_id, mode_id):
        """
        Get attendance records using denormalized fields.
        Falls back to timetable join for records without denormalized fields.
        This query ensures we get the latest attendance record for each student-class combination.
        
        IMPORTANT: This query matches attendance records by:
        1. class_id (preferred - exact match)
        2. timetable_id (fallback for old records)
        3. subject_id + level_id + grade_id + mode_id (fallback for mismatched class_id)
        
        The third matching method handles cases where attendance was recorded for a different
        class_id than the student is enrolled in (e.g., if there are multiple Biology classes
        or the class structure changed). This prevents attendance from being "lost" due to
        class_id mismatches.
        
        The returned level_id uses the student's enrolled level_id, not the attendance
        record's level_id, to ensure proper matching in the attendance service.
        """
        query = """
        SELECT
            a.student_id,
            COALESCE(s.subject_name, a.subject_name) as subject_name,
            a.attendance_id,
            a.status,
            a.attendance_date,
            -- Use student's enrolled level_id, not the attendance record's level_id
            -- This ensures matching works correctly in the attendance service
            latest.student_level_id as level_id
        FROM (
            SELECT
                sc.student_id,
                c.class_id,
                c.subject_id,
                sc.level_id as student_level_id,
                c.level_id as class_level_id,
                (
                    SELECT a2.attendance_id
                    FROM attendance a2
                    WHERE a2.student_id = sc.student_id
                        AND a2.attendance_date = %s
                        AND (
                            -- Match via class_id (denormalized field) - preferred
                            (a2.class_id = c.class_id)
                            OR
                            -- Match via timetable_id (fallback for old records)
                            (a2.timetable_id IS NOT NULL 
                             AND EXISTS (
                                 SELECT 1 FROM timetable t 
                                 WHERE t.class_id = c.class_id 
                                 AND t.timetable_id = a2.timetable_id
                             ))
                            OR
                            -- Match via subject_id and level_id (for cases where class_id doesn't match)
                            -- This handles cases where attendance was recorded for a different class of the same subject
                            (
                                (a2.subject_id = c.subject_id OR a2.subject_name = (SELECT subject_name FROM subjects WHERE subject_id = c.subject_id))
                                AND (
                                    -- Match exact level
                                    (a2.level_id = sc.level_id)
                                    OR
                                    -- Match if attendance is SL/HL (level_id 3) and student is SL or HL
                                    (a2.level_id = 3 AND sc.level_id IN (1, 2))
                                    OR
                                    -- Match if student is in SL/HL class (level_id 3) and attendance is SL or HL
                                    (c.level_id = 3 AND a2.level_id = sc.level_id)
                                )
                                AND (
                                    -- Match grade and mode via denormalized fields
                                    (a2.grade_id = %s AND a2.mode_id = %s)
                                    OR
                                    -- Match grade and mode via class join
                                    (EXISTS (
                                        SELECT 1 FROM classes c2 
                                        WHERE c2.class_id = a2.class_id 
                                        AND c2.grade_id = %s 
                                        AND c2.mode_id = %s
                                    ))
                                )
                            )
                        )
                    ORDER BY a2.attendance_id DESC
                    LIMIT 1
                ) AS attendance_id
            FROM student_classes sc
            JOIN classes c ON sc.class_id = c.class_id
                AND ((c.level_id IN (1, 2) AND sc.level_id = c.level_id)
                    OR (c.level_id = 3 AND sc.level_id IN (1, 2)))
            WHERE c.grade_id = %s AND c.mode_id = %s
        ) latest
        INNER JOIN attendance a ON a.attendance_id = latest.attendance_id
        LEFT JOIN classes c ON a.class_id = c.class_id
        LEFT JOIN subjects s ON COALESCE(a.subject_id, latest.subject_id, c.subject_id) = s.subject_id;

        """
        return self.db.fetch_all(query, (attendance_date, grade_id, mode_id, grade_id, mode_id, grade_id, mode_id))
        return self.db.fetch_all(query, (attendance_date, grade_id, mode_id))

    def get_attendance_code(self):
        query = """
        SELECT code FROM attendance_code;
        """
        result = self.db.fetch_one(query)
        return result["code"]

    def get_timetable_context(self, timetable_id):
        """Get all class context from timetable_id for denormalization"""
        query = """
        SELECT 
            t.class_id,
            t.day_id,
            t.time_slot_id,
            t.teacher_id,
            c.subject_id,
            c.level_id,
            c.mode_id,
            c.grade_id,
            ts.start_time,
            ts.end_time
        FROM timetable t
        JOIN classes c ON t.class_id = c.class_id
        JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
        WHERE t.timetable_id = %s
        """
        return self.db.fetch_one(query, (timetable_id,))

    def submit_attendance(self, student_id, attendance_date, status, attendance_data):
        """
        Submit attendance with denormalized fields.
        If timetable_id is provided, we look up and populate all denormalized fields.
        """
        timetable_id = attendance_data.get("timetable_id")
        subject_name = attendance_data.get("subject_name")
        
        # Get class context from timetable_id if available
        class_context = None
        if timetable_id:
            class_context = self.get_timetable_context(timetable_id)
        
        # Build the INSERT query with all denormalized fields
        if class_context:
            query = """
            INSERT INTO attendance (
                student_id, attendance_date, status, subject_name, timetable_id,
                class_id, subject_id, level_id, mode_id, grade_id, 
                day_id, time_slot_id, start_time, end_time, teacher_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            return self.db.execute(
                query,
                (
                    student_id,
                    attendance_date,
                    status,
                    subject_name,
                    timetable_id,
                    class_context.get("class_id"),
                    class_context.get("subject_id"),
                    class_context.get("level_id"),
                    class_context.get("mode_id"),
                    class_context.get("grade_id"),
                    class_context.get("day_id"),
                    class_context.get("time_slot_id"),
                    class_context.get("start_time"),
                    class_context.get("end_time"),
                    class_context.get("teacher_id"),
                ),
            )
        else:
            # Fallback: insert without denormalized fields (for backward compatibility)
            # These records can be backfilled later
            query = """
            INSERT INTO attendance (student_id, attendance_date, status, subject_name, timetable_id)
            VALUES (%s, %s, %s, %s, %s)
            """
            return self.db.execute(
                query,
                (
                    student_id,
                    attendance_date,
                    status,
                    subject_name,
                    timetable_id,
                ),
            )

    def check_attendance_submission(self, student_id, attendance_data, current_date):
        """
        Check if attendance already exists. Uses denormalized fields first,
        falls back to timetable join if denormalized fields are not available.
        """
        start_time = attendance_data.get("start_time")
        
        # Try using denormalized fields first (preferred method)
        query = """
            SELECT 
                a.status
            FROM 
                attendance a
            WHERE 
                a.student_id = %s AND
                a.start_time = %s AND 
                a.attendance_date = %s
            ORDER BY
                a.attendance_id DESC
            LIMIT 1
        """
        result = self.db.fetch_one(query, (student_id, start_time, current_date))
        
        # Fallback to timetable join if no result and timetable_id is available
        if not result and attendance_data.get("timetable_id"):
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
                LIMIT 1
            """
            result = self.db.fetch_one(query, (student_id, start_time, current_date))
        
        return result
