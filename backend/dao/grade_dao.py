class GradeDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_grades(self):
        query = """
        Select grade_id, grade as grade_name from grades
        """

        return self.db.fetch_all(query)
