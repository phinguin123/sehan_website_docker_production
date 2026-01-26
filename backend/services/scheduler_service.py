"""Scheduler service for managing attendance checks and automated tasks"""
import schedule
import threading
import time
import os
import pytz
from datetime import datetime, timedelta, time as dt_time
from flask import current_app
from utils.db import DBHelper
from sehan_kakao_alimtalk import send_attendance_message, send_report_message

db_helper = DBHelper()

# Global scheduler state
should_reschedule = False
schedule_lock = threading.Lock()


class SchedulerService:
    """Service for managing scheduled tasks"""

    def __init__(self, app=None):
        self.app = app
        self.sehan_start_date = os.environ.get("SEHAN_START_DATE")
        self.sehan_end_date = os.environ.get("SEHAN_END_DATE")

    def get_current_time_kst(self):
        """Get current time in KST timezone"""
        kst = pytz.timezone("Asia/Seoul")
        return datetime.now(kst)

    def generate_attendance_code(self):
        """Generate random attendance code"""
        import random
        attendance_code = random.randint(1000, 9999)
        
        conn = db_helper.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE attendance_code SET code = %s WHERE id = 1", (attendance_code,))
                conn.commit()
        finally:
            conn.close()
        
        if self.app:
            self.app.logger.info(f"Generated new attendance code: {attendance_code}")
        
        return attendance_code

    def handle_alim_talk_message(self, student_name, student_id):
        """Send attendance alert via KakaoTalk"""
        conn = db_helper.get_connection()
        try:
            with conn.cursor() as cursor:
                sql = """
                    SELECT p.phone_number FROM parents as p
                    JOIN parents_students as ps ON p.parent_id = ps.parent_id
                    WHERE ps.student_id = %s
                """
                cursor.execute(sql, (student_id,))
                result = cursor.fetchall()

                if not result:
                    if self.app:
                        self.app.logger.info(f"No parent matched for student ID {student_id}")
                    return

                for row in result:
                    phone_number = row.get("phone_number")
                    if phone_number:
                        send_attendance_message(student_name, phone_number)
        finally:
            conn.close()

    def check_attendance_missing(self, start_time, grade, subject_name, level_id, mode_id):
        """Check for missing attendance 10 minutes after class starts"""
        from utils.date_validator import is_current_date_after_sehan_end
        
        if is_current_date_after_sehan_end():
            if self.app:
                self.app.logger.info(
                    f"Skipping check_attendance_missing for {subject_name} - after SEHAN_END_DATE"
                )
            return

        if self.app:
            self.app.logger.info(
                f"check_attendance_missing for {subject_name} at {start_time}, grade {grade}"
            )

        conn = db_helper.get_connection()
        try:
            with conn.cursor() as cursor:
                now_kst = self.get_current_time_kst()
                current_time = now_kst.time()

                # Allow 1-minute window (9-11 minutes after start)
                earliest = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=9)).time()
                latest = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=11)).time()
                
                if current_time < earliest or current_time > latest:
                    if self.app:
                        self.app.logger.warning(
                            f"check_attendance_missing outside window. Current: {current_time}"
                        )
                    return

                # Query students who haven't submitted attendance
                cursor.execute(
                    """
                    SELECT s.student_id, s.name 
                    FROM students s
                    LEFT JOIN (
                        SELECT *
                        FROM attendance
                        WHERE attendance_id = (
                            SELECT MAX(attendance_id)
                            FROM attendance a2
                            WHERE a2.student_id = attendance.student_id
                            AND a2.subject_name = %s
                            AND attendance_date = CURDATE()
                        )              
                    ) a ON s.student_id = a.student_id 
                        AND a.attendance_date = CURDATE() 
                        AND a.subject_name = %s
                    JOIN student_classes sc ON s.student_id = sc.student_id
                    JOIN classes c ON sc.class_id = c.class_id
                    JOIN subjects sub ON c.subject_id = sub.subject_id
                    WHERE s.grade = %s
                        AND sub.subject_name = %s
                        AND (a.status IS NULL OR a.status = 'reset')
                        AND (sc.level_id = %s OR %s = 3)
                        AND (c.mode_id = %s)
                    """,
                    (subject_name, subject_name, grade, subject_name, level_id, level_id, mode_id)
                )
                missing_students = cursor.fetchall()

                # Send alerts
                for student in missing_students:
                    if self.app:
                        self.app.logger.info(
                            f"Student {student['name']} (ID: {student['student_id']}) not in class for {subject_name}"
                        )
                    self.handle_alim_talk_message(student["name"], student["student_id"])
        finally:
            conn.close()

    def mark_students_absent(self, start_time, grade, subject_name, level_id, mode_id, timetable_id, day_name):
        """Mark students as absent 30 minutes after class starts"""
        from utils.date_validator import is_current_date_after_sehan_end
        
        if is_current_date_after_sehan_end():
            if self.app:
                self.app.logger.info(
                    f"Skipping mark_students_absent for {subject_name} - after SEHAN_END_DATE"
                )
            return

        conn = db_helper.get_connection()
        try:
            with conn.cursor() as cursor:
                # Determine attendance date (adjust for late night classes)
                late_night_start = dt_time(23, 30)
                late_night_end = dt_time(3, 0)
                
                now_kst = self.get_current_time_kst()
                absent_date = now_kst.date()
                
                if (start_time >= late_night_start) or (start_time < late_night_end):
                    # Shift to next day for late night classes
                    absent_date = (now_kst - timedelta(days=1)).date()

                # Query students who should be marked absent
                cursor.execute(
                    """
                    SELECT s.student_id, s.name 
                    FROM students s
                    LEFT JOIN (
                        SELECT *
                        FROM attendance
                        WHERE attendance_id = (
                            SELECT MAX(attendance_id)
                            FROM attendance a2
                            WHERE a2.student_id = attendance.student_id
                            AND a2.subject_name = %s
                            AND attendance_date = %s
                        )
                    ) a ON s.student_id = a.student_id
                    JOIN student_classes sc ON s.student_id = sc.student_id
                    JOIN classes c ON sc.class_id = c.class_id
                    JOIN subjects sub ON c.subject_id = sub.subject_id
                    WHERE s.grade = %s
                        AND sub.subject_name = %s
                        AND (a.status IS NULL OR a.status = 'reset')
                        AND (sc.level_id = %s OR %s = 3)
                        AND (c.mode_id = %s)
                    """,
                    (subject_name, absent_date, grade, subject_name, level_id, level_id, mode_id)
                )
                students_to_mark_absent = cursor.fetchall()

                # Mark each student as absent
                for student in students_to_mark_absent:
                    cursor.execute(
                        """
                        INSERT INTO attendance 
                        (student_id, attendance_date, status, subject_name, timetable_id)
                        VALUES (%s, %s, 'absent', %s, %s)
                        """,
                        (student["student_id"], absent_date, subject_name, timetable_id)
                    )
                    if self.app:
                        self.app.logger.info(
                            f"Marked {student['name']} (ID: {student['student_id']}) as absent for {subject_name}"
                        )
                
                conn.commit()
        finally:
            conn.close()

    def schedule_attendance_checks(self):
        """Schedule attendance checks for all classes"""
        if not self.sehan_start_date or not self.sehan_end_date:
            if self.app:
                self.app.logger.warning("SEHAN_START_DATE or SEHAN_END_DATE not set")
            return

        seoul_tz = pytz.timezone("Asia/Seoul")
        start_date = seoul_tz.localize(datetime.strptime(self.sehan_start_date, "%Y-%m-%d"))
        end_date = seoul_tz.localize(datetime.strptime(self.sehan_end_date, "%Y-%m-%d")) + timedelta(days=1)

        if self.app:
            self.app.logger.info(f"Scheduling attendance checks from {start_date} to {end_date}")

        now_kst = self.get_current_time_kst()
        if now_kst < start_date or now_kst > end_date:
            return

        conn = db_helper.get_connection()
        try:
            with conn.cursor() as cursor:
                # Fetch all timetable slots
                cursor.execute(
                    """
                    SELECT ts.start_time, c.level_id, c.mode_id, g.grade, s.subject_name, 
                           d.day_name, t.timetable_id
                    FROM time_slots ts
                    JOIN timetable t ON ts.time_slot_id = t.time_slot_id
                    JOIN classes c ON t.class_id = c.class_id
                    JOIN subjects s ON c.subject_id = s.subject_id
                    JOIN days d ON t.day_id = d.day_id
                    JOIN grades g ON c.grade_id = g.grade_id
                    """
                )
                time_slots = cursor.fetchall()

                current_day_name = now_kst.strftime("%A")

                for slot in time_slots:
                    start_time = datetime.strptime(str(slot["start_time"]), "%H:%M:%S").time()
                    grade = slot["grade"]
                    subject_name = slot["subject_name"]
                    day_name = slot["day_name"]
                    level_id = slot["level_id"]
                    mode_id = slot["mode_id"]
                    timetable_id = slot["timetable_id"]

                    # Map days to scheduler methods
                    day_scheduler = {
                        "Monday": lambda: schedule.every().monday,
                        "Tuesday": lambda: schedule.every().tuesday,
                        "Wednesday": lambda: schedule.every().wednesday,
                        "Thursday": lambda: schedule.every().thursday,
                        "Friday": lambda: schedule.every().friday,
                        "Saturday": lambda: schedule.every().saturday,
                    }

                    if day_name not in day_scheduler:
                        continue

                    # Schedule attendance code generation (5 min before)
                    code_dt = datetime.combine(datetime.today(), start_time) - timedelta(minutes=5)
                    day_scheduler[day_name]().at(code_dt.strftime("%H:%M")).do(
                        self.generate_attendance_code
                    )

                    # Schedule attendance check (10 min after)
                    check_dt = datetime.combine(datetime.today(), start_time) + timedelta(minutes=10)
                    day_scheduler[day_name]().at(check_dt.strftime("%H:%M")).do(
                        self.check_attendance_missing,
                        start_time, grade, subject_name, level_id, mode_id
                    )

                    # Schedule absent marking (30 min after)
                    absent_dt = datetime.combine(datetime.today(), start_time) + timedelta(minutes=30)
                    day_scheduler[day_name]().at(absent_dt.strftime("%H:%M")).do(
                        self.mark_students_absent,
                        start_time, grade, subject_name, level_id, mode_id, timetable_id, day_name
                    )

                    # Catch-up logic for today's classes
                    if day_name == current_day_name:
                        self._run_catchup_tasks(
                            now_kst, start_time, code_dt, check_dt, absent_dt,
                            subject_name, grade, level_id, mode_id, timetable_id, day_name
                        )
        finally:
            conn.close()

    def _run_catchup_tasks(self, now_kst, start_time, code_dt, check_dt, absent_dt,
                          subject_name, grade, level_id, mode_id, timetable_id, day_name):
        """Run missed tasks for classes that already started today"""
        now_time = now_kst.time()

        # Catch-up: attendance code
        if code_dt.time() <= now_time < start_time:
            if self.app:
                self.app.logger.info(f"Catch-up: generating code for {subject_name}")
            self.generate_attendance_code()

        # Catch-up: attendance check
        check_window_start = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=10)).time()
        check_window_end = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=11)).time()
        if check_window_start <= now_time <= check_window_end:
            if self.app:
                self.app.logger.info(f"Catch-up: checking attendance for {subject_name}")
            self.check_attendance_missing(start_time, grade, subject_name, level_id, mode_id)

        # Catch-up: mark absent
        absent_window_start = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=30)).time()
        absent_window_end = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=35)).time()
        if absent_window_start <= now_time <= absent_window_end:
            if self.app:
                self.app.logger.info(f"Catch-up: marking absent for {subject_name}")
            self.mark_students_absent(
                start_time, grade, subject_name, level_id, mode_id, timetable_id, day_name
            )

    def start_schedule(self):
        """Main scheduler loop"""
        global should_reschedule
        
        if self.app:
            self.app.logger.info("Starting scheduler")
        
        try:
            self.schedule_attendance_checks()
            if self.app:
                self.app.logger.info(f"Scheduler initialized. Jobs: {len(schedule.jobs)}")
        except Exception as e:
            if self.app:
                self.app.logger.error(f"Error initializing scheduler: {e}", exc_info=True)

        while True:
            try:
                if should_reschedule:
                    should_reschedule = False
                    self.clear_and_reschedule()

                schedule.run_pending()
                time.sleep(1)
            except Exception as e:
                if self.app:
                    self.app.logger.error(f"Error in scheduler loop: {e}", exc_info=True)
                time.sleep(5)

    def clear_and_reschedule(self):
        """Clear and reschedule all tasks"""
        global schedule_lock
        
        with schedule_lock:
            schedule.clear()
            self.schedule_attendance_checks()
        
        if self.app:
            self.app.logger.info("Schedules cleared and rescheduled")

    def initialize(self):
        """Initialize scheduler in a background thread"""
        mode = os.getenv("APP_MODE", "development")
        if mode == "production":
            self.generate_attendance_code()
            schedule_thread = threading.Thread(target=self.start_schedule, daemon=True)
            schedule_thread.start()
            if self.app:
                self.app.logger.info("Scheduler thread started")
