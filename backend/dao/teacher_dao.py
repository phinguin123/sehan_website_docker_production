class TeacherDAO:

    def __init__(self, db_helper):
        self.db = db_helper

    def get_teacher_by_username(self, username):
        query = """
        Select id as teacher_id from teachers where username = %s
        """
        return self.db.fetch_one(query, (username,))

    def get_teachers(self):
        query = """
            Select 
                t.id as teacher_id, 
                t.teacher_type, 
                t.name as teacher_name, 
                t.zoom_user_id, 
                t.username,
                sub.subject_id,
                sub.subject_name
            FROM 
                teachers t
            JOIN
                teachers_subjects ts ON t.id = ts.teacher_id
            JOIN 
                subjects sub ON ts.subject_id = sub.subject_id
            ORDER BY 
                t.name, sub.subject_name;
        """

        return self.db.fetch_all(query)

    def create_teacher(self, teacher_data, connection=None):
        query = """
        INSERT INTO teachers (name, zoom_user_id, username, password, teacher_type)
        VALUES (%s, %s, %s, %s, %s)
        """
        return self.db.execute(
            query,
            (
                teacher_data.get("teacher_name"),
                teacher_data.get("zoom_user_id"),
                teacher_data.get("username"),
                teacher_data.get("password"),
                teacher_data.get("teacher_type"),
            ),
            connection=connection,
        )

    def edit_teacher(self, teacher_data, connection=None):
        query = """
        UPDATE teachers
        SET name = %s, zoom_user_id = %s, username = %s, password = %s
        WHERE id = %s
        """
        return self.db.execute(
            query,
            (
                teacher_data.get("teacher_name"),
                teacher_data.get("zoom_user_id"),
                teacher_data.get("username"),
                teacher_data.get("password"),
                teacher_data.get("teacher_id"),
            ),
            connection=connection,
        )

    def delete_teacher(self, teacher_id):
        query = """
        DELETE FROM teachers WHERE teacher_id = %s
        """
        return self.db.execute(query, (teacher_id,))

    def add_teachers_subjects_info(self, teacher_id, subject_id, connection=None):
        query = """
        INSERT INTO teachers_subjects (teacher_id, subject_id)
        VALUES (%s, %s)
        """
        return self.db.execute(
            query,
            (
                teacher_id,
                subject_id,
            ),
            connection=connection,
        )

    def delete_teachers_subjects_info(self, teacher_id, connection=None):
        query = """
        DELETE FROM teachers_subjects WHERE teacher_id = %s
        """
        return self.db.execute(query, (teacher_id,), connection=connection)
    
    def check_teacher_id(self, teacher_id):
        query = """
            SELECT * from teachers WHERE id = %s
        """
        return self.db.fetch_one(query, (teacher_id))
    
    def get_teacher_name(self, teacher_id):
        query = """
            SELECT name FROM teachers WHERE id = %s
        """
        return self.db.fetch_one(query, (teacher_id))
