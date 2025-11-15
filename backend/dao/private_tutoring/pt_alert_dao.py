"""
Private Tutoring Alert DAO
Handles all database operations for private tutoring alerts
"""

class PTAlertDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def create_alert(self, alert_data):
        """Create a new alert"""
        query = """
        INSERT INTO pt_alerts (student_id, subject_name, alert_type, message)
        VALUES (%s, %s, %s, %s)
        """
        return self.db.execute(
            query,
            (
                alert_data.get("student_id"),
                alert_data.get("subject_name"),
                alert_data.get("alert_type"),
                alert_data.get("message")
            ),
            return_id=True
        )

    def get_active_alerts(self):
        """Get all active alerts"""
        query = """
        SELECT a.*, s.name as student_name
        FROM pt_alerts a
        JOIN pt_students s ON a.student_id = s.student_id
        WHERE a.status = 'active'
        ORDER BY a.created_at DESC
        """
        return self.db.fetch_all(query)

    def get_alerts_by_student(self, student_id, status=None):
        """Get alerts for a specific student"""
        query = """
        SELECT a.*, s.name as student_name
        FROM pt_alerts a
        JOIN pt_students s ON a.student_id = s.student_id
        WHERE a.student_id = %s
        """
        params = [student_id]
        
        if status:
            query += " AND a.status = %s"
            params.append(status)
            
        query += " ORDER BY a.created_at DESC"
        return self.db.fetch_all(query, params)

    def get_alert_by_id(self, alert_id):
        """Get a specific alert"""
        query = """
        SELECT a.*, s.name as student_name
        FROM pt_alerts a
        JOIN pt_students s ON a.student_id = s.student_id
        WHERE a.alert_id = %s
        """
        return self.db.fetch_one(query, (alert_id,))

    def dismiss_alert(self, alert_id):
        """Dismiss an alert"""
        query = """
        UPDATE pt_alerts 
        SET status = 'dismissed'
        WHERE alert_id = %s
        """
        return self.db.execute(query, (alert_id,))

    def resolve_alert(self, alert_id):
        """Mark an alert as resolved"""
        query = """
        UPDATE pt_alerts 
        SET status = 'resolved'
        WHERE alert_id = %s
        """
        return self.db.execute(query, (alert_id,))

    def get_alerts_by_type(self, alert_type, status='active'):
        """Get alerts by type"""
        query = """
        SELECT a.*, s.name as student_name
        FROM pt_alerts a
        JOIN pt_students s ON a.student_id = s.student_id
        WHERE a.alert_type = %s AND a.status = %s
        ORDER BY a.created_at DESC
        """
        return self.db.fetch_all(query, (alert_type, status))

    def delete_alert(self, alert_id):
        """Delete an alert"""
        query = "DELETE FROM pt_alerts WHERE alert_id = %s"
        return self.db.execute(query, (alert_id,))

    def create_session_warning_alert(self, student_id, subject_name, remaining_sessions):
        """Create a warning alert when sessions are running low"""
        # Check if warning alert already exists
        existing_query = """
        SELECT COUNT(*) as count FROM pt_alerts 
        WHERE student_id = %s AND subject_name = %s AND alert_type = 'sessions_warning' AND status = 'active'
        """
        existing = self.db.fetch_one(existing_query, (student_id, subject_name))
        
        if existing and existing['count'] > 0:
            return None  # Warning already exists
        
        # Get student name
        student_query = "SELECT name FROM pt_students WHERE student_id = %s"
        student = self.db.fetch_one(student_query, (student_id,))
        student_name = student['name'] if student else 'Unknown Student'
        
        message = f"{student_name} has only {remaining_sessions} sessions remaining for {subject_name}"
        
        alert_data = {
            'student_id': student_id,
            'subject_name': subject_name,
            'alert_type': 'sessions_warning',
            'message': message
        }
        
        return self.create_alert(alert_data)

    def create_session_transfer_alert(self, student_id, from_subject, to_subject, session_count):
        """Create alert for session transfer"""
        # Get student name
        student_query = "SELECT name FROM pt_students WHERE student_id = %s"
        student = self.db.fetch_one(student_query, (student_id,))
        student_name = student['name'] if student else 'Unknown Student'
        
        message = f"{student_name}: Transferred {session_count} sessions from {from_subject} to {to_subject}"
        
        alert_data = {
            'student_id': student_id,
            'subject_name': to_subject,
            'alert_type': 'sessions_transferred',
            'message': message
        }
        
        return self.create_alert(alert_data)

    def get_alert_counts_by_type(self):
        """Get count of alerts by type and status"""
        query = """
        SELECT alert_type, status, COUNT(*) as count
        FROM pt_alerts
        GROUP BY alert_type, status
        ORDER BY alert_type, status
        """
        return self.db.fetch_all(query)

    def cleanup_old_alerts(self, days_old=30):
        """Clean up old dismissed/resolved alerts"""
        query = """
        DELETE FROM pt_alerts 
        WHERE status IN ('dismissed', 'resolved') 
        AND created_at < DATE_SUB(NOW(), INTERVAL %s DAY)
        """
        return self.db.execute(query, (days_old,))
