from datetime import datetime


class AttendanceService:
    def __init__(self, student_dao, attendance_dao=None, timetable_dao=None):
        self.student_dao = student_dao
        self.attendance_dao = attendance_dao
        self.timetable_dao = timetable_dao

    # get all attendance records for a specific date, grade, and mode
    def get_daily_attendance(self, attendance_date, grade_id, mode_id):
        # 1. Get day of week from date
        day_of_week = datetime.strptime(attendance_date, "%Y-%m-%d").strftime("%A")

        # # 2. Get time slots
        # time_slots = self.timetable_dao.get_time_slots(grade_id, mode_id)

        # 3. Get timetable for this day
        timetable_entries = self.timetable_dao.get_timetable(
            grade_id, mode_id, filters={"day": day_of_week}
        )

        # 4. Get all students in this grade
        students_with_subjects = self.student_dao.get_students_with_subjects(
            grade_id, mode_id
        )

        # 5. Get attendance records
        attendance_records = self.attendance_dao.get_attendance(
            attendance_date, grade_id, mode_id
        )

        # print("attendance records", attendance_records)
        # # 6. Organize timetable by time slot
        # timetable_by_slot = {}
        # for entry in timetable_entries:
        #     time_slot_id = str(entry['time_slot_id'])
        #     if time_slot_id not in timetable_by_slot:
        #         timetable_by_slot[time_slot_id] = {}

        #     timetable_by_slot[time_slot_id][entry['timetable_id']] = {
        #         'subject_name': entry['subject_name'],
        #         'level': entry['level_id'],
        #         'teacher_id': entry['teacher_id'],
        #         'teacher_name': entry['teacher_name']
        #     }

        # 7. Create attendance lookup
        attendance_lookup = {}
        for record in attendance_records:
            sid = record["student_id"]
            key = (record["subject_name"], record["level_id"])
            if sid not in attendance_lookup:
                attendance_lookup[sid] = {}
            attendance_lookup[sid][key] = {
                "status": record["status"],
                "attendance_date": record["attendance_date"],
            }

        # 8. Get subject info for each student and build final response
        students = {}
        for row in students_with_subjects:
            student_id = row["student_id"]
            if student_id not in students:
                students[student_id] = {
                    "student_id": student_id,
                    "name": row["student_name"],
                    "subjects": [],
                }

            key = (row["subject_name"], row["level_id"])

            if key in attendance_lookup.get(student_id, {}):
                attendance_info = attendance_lookup.get(student_id, {}).get(
                    key, {"status": None, "attendance_date": None}
                )
            else:
                key = (row["subject_name"], 3)  # Default to level id 3
                # There is a change that the class is level id 3 SL/HL
                attendance_info = attendance_lookup.get(student_id, {}).get(
                    key, {"status": None, "attendance_date": None}
                )

            students[student_id]["subjects"].append(
                {
                    "subject_id": row["subject_id"],
                    "subject_name": row["subject_name"],
                    "level_id": row["level_id"],
                    "level_name": row["level_name"],
                    "status": attendance_info["status"],
                    "attendance_date": attendance_info["attendance_date"],
                }
            )

        timetable_entries["students"] = list(students.values())

        # 9. Build final response
        return timetable_entries
