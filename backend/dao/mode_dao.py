class ModeDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_modes(self):
        query = """
        Select id as mode_id, mode_name from modes
        """

        return self.db.fetch_all(query)
