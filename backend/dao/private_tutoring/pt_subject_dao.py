"""
Private Tutoring Subject DAO
Handles all database operations for private tutoring subjects
"""

class PTSubjectDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def get_all_subjects(self, active_only=True):
        """Get all available subjects"""
        query = "SELECT * FROM pt_subjects"
        params = []
        
        if active_only:
            query += " WHERE is_active = %s"
            params.append(True)
            
        query += " ORDER BY subject_name"
        return self.db.fetch_all(query, params)

    def get_subject_by_id(self, subject_id):
        """Get a specific subject by ID"""
        query = "SELECT * FROM pt_subjects WHERE subject_id = %s"
        return self.db.fetch_one(query, (subject_id,))

    def get_subject_by_name(self, subject_name):
        """Get a specific subject by name"""
        query = "SELECT * FROM pt_subjects WHERE subject_name = %s"
        return self.db.fetch_one(query, (subject_name,))

    def add_subject(self, subject_name):
        """Add a new subject"""
        # Check if subject already exists
        existing = self.get_subject_by_name(subject_name)
        if existing:
            if not existing['is_active']:
                # Reactivate if it was deactivated
                return self.activate_subject(existing['subject_id'])
            return existing['subject_id']
        
        query = "INSERT INTO pt_subjects (subject_name) VALUES (%s)"
        return self.db.execute(query, (subject_name,), return_id=True)

    def deactivate_subject(self, subject_id):
        """Deactivate a subject instead of deleting"""
        query = "UPDATE pt_subjects SET is_active = FALSE WHERE subject_id = %s"
        return self.db.execute(query, (subject_id,))

    def activate_subject(self, subject_id):
        """Activate a subject"""
        query = "UPDATE pt_subjects SET is_active = TRUE WHERE subject_id = %s"
        return self.db.execute(query, (subject_id,))

    def get_subjects_for_dropdown(self):
        """Get subjects formatted for dropdown selection"""
        subjects = self.get_all_subjects(active_only=True)
        return [{'value': subject['subject_name'], 'label': subject['subject_name']} for subject in subjects]

    def get_subject_usage_stats(self):
        """Get statistics on subject usage"""
        query = """
        SELECT 
            s.subject_name,
            COUNT(DISTINCT pss.student_id) as student_count,
            COUNT(sa.audit_id) as session_count,
            SUM(sa.duration_hours) as total_hours
        FROM pt_subjects s
        LEFT JOIN pt_student_subjects pss ON s.subject_id = pss.subject_id
        LEFT JOIN pt_session_audit sa ON s.subject_id = sa.subject_id AND sa.is_deleted = FALSE
        WHERE s.is_active = TRUE
        GROUP BY s.subject_name, s.subject_id
        ORDER BY student_count DESC, session_count DESC
        """
        return self.db.fetch_all(query)

    def search_subjects(self, search_term):
        """Search subjects by name"""
        query = """
        SELECT * FROM pt_subjects 
        WHERE subject_name LIKE %s AND is_active = TRUE
        ORDER BY subject_name
        """
        search_pattern = f"%{search_term}%"
        return self.db.fetch_all(query, (search_pattern,))
