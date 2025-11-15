from flask import request
from flask_restx import Namespace, Resource, abort
from utils.db import DBHelper
from utils.utils import timedelta_to_string

timetable_ns = Namespace("Timetable", description="Timetable operations")

from flask_restx import fields

# Model for a time slot
time_slot_model = timetable_ns.model(
    "TimeSlot",
    {
        "time_slot_id": fields.String,
        "start_time": fields.String,  # ISO8601
        "end_time": fields.String,
    },
)
timetable_entry_model = timetable_ns.model(
    "TimetableEntry",
    {
        "timetable_id": fields.Integer,
        "subject_name": fields.String,
        "level_id": fields.String,
        "level_name": fields.String,
        "teacher_id": fields.Integer,
        "modeID": fields.Integer,
    },
)

time_slot_entries_model = timetable_ns.model(
    "TimeSlotEntries",
    {
        "time_slot_id": fields.String,
        "entries": fields.List(fields.Nested(timetable_entry_model)),
    },
)

day_timetable_model = timetable_ns.model(
    "DayTimetable",
    {
        "day": fields.String,
        "timeSlots": fields.List(fields.Nested(time_slot_entries_model)),
    },
)

# Full response model
timetable_response_model = timetable_ns.model(
    "TimetableResponse",
    {
        "grade": fields.String,
        "mode": fields.String,
        "timeSlots": fields.List(fields.Nested(time_slot_model)),
        "timetables": fields.List(fields.Nested(day_timetable_model)),
    },
)


db_helper = DBHelper()


