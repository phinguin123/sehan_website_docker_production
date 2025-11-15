class CommentDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def delete_all_comments(self):

        query = """
            DELETE FROM student_comments
        """

        return self.db.execute(query)