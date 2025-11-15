"""
Private Tutoring Student DAO
Handles all database operations for private tutoring students
"""

class PTStudentDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def create_student(self, student_data):
        """Create a new private tutoring student"""
        query = """
        INSERT INTO pt_students (name, grade_id, school, parent_phone)
        VALUES (%s, %s, %s, %s)
        """
        student_id = self.db.execute(
            query,
            (
                student_data.get("name"),
                student_data.get("grade_id"),
                student_data.get("school"),
                student_data.get("parent_phone"),
            ),
            return_id=True
        )
        
        # Add subjects for the student
        if student_data.get("subjects"):
            self.add_student_subjects(student_id, student_data.get("subjects"))
        
        return student_id

    def get_student_by_id(self, student_id):
        """Get student by ID with subjects"""
        student_query = """
        SELECT s.*, g.grade 
        FROM pt_students s
        LEFT JOIN pt_grades g ON s.grade_id = g.grade_id
        WHERE s.student_id = %s
        """
        student = self.db.fetch_one(student_query, (student_id,))
        
        if student:
            # Get subjects for this student with proper join
            subjects_query = """
            SELECT ps.subject_name, pss.subject_level 
            FROM pt_student_subjects pss
            JOIN pt_subjects ps ON pss.subject_id = ps.subject_id
            WHERE pss.student_id = %s
            """
            subjects = self.db.fetch_all(subjects_query, (student_id,))
            student['subjects'] = subjects
            
        return student

    def get_all_students(self):
        """Get all private tutoring students with their subjects"""
        query = """
        SELECT 
            s.student_id,
            s.name,
            s.grade_id,
            g.grade as grade,
            s.school,
            s.parent_phone,
            s.created_at,
            GROUP_CONCAT(CONCAT(ps.subject_id, ':', ps.subject_name, ':', COALESCE(pss.subject_level, 'N/A')) SEPARATOR '|') as subjects
        FROM pt_students s
        LEFT JOIN pt_grades g ON s.grade_id = g.grade_id
        LEFT JOIN pt_student_subjects pss ON s.student_id = pss.student_id
        LEFT JOIN pt_subjects ps ON pss.subject_id = ps.subject_id
        GROUP BY s.student_id
        ORDER BY s.name
        """
        
        students = self.db.fetch_all(query)
        
        # Process subjects string into array
        for student in students:
            if student['subjects']:
                subject_list = []
                for subject_str in student['subjects'].split('|'):
                    subject_id, subject_name, subject_level = subject_str.split(':')
                    subject_list.append({
                        'subject_id': int(subject_id),
                        'subject_name': subject_name,
                        'subject_level': subject_level if subject_level != 'N/A' else None
                    })
                student['subjects'] = subject_list
            else:
                student['subjects'] = []
                
        return students

    def update_student(self, student_id, student_data):
        """Update student information"""
        query = """
        UPDATE pt_students 
        SET name = %s, grade_id = %s, school = %s, parent_phone = %s
        WHERE student_id = %s
        """
        result = self.db.execute(
            query,
            (
                student_data.get("name"),
                student_data.get("grade_id"),
                student_data.get("school"),
                student_data.get("parent_phone"),
                student_id
            )
        )
        
        # Update subjects if provided
        if student_data.get("subjects") is not None:
            # Remove existing subjects
            self.remove_all_student_subjects(student_id)
            # Add new subjects
            if student_data.get("subjects"):
                self.add_student_subjects(student_id, student_data.get("subjects"))
        
        return result

    def delete_student(self, student_id):
        """Delete a student (will cascade to related tables)"""
        query = "DELETE FROM pt_students WHERE student_id = %s"
        return self.db.execute(query, (student_id,))

    def add_student_subjects(self, student_id, subjects):
        """Add subjects for a student"""
        if not subjects:
            return
            
        # First get subject_id from subject_name
        for subject in subjects:
            subject_name = subject.get("subject_name")
            subject_level = subject.get("subject_level", "Standard")
            
            # Get subject_id from pt_subjects table
            subject_query = "SELECT subject_id FROM pt_subjects WHERE subject_name = %s"
            subject_result = self.db.fetch_one(subject_query, (subject_name,))
            
            if subject_result:
                subject_id = subject_result['subject_id']
                
                # Insert into pt_student_subjects with subject_id
                insert_query = """
                INSERT INTO pt_student_subjects (student_id, subject_id, subject_level)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE subject_level = VALUES(subject_level)
                """
                
                self.db.execute(insert_query, (student_id, subject_id, subject_level))

    def remove_all_student_subjects(self, student_id):
        """Remove all subjects for a student"""
        query = "DELETE FROM pt_student_subjects WHERE student_id = %s"
        return self.db.execute(query, (student_id,))

    def get_students_by_subject(self, subject_name):
        """Get all students who take a specific subject"""
        query = """
        SELECT DISTINCT s.student_id, s.name, s.grade, s.school, ss.subject_level
        FROM pt_students s
        JOIN pt_student_subjects ss ON s.student_id = ss.student_id
        WHERE ss.subject_name = %s
        ORDER BY s.name
        """
        return self.db.fetch_all(query, (subject_name,))

    def get_all_grades(self):
        """Get all available grades"""
        query = "SELECT grade_id, grade FROM pt_grades ORDER BY grade"
        return self.db.fetch_all(query)

    def search_students(self, search_term):
        """Search students by name, grade, or school"""
        query = """
        SELECT s.student_id, s.name, s.grade_id, g.grade, s.school, s.parent_phone
        FROM pt_students s
        LEFT JOIN pt_grades g ON s.grade_id = g.grade_id
        WHERE s.name LIKE %s OR g.grade LIKE %s OR s.school LIKE %s
        ORDER BY s.name
        """
        search_pattern = f"%{search_term}%"
        return self.db.fetch_all(query, (search_pattern, search_pattern, search_pattern))

