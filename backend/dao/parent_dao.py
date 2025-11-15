class ParentDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_parent_by_email(self, email):
        query = """
        Select * from parents where email = %s
        """
        return self.db.fetch_one(query, (email,))

    def create_parent(self, parent_data):
        query = """
        INSERT INTO parents (parent_name, email, password, phone_number)
        VALUES (%s, %s, %s, %s)
        """
        return self.db.execute(
            query,
            (
                parent_data.get("parent_name"),
                parent_data.get("email"),
                parent_data.get("password"),
                parent_data.get("phone"),
            ),
        )

    def edit_parent(self, parent_data):
        query = """
        UPDATE parents
        SET parent_name = %s, email = %s, phone_number = %s, password = %s
        WHERE parent_id = %s
        """
        return self.db.execute(
            query,
            (
                parent_data.get("parent_name"),
                parent_data.get("email"),
                parent_data.get("phone"),
                parent_data.get("password"),
                parent_data.get("parent_id"),
            ),
        )

    def get_parents(self):
        query = """
        Select id as parent_id, parent_name from parents
        """

        return self.db.fetch_all(query)

    def check_parent_student_match(self, parent_id):
        query = """
            SELECT COUNT(*) FROM parents_students WHERE parent_id = %s
        """
        return self.db.fetch_one(query, (parent_id))

    def delete_parent(self, parent_id):
        query = """
        DELETE FROM parents WHERE parent_id = %s
        """
        return self.db.execute(query, (parent_id,))
