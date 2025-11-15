"""
Private Tutoring Schedule DAO
Handles all database operations for private tutoring schedules
"""
from datetime import datetime, timedelta

class PTScheduleDAO:
    def __init__(self, db_helper):
        self.db = db_helper
        # Ensure schema has optional presentation fields
        try:
            self._ensure_title_and_color_columns()
        except Exception:
            # Avoid blocking app startup if migration check fails
            pass

    def _column_exists(self, table_name, column_name):
        """Check if a column exists in a table using information_schema."""
        query = """
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_NAME = %s AND COLUMN_NAME = %s
        LIMIT 1
        """
        # Attempt to infer current database name via a query if needed
        return bool(self.db.fetch_one(query, (table_name, column_name)))

    def _ensure_title_and_color_columns(self):
        """Idempotently add display_title and color columns to pt_schedules."""
        # display_title: VARCHAR(255) NULL, color: VARCHAR(20) NULL
        if not self._column_exists('pt_schedules', 'display_title'):
            self.db.execute("ALTER TABLE pt_schedules ADD COLUMN display_title VARCHAR(255) NULL AFTER notes")
        if not self._column_exists('pt_schedules', 'color'):
            self.db.execute("ALTER TABLE pt_schedules ADD COLUMN color VARCHAR(20) NULL AFTER display_title")

    def get_application_by_id(self, application_id):
        """Get application details by ID"""
        query = """
        SELECT sa.*, ps.subject_name 
        FROM pt_session_applications sa
        JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
        WHERE sa.application_id = %s
        """
        return self.db.fetch_one(query, (application_id,))

    def get_application_remaining_sessions(self, application_id):
        """Get remaining sessions for an application"""
        query = """
        SELECT 
            sa.initial_sessions as total_sessions,
            COALESCE(completed.total_hours, 0) AS completed_sessions
        FROM pt_session_applications sa
        LEFT JOIN (
            SELECT application_id, COALESCE(SUM(duration_hours), 0) AS total_hours
            FROM pt_sessions 
            WHERE status = 'completed'
            GROUP BY application_id
        ) completed ON sa.application_id = completed.application_id
        WHERE sa.application_id = %s
        """
        result = self.db.fetch_one(query, (application_id,))
        if result:
            return max(0, result['total_sessions'] - result['completed_sessions'])
        return 0

    def get_all_schedules(self, status=None):
        """Get all schedules"""
        query = """
        SELECT sc.*, st.name as student_name, st.grade_id, g.grade, ps.subject_name, pt.name as teacher_name
        FROM pt_schedules sc
        JOIN pt_students st ON sc.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects ps ON sc.subject_id = ps.subject_id
        JOIN pt_teachers pt ON sc.teacher_id = pt.teacher_id
        """
        params = []
        
        if status:
            query += " WHERE sc.status = %s"
            params.append(status)
            
        query += " ORDER BY sc.start_time"
        return self.db.fetch_all(query, params)

    def create_schedule(self, schedule_data, connection=None):
        """Create a new schedule"""
        query = """
        INSERT INTO pt_schedules (application_id, student_id, teacher_id, subject_id, start_time, end_time, scheduled_duration, status, notes, display_title, color)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        # Calculate end_time from start_time and duration
        start_time = schedule_data.get("start_time")
        duration = schedule_data.get("scheduled_duration", 1.0)
        
        # If start_time is a string, parse it
        if isinstance(start_time, str):
            from datetime import datetime
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        # Calculate end_time
        from datetime import timedelta
        end_time = start_time + timedelta(hours=float(duration))
        
        if connection:
            return self.db.execute_in_transaction(
                connection,
                query,
                (
                    schedule_data.get("application_id"),
                    schedule_data.get("student_id"),
                    schedule_data.get("teacher_id"),
                    schedule_data.get("subject_id"),
                    start_time,
                    end_time,
                    duration,
                    schedule_data.get("status", "scheduled"),
                    schedule_data.get("notes"),
                    schedule_data.get("display_title"),
                    schedule_data.get("color")
                ),
                return_id=True
            )
        else:
            return self.db.execute(
                query,
                (
                    schedule_data.get("application_id"),
                    schedule_data.get("student_id"),
                    schedule_data.get("teacher_id"),
                    schedule_data.get("subject_id"),
                    start_time,
                    end_time,
                    duration,
                    schedule_data.get("status", "scheduled"),
                    schedule_data.get("notes"),
                    schedule_data.get("display_title"),
                    schedule_data.get("color")
                ),
                return_id=True
            )

    def get_schedule_by_id(self, schedule_id):
        """Get a specific schedule"""
        query = """
        SELECT sc.*, st.name as student_name, st.grade_id, g.grade, ps.subject_name, pt.name as teacher_name
        FROM pt_schedules sc
        JOIN pt_students st ON sc.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects ps ON sc.subject_id = ps.subject_id
        JOIN pt_teachers pt ON sc.teacher_id = pt.teacher_id
        WHERE sc.schedule_id = %s
        """
        return self.db.fetch_one(query, (schedule_id,))

    def get_schedules_by_date_range(self, start_date, end_date, teacher_id=None):
        """Get schedules within a date range"""
        query = """
        SELECT sc.*, st.name as student_name, st.grade_id, g.grade, ps.subject_name, pt.name as teacher_name
        FROM pt_schedules sc
        JOIN pt_students st ON sc.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects ps ON sc.subject_id = ps.subject_id
        JOIN pt_teachers pt ON sc.teacher_id = pt.teacher_id
        WHERE sc.start_time >= %s AND sc.start_time <= %s
        """
        params = [start_date, end_date]
        
        if teacher_id:
            query += " AND sc.teacher_id = %s"
            params.append(teacher_id)
            
        query += " ORDER BY sc.start_time"
        return self.db.fetch_all(query, params)

    def get_upcoming_schedules(self, days_ahead=7, teacher_id=None):
        """Get upcoming schedules for the next X days"""
        end_date = datetime.now() + timedelta(days=days_ahead)
        return self.get_schedules_by_date_range(datetime.now(), end_date, teacher_id)

    def get_todays_schedules(self, teacher_id=None):
        """Get today's schedules"""
        today = datetime.now().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        return self.get_schedules_by_date_range(start_of_day, end_of_day, teacher_id)

    def update_schedule(self, schedule_id, schedule_data, connection=None):
        """Update a schedule"""
        query = """
        UPDATE pt_schedules 
        SET application_id = %s, student_id = %s, teacher_id = %s, subject_id = %s, start_time = %s, end_time = %s, scheduled_duration = %s, status = %s, notes = %s, display_title = %s, color = %s
        WHERE schedule_id = %s
        """
        # Calculate end_time from start_time and duration
        start_time = schedule_data.get("start_time")
        duration = schedule_data.get("scheduled_duration", 1.0)
        
        # If start_time is a string, parse it
        if isinstance(start_time, str):
            from datetime import datetime
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        # Calculate end_time
        from datetime import timedelta
        end_time = start_time + timedelta(hours=float(duration))
        
        if connection:
            return self.db.execute_in_transaction(
                connection,
                query,
                (
                    schedule_data.get("application_id"),
                    schedule_data.get("student_id"),
                    schedule_data.get("teacher_id"),
                    schedule_data.get("subject_id"),
                    start_time,
                    end_time,
                    duration,
                    schedule_data.get("status"),
                    schedule_data.get("notes"),
                    schedule_data.get("display_title"),
                    schedule_data.get("color"),
                    schedule_id
                )
            )
        else:
            return self.db.execute(
                query,
                (
                    schedule_data.get("application_id"),
                    schedule_data.get("student_id"),
                    schedule_data.get("teacher_id"),
                    schedule_data.get("subject_id"),
                    start_time,
                    end_time,
                    duration,
                    schedule_data.get("status"),
                    schedule_data.get("notes"),
                    schedule_data.get("display_title"),
                    schedule_data.get("color"),
                    schedule_id
                )
            )

    def delete_schedule(self, schedule_id):
        """Delete a schedule"""
        query = "DELETE FROM pt_schedules WHERE schedule_id = %s"
        return self.db.execute(query, (schedule_id,))

    def mark_schedule_completed(self, schedule_id):
        """Mark a schedule as completed (when session is created from it)"""
        query = """
        UPDATE pt_schedules 
        SET status = 'completed'
        WHERE schedule_id = %s
        """
        return self.db.execute(query, (schedule_id,))

    def cancel_schedule(self, schedule_id, reason=None):
        """Cancel a schedule"""
        query = """
        UPDATE pt_schedules 
        SET status = 'cancelled', notes = %s
        WHERE schedule_id = %s
        """
        notes = f"Schedule cancelled. Reason: {reason}" if reason else "Schedule cancelled"
        return self.db.execute(query, (notes, schedule_id))

    def get_student_schedules(self, student_id, status=None):
        """Get all schedules for a student"""
        query = """
        SELECT * FROM pt_schedules 
        WHERE student_id = %s
        """
        params = [student_id]
        
        if status:
            query += " AND status = %s"
            params.append(status)
            
        query += " ORDER BY start_time"
        return self.db.fetch_all(query, params)

    def get_schedules_by_subject(self, subject_id, status=None):
        """Get all schedules for a specific subject"""
        query = """
        SELECT sc.*, st.name as student_name, st.grade_id, g.grade, ps.subject_name, pt.name as teacher_name
        FROM pt_schedules sc
        JOIN pt_students st ON sc.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects ps ON sc.subject_id = ps.subject_id
        JOIN pt_teachers pt ON sc.teacher_id = pt.teacher_id
        WHERE sc.subject_id = %s
        """
        params = [subject_id]
        
        if status:
            query += " AND sc.status = %s"
            params.append(status)
            
        query += " ORDER BY sc.start_time"
        return self.db.fetch_all(query, params)

    def create_recurring_schedules(self, base_schedule_id, weeks=4):
        """Create recurring schedules based on a base schedule"""
        base_schedule = self.get_schedule_by_id(base_schedule_id)
        if not base_schedule or not base_schedule['recurring']:
            return []

        created_schedules = []
        pattern = base_schedule['recurring_pattern']
        
        if pattern == 'weekly':
            interval_days = 7
        elif pattern == 'biweekly':
            interval_days = 14
        elif pattern == 'monthly':
            interval_days = 30
        else:
            return []

        base_time = base_schedule['start_time']
        
        for i in range(1, weeks + 1):
            new_time = base_time + timedelta(days=interval_days * i)
            
            schedule_data = {
                'student_id': base_schedule['student_id'],
                'teacher_id': base_schedule['teacher_id'],
                'subject_id': base_schedule['subject_id'],
                'start_time': new_time,
                'scheduled_duration': base_schedule['scheduled_duration'],
                'status': 'scheduled',
                'notes': f"Auto-generated from recurring schedule {base_schedule_id}"
            }
            
            new_schedule_id = self.create_schedule(schedule_data)
            created_schedules.append(new_schedule_id)
            
        return created_schedules

    def get_overlapping_schedules(self, student_id, scheduled_time, duration_hours):
        """Check for overlapping schedules for a student"""
        end_time = scheduled_time + timedelta(hours=float(duration_hours))
        
        query = """
        SELECT * FROM pt_schedules 
        WHERE student_id = %s 
        AND status = 'scheduled'
        AND (
            (start_time <= %s AND end_time > %s)
            OR (start_time < %s AND end_time >= %s)
        )
        """
        return self.db.fetch_all(query, (student_id, scheduled_time, scheduled_time, end_time, end_time))

    def get_schedule_statistics(self, teacher_id=None):
        """Get schedule statistics"""
        query = """
        SELECT 
            status,
            COUNT(*) as count,
            SUM(scheduled_duration) as total_hours
        FROM pt_schedules
        """
        params = []
        
        if teacher_id:
            query += " WHERE teacher_id = %s"
            params.append(teacher_id)
            
        query += " GROUP BY status"
        return self.db.fetch_all(query, params)
