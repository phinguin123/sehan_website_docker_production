from utils.utils import timedelta_to_string


class TimetableDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def find_timetable_id(self, grade_id, subject_id, level_id, mode_id):
        query = """
        Select timetable_id from timetable
        WHERE 
            grade_id = %s AND 
            subject_id = %s AND
            (level_id = %s OR level_id = 3) AND
            mode_id = %s
        """

        return self.db.fetch_one(query, (grade_id, subject_id, level_id, mode_id))

    def get_timetable(self, grade_id, mode_id, filters=None):
        """
        Get timetable data with optional filters

        filters: dict of filter conditions like {'day': 'Monday', 'teacher_id': 5}
        """
        if not grade_id or not mode_id:
            raise ValueError("Grade and mode are required parameters.")

        # Fetch time slots for this grade/modeID
        sql_time_slots = """
        SELECT DISTINCT 
            ts.time_slot_id, 
            ts.start_time, 
            ts.end_time
        FROM timetable t
        JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
        JOIN classes c ON t.class_id = c.class_id
        WHERE 
            c.grade_id = %s AND 
            c.mode_id = %s
        ORDER BY ts.start_time;
        """
        time_slots = self.db.fetch_all(sql_time_slots, (grade_id, mode_id))

        for ts in time_slots:
            ts["start_time"] = timedelta_to_string(ts["start_time"])
            ts["end_time"] = timedelta_to_string(ts["end_time"])

        # Fetch timetable entries
        sql_base = """
            SELECT t.timetable_id, d.day_name, t.time_slot_id, s.subject_name, c.level_id, l.level_name, tea.id AS teacher_id, c.mode_id
            FROM timetable t
            JOIN classes c ON t.class_id = c.class_id
            JOIN subjects s ON c.subject_id = s.subject_id
            JOIN days d ON t.day_id = d.day_id
            JOIN teachers tea on t.teacher_id = tea.id
            JOIN levels l on c.level_id = l.id
            WHERE c.grade_id = %s AND c.mode_id = %s
        """

        params = [grade_id, mode_id]
        where_clauses = []

        # Add dynamic filters
        if filters:
            if "day" in filters:
                where_clauses.append("d.day_name = %s")
                params.append(filters["day"])
            if "teacher_id" in filters:
                where_clauses.append("tea.id = %s")
                params.append(filters["teacher_id"])
            # Add more filter options as needed

        # Build final query
        if where_clauses:
            sql_base += " AND " + " AND ".join(where_clauses)

        sql_base += " ORDER BY d.day_id, t.time_slot_id"

        timetable_entries = self.db.fetch_all(sql_base, params)

        # Organize timetable entries into the list-based structure
        timetable_by_day = {}
        for row in timetable_entries:
            day = row["day_name"]
            time_slot_id = str(row["time_slot_id"])
            entry = {
                "timetable_id": row["timetable_id"],
                "subject_name": row["subject_name"],
                "level_id": row["level_id"],
                "level_name": row["level_name"],
                "teacher_id": row["teacher_id"],
                "modeID": row["mode_id"],
            }
            timetable_by_day.setdefault(day, {}).setdefault(time_slot_id, []).append(
                entry
            )

        # Convert to list-based structure for docs
        timetables = []
        for day, slots in timetable_by_day.items():
            day_obj = {"day": day, "timeSlots": []}
            for time_slot_id, entries in slots.items():
                day_obj["timeSlots"].append(
                    {"time_slot_id": time_slot_id, "entries": entries}
                )
            timetables.append(day_obj)

        return {
            "grade": grade_id,
            "modeID": mode_id,
            "timeSlots": time_slots,
            "timetables": timetables,
        }

    def get_time_slots(self):
        """
        Get All time slots
        """
        sql_base = "SELECT * from time_slots"
        return self.db.fetch_all(sql_base)
