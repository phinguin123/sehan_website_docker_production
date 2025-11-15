class LevelDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_levels(self):
        query = """
        Select id as level_id, level_name from levels
        """

        return self.db.fetch_all(query)
