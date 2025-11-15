class SubjectDAO:
    ALLOWED_FIELDS = {"subject_id", "subject_name", "gradient", "fg_color", "bg_color"}  # Add all valid 

    def __init__(self, db_helper):
        self.db = db_helper

    def get_subjects(self, fields=None, filters=None):
        """
        Fetch subjects with optional fields and filters.
        
        Args:
            fields (list): List of fields to return (e.g., ["id", "name"]).
            filters (dict): Filters to apply (e.g., {"gradient": "blue"}).
        
        Returns:
            List[dict]: Subjects matching the criteria.
        """
        # Validate requested fields
        if fields is None:
            fields = self.ALLOWED_FIELDS  # Default to all fields
        else:
            fields = [f for f in fields if f in self.ALLOWED_FIELDS]

        # Build SELECT clause
        select_clause = ", ".join(fields) if fields else "*"
        
        # Build WHERE clause (if filters are provided)
        where_clauses = []
        params = []
        if filters:
            for key, value in filters.items():
                if key in self.ALLOWED_FIELDS:
                    where_clauses.append(f"{key} = %s")
                    params.append(value)
        
        # Construct the full query
        query = f"SELECT {select_clause} FROM subjects"
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        return self.db.fetch_all(query, params)

    def get_student_subjects(self, student_id):
        query = """
        SELECT DISTINCT s.subject_id, s.subject_name, l.level_name
        FROM student_classes sc
        JOIN classes c ON sc.class_id = c.class_id
        JOIN subjects s ON c.subject_id = s.subject_id
        JOIN levels l ON sc.level_id = l.id
        WHERE sc.student_id = %s;
        """
        
        return self.db.fetch_all(query, (student_id))