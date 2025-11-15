class Student:
    def __init__(self, student_id=None, school=None, grade_id=None, grade=None, name=None, email=None, subjects=None):
        self.student_id = student_id
        self.name = name
        self.email = email
        self.school = school
        self.grade_id = grade_id
        self.grade = grade
        self.subjects = subjects or []

    def to_dict(self, fields=None):
        data = {
            "student_id": self.student_id,
            "name": self.name,
            "school": self.school,
            "grade_id": self.grade_id,
            "grade": self.grade,
            "email": self.email,
            "subjects": [
                {
                    "subject_id": s["subject_id"],
                    "subject_name": s["subject_name"],
                    "level_id": s["level_id"],
                    "level_name": s["level_name"],
                    "mode_id": s["mode_id"],
                    "mode_name": s["mode_name"],
                }
                for s in self.subjects
            ]
        }

        if fields is None:
            return data
        else:
            return {key: data[key] for key in fields if key in data}