@timetable_ns.route("/")
class Timetable(Resource):

    @timetable_ns.marshal_with(timetable_response_model)
    def get(self):
        """Get all timetable information"""
        grade_id = request.args.get("grade_id")  # e.g., '1', '2', '3'
        mode_id = request.args.get("mode_id")  # e.g., 'Online', 'Offline'

        if not grade_id or not mode_id:
            abort(400, "Grade and mode are required parameters.")

        # Fetch time slots for this grade/modeID
        query = """
        SELECT DISTINCT ts.time_slot_id, ts.start_time, ts.end_time
        FROM timetable t
        JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
        JOIN classes c ON t.class_id = c.class_id
        WHERE c.grade_id = %s AND c.mode_id = %s
        ORDER BY ts.start_time;
        """
        time_slots = db_helper.fetch_all(query, (grade_id, mode_id))

        for ts in time_slots:
            ts["start_time"] = timedelta_to_string(ts["start_time"])
            ts["end_time"] = timedelta_to_string(ts["end_time"])

        # Fetch timetable entries
        query = """
            SELECT t.timetable_id, d.day_name, t.time_slot_id, s.subject_name, c.level_id, t.teacher_id, c.mode_id
            FROM timetable t
            JOIN classes c ON t.class_id = c.class_id
            JOIN subjects s ON c.subject_id = s.subject_id
            JOIN days d ON t.day_id = d.day_id
            WHERE c.grade_id = %s AND c.mode_id = %s
            ORDER BY d.day_id, t.time_slot_id
        """
        timetable_entries = db_helper.fetch_all(query, (grade_id, mode_id))

        # Organize timetable entries into the list-based structure
        timetable_by_day = {}
        for row in timetable_entries:
            day = row["day_name"]
            time_slot_id = str(row["time_slot_id"])
            entry = {
                "timetable_id": row["timetable_id"],
                "subject_name": row["subject_name"],
                "level_id": row["level_id"],
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

    def post(self):
        conn = db_helper.get_connection()
        data = request.get_json()

        print("Received data:", data)

        try:
            with conn.cursor() as cursor:
                # 1. Find all time slots for the specified grade and mode
                query = """
                    SELECT DISTINCT 
                        t.time_slot_id,
                        t.timetable_id
                    FROM timetable t
                    JOIN classes c ON t.class_id = c.class_id 
                    WHERE 
                        c.grade_id = %s AND 
                        c.mode_id = %s;                    
                """
                cursor.execute(query, (data["grade"], data["modeID"]))
                existing_rows = cursor.fetchall()
                existing_time_slot_ids = [row["time_slot_id"] for row in existing_rows]
                existing_timetable_ids = [row["timetable_id"] for row in existing_rows]

                print("Deleting...", existing_time_slot_ids, existing_timetable_ids)

                # Delete timetable entries for the specified grade and mode
                if existing_timetable_ids:  # Only run if the list is not empty
                    placeholders = ",".join(["%s"] * len(existing_timetable_ids))
                    sql = (
                        f"DELETE FROM timetable WHERE timetable_id IN ({placeholders})"
                    )
                    cursor.execute(sql, existing_timetable_ids)

                # Delete time slots for the specified grade and mode
                if existing_time_slot_ids:  # Only run if the list is not empty
                    placeholders = ",".join(["%s"] * len(existing_time_slot_ids))
                    sql = (
                        f"DELETE FROM time_slots WHERE time_slot_id IN ({placeholders})"
                    )
                    cursor.execute(sql, existing_time_slot_ids)

                # 2. Insert time slots
                time_slot_map = {}  # Map from input time_slot_id to DB time_slot_id
                for slot in data["timeSlots"]:
                    sql = "INSERT INTO time_slots (time_slot_id, start_time, end_time) VALUES (%s, %s, %s)"
                    cursor.execute(
                        sql,
                        (slot["time_slot_id"], slot["start_time"], slot["end_time"]),
                    )
                    time_slot_map[slot["time_slot_id"]] = slot["time_slot_id"]

                # 3. Prepare subject name -> id mapping
                cursor.execute("SELECT subject_id, subject_name FROM subjects")
                subject_map = {
                    row["subject_name"]: row["subject_id"] for row in cursor.fetchall()
                }

                # 4. Prepare day name -> id mapping
                cursor.execute("SELECT day_id, day_name FROM days")
                day_map = {row["day_name"]: row["day_id"] for row in cursor.fetchall()}

                # 5. Insert timetable entries
                timetable_values = []
                for day_obj in data["timetables"]:
                    day_name = day_obj["day"]
                    day_id = day_map.get(day_name)
                    if day_id is None:
                        raise ValueError(f"Unknown day: {day_name}")
                    for slot_obj in day_obj["timeSlots"]:
                        slot_id = slot_obj["time_slot_id"]
                        for entry in slot_obj["entries"]:
                            subject_id = subject_map.get(entry["subject_name"])
                            if subject_id is None:
                                raise ValueError(
                                    f"Unknown subject: {entry['subject_name']}"
                                )

                            # Now, we find if such class already exists
                            query = """
                                SELECT 
                                    class_id 
                                FROM classes 
                                WHERE 
                                    subject_id = %s AND 
                                    level_id = %s AND 
                                    grade_id = %s AND 
                                    mode_id = %s
                            """
                            class_exists = cursor.execute(
                                query,
                                (
                                    subject_id,
                                    entry["level_id"],
                                    data["grade"],
                                    entry["modeID"],
                                ),
                            )

                            class_id = (
                                cursor.fetchone()["class_id"] if class_exists else None
                            )

                            if not class_exists:
                                # Insert into class table if it doesn't exist
                                insert_class_sql = """
                                    INSERT INTO classes (subject_id, level_id, grade_id, mode_id)
                                    VALUES (%s, %s, %s, %s)
                                """
                                cursor.execute(
                                    insert_class_sql,
                                    (
                                        subject_id,
                                        entry["level_id"],
                                        data["grade"],
                                        entry["modeID"],
                                    ),
                                )
                                class_id = cursor.lastrowid

                            timetable_values.append(
                                (
                                    day_id,  # day_id
                                    slot_id,  # time_slot_id
                                    class_id,  # class_id
                                    entry["teacher_id"],  # teacher_id
                                )
                            )

                print(timetable_values)

                # Bulk insert timetable entries
                if timetable_values:
                    sql = """
                        INSERT INTO timetable
                        (day_id, time_slot_id, class_id, teacher_id)
                        VALUES (%s, %s, %s, %s)
                    """
                    cursor.executemany(sql, timetable_values)

            conn.commit()
        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()
