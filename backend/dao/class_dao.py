class ClassDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def find_class_id(self, grade_id, subject_id, level_id, mode_id):
        query = """
        Select class_id from classes
        WHERE 
            grade_id = %s AND 
            subject_id = %s AND
            (level_id = %s OR level_id = 3) AND
            mode_id = %s
        """

        return self.db.fetch_one(query, (grade_id, subject_id, level_id, mode_id))
