class ScoreDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    # TODO: change grade to grade_id
    def get_scores_for_week_and_subject(
        self, week_dates, grade, mode_id, level_id, subject_id
    ):
        placeholders = ",".join(["%s"] * len(week_dates))
        query = f"""
               SELECT distinct s.student_id, s.name, sub.subject_id, sub.subject_name, hw.assignedDate, shs.raw_marks, shs.id as submission_id -- raw marks is percentage
        FROM students s
        JOIN student_classes sc ON s.student_id = sc.student_id
        JOIN timetable t ON sc.class_id = t.class_id
        JOIN classes c ON sc.class_id = c.class_id
        JOIN subjects sub ON c.subject_id = sub.subject_id
        JOIN grades g ON g.grade = s.grade
        LEFT JOIN homework hw 
            ON hw.subject_id = sub.subject_id AND hw.grade_id = g.grade_id AND (hw.level_id = c.level_id OR hw.level_id = 3) AND hw.assignedDate IN ({placeholders})
        LEFT JOIN student_homework_submission shs 
            ON s.student_id = shs.student_id AND hw.id = shs.homework_id
        WHERE 
            s.grade = %s AND 
            c.mode_id = %s AND -- Online Offline or both
            (c.level_id = %s OR c.level_id = 3) AND -- SL HL or both
            sub.subject_id = %s
        ORDER BY s.name
        """

        params = week_dates + [grade, mode_id, level_id, subject_id]

        return self.db.fetch_all(query, params)
