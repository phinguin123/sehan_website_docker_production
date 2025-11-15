"""
Private Tutoring Session DAO
Handles all database operations for private tutoring sessions and applications
Updated for normalized database structure using subject_id
"""
from datetime import datetime, timedelta

class PTSessionDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    def create_session_application(self, application_data):
        """Create a new session application for a student"""
        query = """
        INSERT INTO pt_session_applications (student_id, subject_id, initial_sessions, application_type, notes)
        VALUES (%s, %s, %s, %s, %s)
        """
        return self.db.execute(
            query,
            (
                application_data.get("student_id"),
                application_data.get("subject_id"),
                application_data.get("initial_sessions"),
                application_data.get("application_type", "initial"),
                application_data.get("notes")
            ),
            return_id=True
        )

    def create_ledger_entry(self, ledger_data):
        """Create a new ledger entry"""
        query = """
        INSERT INTO pt_application_ledger (application_id, transaction_type, sessions_changed, notes)
        VALUES (%s, %s, %s, %s)
        """
        return self.db.execute(
            query,
            (
                ledger_data.get("application_id"),
                ledger_data.get("transaction_type"),
                ledger_data.get("sessions_changed"),
                ledger_data.get("notes")
            ),
            return_id=True
        )

    def get_application_balance(self, application_id):
        """Get current session balance for an application"""
        query = """
        SELECT COALESCE(SUM(sessions_changed), 0) as balance
        FROM pt_application_ledger
        WHERE application_id = %s
        """
        result = self.db.fetch_one(query, (application_id,))
        return result['balance'] if result else 0

    def get_all_applications(self):
        """Get all session applications with subject details and remaining sessions"""
        query = """
        SELECT 
            sa.application_id,
            sa.student_id,
            st.name as student_name,
            sa.subject_id,
            ps.subject_name,
            sa.initial_sessions as total_sessions,
            COALESCE(completed.total_hours, 0) AS completed_sessions,
            GREATEST(0, sa.initial_sessions - COALESCE(completed.total_hours, 0)) AS remaining_sessions,
            sa.application_type,
            sa.status,
            sa.notes,
            sa.created_at,
            sa.updated_at
        FROM pt_session_applications sa
        JOIN pt_students st ON sa.student_id = st.student_id
        JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
        LEFT JOIN (
            SELECT application_id, COALESCE(SUM(duration_hours), 0) AS total_hours
            FROM pt_sessions 
            WHERE status = 'completed'
            GROUP BY application_id
        ) completed ON sa.application_id = completed.application_id
        WHERE sa.status = 'active'
        ORDER BY st.name, ps.subject_name, sa.created_at
        """
        return self.db.fetch_all(query)

    def get_student_applications_with_remaining_sessions(self, student_id):
        """Get active applications for a student with remaining sessions count using ledger system"""
        query = """
        SELECT 
            sa.application_id,
            sa.student_id,
            sa.subject_id,
            ps.subject_name,
            sa.initial_sessions as total_sessions,
            COALESCE(ledger.balance, sa.initial_sessions) AS remaining_sessions,
            sa.application_type,
            sa.status,
            sa.notes,
            sa.created_at,
            sa.updated_at
        FROM pt_session_applications sa
        JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
        LEFT JOIN (
            SELECT application_id, COALESCE(SUM(sessions_changed), 0) AS balance
            FROM pt_application_ledger
            GROUP BY application_id
        ) ledger ON sa.application_id = ledger.application_id
        WHERE sa.student_id = %s AND sa.status = 'active'
        ORDER BY ps.subject_name, sa.created_at
        """
        return self.db.fetch_all(query, (student_id,))

    def get_student_applications(self, student_id):
        """Get all session applications for a student with subject details"""
        query = """
        SELECT sa.*, ps.subject_name 
        FROM pt_session_applications sa
        JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
        WHERE sa.student_id = %s AND sa.status = 'active'
        ORDER BY sa.created_at
        """
        return self.db.fetch_all(query, (student_id,))

    def get_application_by_id(self, application_id):
        """Get a specific session application with subject details"""
        query = """
        SELECT sa.*, ps.subject_name 
        FROM pt_session_applications sa
        JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
        WHERE sa.application_id = %s
        """
        return self.db.fetch_one(query, (application_id,))

    def start_session(self, session_data):
        """Start a new tutoring session"""
        query = """
        INSERT INTO pt_sessions (application_id, schedule_id, student_id, teacher_id, subject_id, start_time, end_time, duration_hours, status, session_notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'in_progress', %s)
        """
        return self.db.execute(
            query,
            (
                session_data.get("application_id"),
                session_data.get("schedule_id"),
                session_data.get("student_id"),
                session_data.get("teacher_id"),
                session_data.get("subject_id"),
                session_data.get("start_time"),
                session_data.get("end_time"),
                session_data.get("duration_hours"),
                session_data.get("session_notes")
            ),
            return_id=True
        )

    def end_session(self, session_id, end_data, teacher_id):
        """End a tutoring session with proper audit trail using database transaction"""
        try:
            # Start transaction
            self.db.execute("START TRANSACTION")
            
            try:
                # Update the session in pt_sessions table
                update_query = """
                UPDATE pt_sessions 
                SET status = 'completed', session_notes = %s
                WHERE session_id = %s
                """
                result = self.db.execute(
                    update_query,
                    (
                        end_data.get("session_notes"),
                        session_id
                    )
                )
                
                # Get session details for audit
                session = self.get_session_by_id(session_id)
                if not session:
                    raise ValueError(f"Session with ID {session_id} not found")
                
                # Create audit record - this method can return None if it fails
                audit_id = self.create_session_audit_record(session, end_data, teacher_id)
                if audit_id is None:
                    raise ValueError("Failed to create audit record")
                
                # Create ledger entry for session usage
                ledger_data = {
                    'application_id': session['application_id'],
                    'transaction_type': 'usage',
                    'sessions_changed': -1,  # Negative because it's usage
                    'notes': f"Session completed - {session['duration_hours']} hours"
                }
                self.create_ledger_entry(ledger_data)
                
                # Commit transaction
                self.db.execute("COMMIT")
                
                return {
                    'status': 'success',
                    'audit_id': audit_id,
                    'message': 'Session ended successfully'
                }
                
            except Exception as inner_e:
                # Rollback the transaction if any step fails
                self.db.execute("ROLLBACK")
                raise inner_e  # Re-raise the original exception
                
        except Exception as e:
            # This catches both transaction errors and any other errors
            # The transaction should already be rolled back in the inner try-catch
            return {'status': 'error', 'message': f'Failed to end session: {str(e)}'}

    def get_active_sessions(self, teacher_id=None):
        """Get all active (in_progress) sessions"""
        query = """
        SELECT s.*, st.name as student_name, st.grade_id, g.grade, subj.subject_name, pt.name as teacher_name
        FROM pt_sessions s
        JOIN pt_students st ON s.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects subj ON s.subject_id = subj.subject_id
        JOIN pt_teachers pt ON s.teacher_id = pt.teacher_id
        WHERE s.status = 'in_progress'
        """
        params = []
        
        if teacher_id:
            query += " AND s.teacher_id = %s"
            params.append(teacher_id)
            
        query += " ORDER BY s.start_time"
        return self.db.fetch_all(query, params)

    def get_session_by_id(self, session_id):
        """Get a specific session with subject and student details"""
        query = """
        SELECT s.*, st.name as student_name, st.grade_id, g.grade, subj.subject_name, pt.name as teacher_name
        FROM pt_sessions s
        JOIN pt_students st ON s.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects subj ON s.subject_id = subj.subject_id
        JOIN pt_teachers pt ON s.teacher_id = pt.teacher_id
        WHERE s.session_id = %s
        """
        return self.db.fetch_one(query, (session_id,))

    def get_completed_sessions_count(self, student_id, subject_id):
        """Get number of completed sessions for a student/subject (legacy count)."""
        query = """
        SELECT COUNT(*) as count 
        FROM pt_session_audit 
        WHERE student_id = %s AND subject_id = %s AND is_deleted = FALSE
        """
        result = self.db.fetch_one(query, (student_id, subject_id))
        return result['count'] if result else 0

    def get_completed_sessions_count_by_application(self, application_id):
        """Get number of completed sessions for a specific application (legacy count)."""
        query = """
        SELECT COUNT(*) as count 
        FROM pt_session_audit 
        WHERE application_id = %s AND is_deleted = FALSE
        """
        result = self.db.fetch_one(query, (application_id,))
        return result['count'] if result else 0

    def get_completed_hours_by_application(self, application_id):
        """Get total completed hours for a specific application."""
        query = """
        SELECT COALESCE(SUM(duration_hours), 0) AS hours
        FROM pt_session_audit
        WHERE application_id = %s AND is_deleted = FALSE
        """
        result = self.db.fetch_one(query, (application_id,))
        return float(result['hours']) if result and result.get('hours') is not None else 0.0

    def delete_session_application(self, application_id):
        """Delete a session application (only if no completed sessions)"""
        query = "DELETE FROM pt_session_applications WHERE application_id = %s"
        return self.db.execute(query, (application_id,))

    def partial_refund_application(self, application_id, new_total_sessions, refund_reason):
        """Reduce total sessions for partial refund (can't go below completed sessions)"""
        # Get current application details
        application = self.get_application_by_id(application_id)
        if not application:
            raise ValueError("Application not found")
        
        # Get completed hours
        completed_hours = self.get_completed_hours_by_application(application_id)
        
        # Validate new total
        if new_total_sessions < completed_hours:
            raise ValueError(f"Cannot reduce to {new_total_sessions} hours. {completed_hours} hours already completed.")
        
        if new_total_sessions >= application['total_sessions']:
            raise ValueError(f"New total ({new_total_sessions}) must be less than current total ({application['total_sessions']})")
        
        # Update the application
        query = """
        UPDATE pt_session_applications 
        SET total_sessions = %s, 
            notes = CONCAT(COALESCE(notes, ''), 
                          CASE WHEN notes IS NOT NULL AND notes != '' THEN '\n' ELSE '' END,
                          'REFUND: Reduced from ', %s, ' to ', %s, ' sessions. Reason: ', %s),
            updated_at = CURRENT_TIMESTAMP
        WHERE application_id = %s
        """
        
        return self.db.execute(query, (
            new_total_sessions,
            application['total_sessions'], 
            new_total_sessions,
            refund_reason,
            application_id
        ))

    def transfer_sessions(self, from_application_id, to_subject_id, sessions_to_transfer, transfer_reason):
        """Transfer completed sessions from one subject to another"""
        # Get source application
        from_app = self.get_application_by_id(from_application_id)
        if not from_app:
            raise ValueError("Source application not found")
        
        # Get completed sessions count
        completed_count = self.get_completed_sessions_count_by_application(from_application_id)
        
        if sessions_to_transfer > self.get_completed_sessions_count_by_application(from_application_id):
            raise ValueError(f"Cannot transfer {sessions_to_transfer} sessions. Only completed sessions available can be transferred.")
        
        if sessions_to_transfer > from_app['total_sessions']:
            raise ValueError(f"Cannot transfer more sessions than total applied ({from_app['total_sessions']})")
        
        # Get target subject name
        subject_query = "SELECT subject_name FROM pt_subjects WHERE subject_id = %s"
        to_subject = self.db.fetch_one(subject_query, (to_subject_id,))
        if not to_subject:
            raise ValueError("Target subject not found")
        
        # Create new application for target subject
        new_app_query = """
        INSERT INTO pt_session_applications (student_id, subject_id, total_sessions, application_type, notes)
        VALUES (%s, %s, %s, 'transfer', %s)
        """
        
        transfer_note = f"TRANSFER: {sessions_to_transfer} sessions transferred FROM {from_app['subject_name']} (App #{from_application_id}). Reason: {transfer_reason}"
        
        new_application_id = self.db.execute(new_app_query, (
            from_app['student_id'],
            to_subject_id, 
            sessions_to_transfer,
            transfer_note
        ), return_id=True)
        
        # Update source application notes and reduce total
        update_source_query = """
        UPDATE pt_session_applications 
        SET total_sessions = total_sessions - %s,
            notes = CONCAT(COALESCE(notes, ''), 
                          CASE WHEN notes IS NOT NULL AND notes != '' THEN '\n' ELSE '' END,
                          'TRANSFER OUT: ', %s, ' sessions transferred TO ', %s, ' (App #', %s, '). Reason: ', %s),
            updated_at = CURRENT_TIMESTAMP
        WHERE application_id = %s
        """
        
        self.db.execute(update_source_query, (
            sessions_to_transfer,
            sessions_to_transfer,
            to_subject['subject_name'],
            new_application_id,
            transfer_reason,
            from_application_id
        ))
        
        # Update audit records to link transferred sessions to new application
        update_audit_query = """
        UPDATE pt_session_audit 
        SET application_id = %s,
            subject_name = %s,
            subject_id = %s,
            application_type = 'transfer',
            session_notes = CONCAT(COALESCE(session_notes, ''), 
                                 CASE WHEN session_notes IS NOT NULL AND session_notes != '' THEN '\n' ELSE '' END,
                                 '[TRANSFERRED from ', %s, ' to ', %s, ']')
        WHERE application_id = %s AND is_deleted = FALSE
        ORDER BY created_at ASC
        LIMIT %s
        """
        
        self.db.execute(update_audit_query, (
            new_application_id,
            to_subject['subject_name'],
            to_subject_id,
            from_app['subject_name'],
            to_subject['subject_name'],
            from_application_id,
            sessions_to_transfer
        ))
        
        return {
            'new_application_id': new_application_id,
            'transferred_sessions': sessions_to_transfer,
            'from_subject': from_app['subject_name'],
            'to_subject': to_subject['subject_name']
        }

    def transfer_remaining_to_sibling(self, from_application_id, to_student_id, to_subject_id, sessions_to_transfer, transfer_reason):
        """Transfer remaining (unused) sessions from one student's application to a sibling.
        Does not move audit records; only decreases total_sessions from source and creates a new application for the sibling.
        """
        # Get source application
        source = self.get_application_by_id(from_application_id)
        if not source:
            raise ValueError("Source application not found")

        # Determine remaining sessions on source app
        completed = self.get_completed_sessions_count_by_application(from_application_id)
        remaining = max(0, source['total_sessions'] - completed)
        if sessions_to_transfer <= 0:
            raise ValueError("sessions_to_transfer must be greater than 0")
        if sessions_to_transfer > remaining:
            raise ValueError(f"Cannot transfer {sessions_to_transfer}; only {remaining} remaining sessions available.")

        # Resolve subject names
        subj_row = self.db.fetch_one("SELECT subject_name FROM pt_subjects WHERE subject_id = %s", (to_subject_id,))
        if not subj_row:
            raise ValueError("Target subject not found")
        to_subject_name = subj_row['subject_name']

        # Create new application for sibling
        new_app_id = self.db.execute(
            """
            INSERT INTO pt_session_applications (student_id, subject_id, total_sessions, application_type, notes)
            VALUES (%s, %s, %s, 'transfer_sibling', %s)
            """,
            (
                to_student_id,
                to_subject_id,
                sessions_to_transfer,
                f"TRANSFER FROM SIBLING: {sessions_to_transfer} sessions from App #{from_application_id} (subject {source['subject_name']}). Reason: {transfer_reason}"
            ),
            return_id=True
        )

        # Decrease total sessions on source application and append note
        self.db.execute(
            """
            UPDATE pt_session_applications
            SET total_sessions = total_sessions - %s,
                notes = CONCAT(COALESCE(notes, ''),
                               CASE WHEN notes IS NOT NULL AND notes != '' THEN '\n' ELSE '' END,
                               'TRANSFER OUT TO SIBLING: ', %s, ' sessions to student ', %s, ' (App #', %s, '). Reason: ', %s),
                updated_at = CURRENT_TIMESTAMP
            WHERE application_id = %s
            """,
            (
                sessions_to_transfer,
                sessions_to_transfer,
                str(to_student_id),
                new_app_id,
                transfer_reason,
                from_application_id
            )
        )

        return {
            'new_application_id': new_app_id,
            'transferred_sessions': sessions_to_transfer,
            'from_student_id': source['student_id'],
            'to_student_id': to_student_id,
            'subject_name': to_subject_name
        }

    def get_student_session_progress(self, student_id):
        """Get session progress for all applications a student has made (grouped by application), measured in hours."""
        query = """
        SELECT 
            sa.application_id,
            sa.student_id,
            sa.subject_id,
            ps.subject_name,
            sa.initial_sessions AS applied_sessions,
            COALESCE(completed.total_hours, 0) AS completed_sessions,
            GREATEST(0, sa.initial_sessions - COALESCE(completed.total_hours, 0)) AS remaining_sessions,
            sa.application_type,
            sa.status AS application_status,
            sa.notes
        FROM pt_session_applications sa
        JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
        LEFT JOIN (
            SELECT application_id, COALESCE(SUM(duration_hours), 0) AS total_hours
            FROM pt_sessions 
            WHERE status = 'completed'
            GROUP BY application_id
        ) completed ON sa.application_id = completed.application_id
        WHERE sa.student_id = %s AND sa.status = 'active'
        ORDER BY ps.subject_name, sa.created_at
        """
        return self.db.fetch_all(query, (student_id,))

    def get_all_students_session_progress(self):
        """
        Get session progress summary for all students, grouped by each application.
        This query provides application_id for UI buttons functionality.
        """
        try:
            query = """
            SELECT 
                sa.application_id,
                sa.student_id,
                st.name as student_name,
                st.grade_id,
                g.grade,
                st.school,
                sa.subject_id,
                ps.subject_name,
                -- Use ledger for net total sessions (ignoring usage) - same as the other fixed function
                COALESCE(
                    (SELECT SUM(CASE WHEN transaction_type != 'usage' THEN sessions_changed ELSE 0 END) 
                     FROM pt_application_ledger WHERE application_id = sa.application_id),
                    sa.initial_sessions
                ) AS applied_sessions,
                COALESCE(completed.total_hours, 0) AS completed_sessions,
                -- Use ledger for net total sessions (same as applied_sessions for display)
                COALESCE(
                    (SELECT SUM(CASE WHEN transaction_type != 'usage' THEN sessions_changed ELSE 0 END) 
                     FROM pt_application_ledger WHERE application_id = sa.application_id),
                    sa.initial_sessions
                ) AS remaining_sessions,
                sa.application_type,
                sa.status AS application_status,
                sa.notes,
                -- The application is 'completed' when the remaining sessions are zero or less
                CASE 
                    WHEN (SELECT COALESCE(SUM(sessions_changed), 0) FROM pt_application_ledger WHERE application_id = sa.application_id) <= 0 THEN 'completed'
                    ELSE 'active'
                END AS progress_status
            FROM pt_session_applications sa
            JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
            JOIN pt_students st ON sa.student_id = st.student_id
            LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
            LEFT JOIN (
                SELECT application_id, COALESCE(SUM(duration_hours), 0) AS total_hours
                FROM pt_sessions 
                WHERE status = 'completed'
                GROUP BY application_id
            ) completed ON sa.application_id = completed.application_id
            WHERE sa.status IN ('active', 'completed')
            ORDER BY st.name, ps.subject_name, sa.created_at
            """
            result = self.db.fetch_all(query)
            return result if result else []
        except Exception as e:
            print(f"Error getting students session progress: {e}")
            return []

    def get_student_subject_progress(self):
        """
        Gets a consolidated session progress summary for each student-subject combination,
        calculated from the application ledger for true accuracy.
        Uses the same ledger-based calculation as get_student_subject_balance().
        """
        try:
            # Use ledger-based calculation - same logic as get_student_subject_balance()
            query = """
            SELECT 
                st.student_id,
                st.name AS student_name,
                st.grade_id,
                sub.subject_id,
                sub.subject_name,
                
                -- Total sessions: sum of all non-usage transactions (purchases, refunds, transfers)
                COALESCE(ledger_net.net_total_sessions, app_summary.app_total_sessions, 0) AS total_sessions,
                
                -- Completed sessions: sum of all hours used from completed sessions
                COALESCE(usage_summary.sessions_used, 0) AS completed_sessions,
                
                -- Remaining sessions: sum of ALL ledger transactions (includes usage) - same as get_student_subject_balance()
                COALESCE(ledger_balance.balance, 0) AS remaining_sessions,
                
                CASE 
                    WHEN COALESCE(ledger_balance.balance, 0) <= 0 THEN 'completed'
                    ELSE 'active'
                END AS progress_status

            FROM pt_students st
            
            -- Find all unique student-subject pairs that have applications
            JOIN (SELECT DISTINCT student_id, subject_id FROM pt_session_applications WHERE status = 'active') AS student_subjects 
                ON st.student_id = student_subjects.student_id
            
            JOIN pt_subjects sub ON student_subjects.subject_id = sub.subject_id

            -- Subquery to get the ACTUAL BALANCE from ledger (sum of ALL transactions including usage)
            -- This matches get_student_subject_balance() logic
            LEFT JOIN (
                SELECT 
                    app.student_id, 
                    app.subject_id, 
                    SUM(l.sessions_changed) as balance
                FROM pt_application_ledger l
                JOIN pt_session_applications app ON l.application_id = app.application_id
                WHERE app.status = 'active'
                GROUP BY app.student_id, app.subject_id
            ) AS ledger_balance ON st.student_id = ledger_balance.student_id AND sub.subject_id = ledger_balance.subject_id

            -- Subquery to get NET TOTAL (ignores usage) for display purposes
            LEFT JOIN (
                SELECT 
                    app.student_id, 
                    app.subject_id, 
                    SUM(CASE WHEN l.transaction_type != 'usage' THEN l.sessions_changed ELSE 0 END) as net_total_sessions
                FROM pt_application_ledger l
                JOIN pt_session_applications app ON l.application_id = app.application_id
                WHERE app.status = 'active'
                GROUP BY app.student_id, app.subject_id
            ) AS ledger_net ON st.student_id = ledger_net.student_id AND sub.subject_id = ledger_net.subject_id

            -- Subquery to get the total hours USED from completed sessions  
            LEFT JOIN (
                SELECT 
                    s.student_id, 
                    s.subject_id,
                    SUM(s.duration_hours) as sessions_used
                FROM pt_sessions s
                WHERE s.status = 'completed'
                GROUP BY s.student_id, s.subject_id
            ) AS usage_summary ON st.student_id = usage_summary.student_id AND sub.subject_id = usage_summary.subject_id
            
            -- Fallback: use applications table data
            LEFT JOIN (
                SELECT 
                    student_id,
                    subject_id,
                    SUM(initial_sessions) as app_total_sessions
                FROM pt_session_applications 
                WHERE status = 'active'
                GROUP BY student_id, subject_id
            ) AS app_summary ON st.student_id = app_summary.student_id AND sub.subject_id = app_summary.subject_id
            
            -- Only show combinations that have or had sessions
            WHERE COALESCE(ledger_balance.balance, ledger_net.net_total_sessions, app_summary.app_total_sessions, 0) > 0
                OR COALESCE(usage_summary.sessions_used, 0) > 0
            
            ORDER BY st.name, sub.subject_name;
            """
            return self.db.fetch_all(query)
        except Exception as e:
            # Fallback query using the applications table directly if ledger doesn't exist
            print(f"Error in get_student_subject_progress (falling back to applications table): {e}")
            query = """
            SELECT 
                st.student_id,
                st.name AS student_name,
                st.grade_id,
                sub.subject_id,
                sub.subject_name,
                
                -- Fallback: use applications table directly
                COALESCE(app_summary.app_total_sessions, 0) AS total_sessions,
                
                -- This is the TRUE COMPLETED: The sum of all hours used
                COALESCE(usage_summary.sessions_used, 0) AS completed_sessions,
                
                -- Calculate remaining sessions using applications - completed
                GREATEST(0, COALESCE(app_summary.app_total_sessions, 0) - COALESCE(usage_summary.sessions_used, 0)) AS remaining_sessions,
                
                CASE 
                    WHEN GREATEST(0, COALESCE(app_summary.app_total_sessions, 0) - COALESCE(usage_summary.sessions_used, 0)) <= 0 THEN 'completed'
                    ELSE 'active'
                END AS progress_status

            FROM pt_students st
            
            -- Find all unique student-subject pairs that have applications
            JOIN (SELECT DISTINCT student_id, subject_id FROM pt_session_applications WHERE status = 'active') AS student_subjects 
                ON st.student_id = student_subjects.student_id
            
            JOIN pt_subjects sub ON student_subjects.subject_id = sub.subject_id
            
            -- Subquery to get total sessions from applications
            LEFT JOIN (
                SELECT 
                    student_id,
                    subject_id,
                    SUM(initial_sessions) as app_total_sessions
                FROM pt_session_applications 
                WHERE status = 'active'
                GROUP BY student_id, subject_id
            ) AS app_summary ON st.student_id = app_summary.student_id AND sub.subject_id = app_summary.subject_id

            -- Subquery to get the total hours USED from completed sessions
            LEFT JOIN (
                SELECT 
                    s.student_id, 
                    s.subject_id,
                    SUM(s.duration_hours) as sessions_used
                FROM pt_sessions s
                WHERE s.status = 'completed'
                GROUP BY s.student_id, s.subject_id
            ) AS usage_summary ON st.student_id = usage_summary.student_id AND sub.subject_id = usage_summary.subject_id
            
            -- Only show combinations that have sessions
            WHERE COALESCE(app_summary.app_total_sessions, 0) > 0
            
            ORDER BY st.name, sub.subject_name;
            """
            return self.db.fetch_all(query)

    def get_student_subject_balance(self, student_id, subject_id):
        """Get current session balance for a specific student-subject combination"""
        try:
            query = """
            SELECT SUM(l.sessions_changed) as balance
            FROM pt_application_ledger l
            JOIN pt_session_applications app ON l.application_id = app.application_id
            WHERE app.student_id = %s AND app.subject_id = %s AND app.status = 'active'
            """
            result = self.db.fetch_one(query, (student_id, subject_id))
            return float(result['balance']) if result and result['balance'] is not None else 0.0
        except Exception as e:
            # If there's an error (e.g., no tables exist yet), return 0
            print(f"Error getting balance for student {student_id}, subject {subject_id}: {e}")
            return 0.0

    def get_student_remaining_sessions(self, student_id, subject_id=None):
        """
        Get remaining sessions for a student, optionally filtered by subject.
        
        Uses the ledger system which is the source of truth. Sums all ledger entries
        (purchases, refunds, transfers, usage) to get the current balance.
        
        Args:
            student_id: The student ID
            subject_id: Optional subject ID to filter by. If None, returns all subjects.
        
        Returns:
            If subject_id is provided: float - remaining sessions for that subject
            If subject_id is None: list of dicts with subject_id and remaining_sessions
        """
        try:
            if subject_id:
                # Return single value for specific subject
                query = """
                SELECT COALESCE(SUM(l.sessions_changed), 0) as remaining_sessions
                FROM pt_application_ledger l
                JOIN pt_session_applications app ON l.application_id = app.application_id
                WHERE app.student_id = %s 
                  AND app.subject_id = %s 
                  AND app.status = 'active'
                """
                result = self.db.fetch_one(query, (student_id, subject_id))
                return float(result['remaining_sessions']) if result and result['remaining_sessions'] is not None else 0.0
            else:
                # Return list of all subjects with remaining sessions
                query = """
                SELECT 
                    app.subject_id,
                    sub.subject_name,
                    COALESCE(SUM(l.sessions_changed), 0) as remaining_sessions
                FROM pt_session_applications app
                LEFT JOIN pt_application_ledger l ON app.application_id = l.application_id
                LEFT JOIN pt_subjects sub ON app.subject_id = sub.subject_id
                WHERE app.student_id = %s 
                  AND app.status = 'active'
                GROUP BY app.subject_id, sub.subject_name
                HAVING remaining_sessions > 0
                ORDER BY sub.subject_name
                """
                results = self.db.fetch_all(query, (student_id,))
                return results if results else []
        except Exception as e:
            print(f"Error getting remaining sessions for student {student_id}, subject {subject_id}: {e}")
            return 0.0 if subject_id else []

    def process_refund(self, student_id, subject_id, sessions_to_refund, refund_reason):
        """Process a refund using the ledger system"""
        # Get active applications for this student-subject
        applications_query = """
        SELECT application_id FROM pt_session_applications 
        WHERE student_id = %s AND subject_id = %s AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
        """
        application_result = self.db.fetch_one(applications_query, (student_id, subject_id))
        
        if not application_result:
            raise ValueError(f"No active application found for student {student_id} and subject {subject_id}")
        
        application_id = application_result['application_id']
        
        # Create refund ledger entry
        ledger_data = {
            'application_id': application_id,
            'transaction_type': 'refund',
            'sessions_changed': -sessions_to_refund,
            'notes': refund_reason
        }
        ledger_entry_id = self.create_ledger_entry(ledger_data)
        
        # Get new balance
        new_balance = self.get_student_subject_balance(student_id, subject_id)
        
        return {
            'new_balance': new_balance,
            'ledger_entry_id': ledger_entry_id
        }

    def process_subject_transfer(self, student_id, from_subject_id, to_subject_id, sessions_to_transfer, transfer_reason):
        """Process session transfer between subjects for the same student"""
        # Get source application
        source_app_query = """
        SELECT application_id FROM pt_session_applications 
        WHERE student_id = %s AND subject_id = %s AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
        """
        source_app_result = self.db.fetch_one(source_app_query, (student_id, from_subject_id))
        
        if not source_app_result:
            raise ValueError(f"No active application found for source subject {from_subject_id}")
        
        source_application_id = source_app_result['application_id']
        
        # Check if target application exists, create if not
        target_app_query = """
        SELECT application_id FROM pt_session_applications 
        WHERE student_id = %s AND subject_id = %s AND status = 'active'
        """
        target_app_result = self.db.fetch_one(target_app_query, (student_id, to_subject_id))
        
        if not target_app_result:
            # Create new application for target subject
            new_app_data = {
                'student_id': student_id,
                'subject_id': to_subject_id,
                'initial_sessions': 0,
                'application_type': 'transfer',
                'notes': f'Transfer destination from subject {from_subject_id}'
            }
            target_application_id = self.create_session_application(new_app_data)
        else:
            target_application_id = target_app_result['application_id']
        
        # Create transfer out ledger entry
        transfer_out_data = {
            'application_id': source_application_id,
            'transaction_type': 'xfer_out',
            'sessions_changed': -sessions_to_transfer,
            'notes': f"Transfer to subject {to_subject_id}. {transfer_reason}"
        }
        self.create_ledger_entry(transfer_out_data)
        
        # Create transfer in ledger entry
        transfer_in_data = {
            'application_id': target_application_id,
            'transaction_type': 'xfer_in',
            'sessions_changed': sessions_to_transfer,
            'notes': f"Transfer from subject {from_subject_id}. {transfer_reason}"
        }
        self.create_ledger_entry(transfer_in_data)
        
        # Get new balances
        from_balance = self.get_student_subject_balance(student_id, from_subject_id)
        to_balance = self.get_student_subject_balance(student_id, to_subject_id)
        
        return {
            'from_new_balance': from_balance,
            'to_new_balance': to_balance,
            'transfer_application_id': target_application_id
        }

    def process_sibling_transfer(self, from_student_id, to_student_id, subject_id, sessions_to_transfer, transfer_reason):
        """Process session transfer between siblings"""
        # Verify siblings (same parent phone)
        sibling_query = """
        SELECT s1.parent_phone FROM pt_students s1, pt_students s2
        WHERE s1.student_id = %s AND s2.student_id = %s 
        AND s1.parent_phone = s2.parent_phone AND s1.parent_phone IS NOT NULL
        """
        sibling_result = self.db.fetch_one(sibling_query, (from_student_id, to_student_id))
        
        if not sibling_result:
            raise ValueError("Students must be siblings (same parent phone) to transfer sessions")
        
        # Get source application
        source_app_query = """
        SELECT application_id FROM pt_session_applications 
        WHERE student_id = %s AND subject_id = %s AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
        """
        source_app_result = self.db.fetch_one(source_app_query, (from_student_id, subject_id))
        
        if not source_app_result:
            raise ValueError(f"No active application found for source student {from_student_id}")
        
        source_application_id = source_app_result['application_id']
        
        # Check if target application exists, create if not
        target_app_query = """
        SELECT application_id FROM pt_session_applications 
        WHERE student_id = %s AND subject_id = %s AND status = 'active'
        """
        target_app_result = self.db.fetch_one(target_app_query, (to_student_id, subject_id))
        
        if not target_app_result:
            # Create new application for target student
            new_app_data = {
                'student_id': to_student_id,
                'subject_id': subject_id,
                'initial_sessions': 0,
                'application_type': 'transfer',
                'notes': f'Sibling transfer from student {from_student_id}'
            }
            target_application_id = self.create_session_application(new_app_data)
        else:
            target_application_id = target_app_result['application_id']
        
        # Create transfer out ledger entry
        transfer_out_data = {
            'application_id': source_application_id,
            'transaction_type': 'xfer_out',
            'sessions_changed': -sessions_to_transfer,
            'notes': f"Sibling transfer to student {to_student_id}. {transfer_reason}"
        }
        self.create_ledger_entry(transfer_out_data)
        
        # Create transfer in ledger entry
        transfer_in_data = {
            'application_id': target_application_id,
            'transaction_type': 'xfer_in',
            'sessions_changed': sessions_to_transfer,
            'notes': f"Sibling transfer from student {from_student_id}. {transfer_reason}"
        }
        self.create_ledger_entry(transfer_in_data)
        
        # Get new balances
        from_balance = self.get_student_subject_balance(from_student_id, subject_id)
        to_balance = self.get_student_subject_balance(to_student_id, subject_id)
        
        return {
            'from_new_balance': from_balance,
            'to_new_balance': to_balance,
            'transfer_application_id': target_application_id
        }

    def add_sessions(self, student_id, subject_id, sessions_to_add, application_type='additional', notes=None):
        """Add more sessions to student's subject using the ledger system"""
        # Check if application exists, create if not
        existing_app_query = """
        SELECT application_id FROM pt_session_applications 
        WHERE student_id = %s AND subject_id = %s AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
        """
        existing_app_result = self.db.fetch_one(existing_app_query, (student_id, subject_id))
        
        if existing_app_result:
            application_id = existing_app_result['application_id']
        else:
            # Create new application
            new_app_data = {
                'student_id': student_id,
                'subject_id': subject_id,
                'initial_sessions': 0,
                'application_type': application_type,
                'notes': notes or f'{sessions_to_add} sessions added'
            }
            application_id = self.create_session_application(new_app_data)
        
        # Create purchase ledger entry
        ledger_data = {
            'application_id': application_id,
            'transaction_type': 'purchase',
            'sessions_changed': sessions_to_add,
            'notes': notes or f'Additional {sessions_to_add} sessions purchased'
        }
        ledger_entry_id = self.create_ledger_entry(ledger_data)
        
        # Get new balance
        new_balance = self.get_student_subject_balance(student_id, subject_id)
        
        return {
            'new_balance': new_balance,
            'application_id': application_id,
            'ledger_entry_id': ledger_entry_id
        }

    def create_session_audit_record(self, session, end_data):
        """Create an audit record for a completed session with denormalized data, enforcing total assigned hours per application."""
        try:
            # Get full student information
            student_query = """
            SELECT s.*, pss.subject_level
            FROM pt_students s
            LEFT JOIN pt_student_subjects pss ON s.student_id = pss.student_id 
                AND pss.subject_id = %s
            WHERE s.student_id = %s
            """
            student = self.db.fetch_one(student_query, (session['subject_id'], session['student_id']))
            
            # Get teacher information
            teacher_query = """
            SELECT teacher_id, name, username 
            FROM pt_teachers 
            WHERE teacher_id = %s
            """
            teacher = self.db.fetch_one(teacher_query, (session.get('teacher_id'),)) if session.get('teacher_id') else None
            
            # Get application information
            app_query = """
            SELECT application_id, application_type 
            FROM pt_session_applications 
            WHERE student_id = %s AND subject_id = %s AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
            """
            application = self.db.fetch_one(app_query, (session['student_id'], session['subject_id']))

            # Enforce remaining hours limit
            duration_to_log = float(session['duration_hours'])
            if application:
                # Fetch total assigned sessions and already completed hours
                total_query = "SELECT total_sessions FROM pt_session_applications WHERE application_id = %s"
                total_row = self.db.fetch_one(total_query, (application['application_id'],))
                total_sessions = float(total_row['total_sessions']) if total_row else 0.0
                completed_hours = self.get_completed_hours_by_application(application['application_id'])
                
                # Calculate remaining hours (total_sessions represents total hours available)
                remaining_hours = max(0.0, total_sessions - completed_hours)
                
                if remaining_hours <= 0:
                    # Nothing to log - all hours have been used
                    return None
                if duration_to_log > remaining_hours:
                    # Cap the duration to remaining hours to prevent exceeding total
                    duration_to_log = remaining_hours
            
            # Insert audit record
            audit_query = """
            INSERT INTO pt_session_audit (
                session_id, session_date, session_time, duration_hours, session_notes, action, action_user,
                student_id, student_name, student_grade, student_school, parent_phone,
                subject_name, subject_level, subject_id,
                teacher_id, teacher_name, teacher_username,
                application_id, application_type, created_by, updated_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            audit_id = self.db.execute(audit_query, (
                session['session_id'],
                session.get('start_time', datetime.now()).date(),
                session.get('start_time', datetime.now()).time(),
                duration_to_log,
                end_data.get('session_notes'),
                'CREATED',  # action
                teacher['name'] if teacher else 'Unknown Teacher',  # action_user
                student['student_id'] if student else session['student_id'],
                student['name'] if student else session.get('student_name', 'Unknown'),
                student['grade'] if student else 'Unknown',
                student['school'] if student else None,
                student['parent_phone'] if student else None,
                session['subject_name'],
                student['subject_level'] if student else 'SL',
                session['subject_id'],
                teacher['teacher_id'] if teacher else session.get('teacher_id'),
                teacher['name'] if teacher else 'Unknown Teacher',
                teacher['username'] if teacher else None,
                application['application_id'] if application else None,
                application['application_type'] if application else 'unknown',
                session.get('teacher_id'),  # created_by
                session.get('teacher_id')  # updated_by
            ), return_id=True)

            # If within 1 hour of completion, create/update a warning alert
            try:
                if application:
                    completed_after = self.get_completed_hours_by_application(application['application_id'])
                    total_after = total_sessions
                    remaining_after = max(0.0, total_after - completed_after)
                    if remaining_after <= 1.0:
                        from dao.private_tutoring.pt_alert_dao import PTAlertDAO
                        alert_dao = PTAlertDAO(self.db)
                        alert_dao.create_session_warning_alert(student['student_id'] if student else session['student_id'], session['subject_name'], remaining_after)
            except Exception as _:
                pass

            return audit_id
            
        except Exception as e:
            # Log error but don't fail the session completion
            print(f"Warning: Failed to create audit record: {e}")
            return None

    def complete_session_direct(self, session_data, teacher_id):
        """
        Completes a session directly using a robust transaction process.
        This ensures atomicity across all database operations - either all succeed or all fail.
        """
        connection = None
        try:
            # --- Step 1: Start Database Transaction FIRST ---
            connection = self.db.begin_transaction()
            
            # --- Step 2: Data Preparation (within transaction) ---
            # Get required IDs and names from the database to ensure data integrity
            student = self.db.fetch_one_in_transaction(connection, """
                SELECT s.name, s.grade_id, g.grade 
                FROM pt_students s 
                LEFT JOIN pt_grades g ON s.grade_id = g.grade_id 
                WHERE s.student_id = %s
            """, (session_data['student_id'],))
            if not student:
                raise ValueError(f"Student with ID {session_data['student_id']} not found")
            
            teacher = self.db.fetch_one_in_transaction(connection, "SELECT name FROM pt_teachers WHERE teacher_id = %s", (teacher_id,))
            if not teacher:
                raise ValueError(f"Teacher with ID {teacher_id} not found")
            
            subject = self.db.fetch_one_in_transaction(connection, "SELECT subject_name FROM pt_subjects WHERE subject_id = %s", (session_data['subject_id'],))
            if not subject:
                raise ValueError(f"Subject with ID {session_data['subject_id']} not found")
            
            # Find the active application for this student/subject to link the session to
            app_query = """
                SELECT application_id FROM pt_session_applications 
                WHERE student_id = %s AND subject_id = %s AND status = 'active'
                ORDER BY created_at DESC LIMIT 1
            """
            application = self.db.fetch_one_in_transaction(connection, app_query, (session_data['student_id'], session_data['subject_id']))
            application_id = application['application_id'] if application else None

            # Securely parse date and time
            start_time = datetime.fromisoformat(f"{session_data['session_date']}T{session_data['session_time']}")
            duration_hours = float(session_data['duration_hours'])
            end_time = start_time + timedelta(hours=duration_hours)

            # --- Step 3: Create the "Source of Truth" in pt_sessions ---
            session_sql = """
                INSERT INTO pt_sessions (application_id, student_id, grade_id, teacher_id, subject_id, start_time, end_time, duration_hours, status, session_notes) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'completed', %s)
            """
            session_params = (
                application_id, session_data['student_id'], student['grade_id'], teacher_id, session_data['subject_id'], 
                start_time, end_time, duration_hours, session_data.get('session_notes', '')
            )
            session_id = self.db.execute_in_transaction(connection, session_sql, session_params, return_id=True)
            
            # --- Step 4: Update Financials in pt_application_ledger ---
            if application_id:
                ledger_sql = "INSERT INTO pt_application_ledger (application_id, transaction_type, sessions_changed, notes) VALUES (%s, 'usage', %s, %s)"
                ledger_params = (application_id, -duration_hours, f"Session #{session_id} completed")
                self.db.execute_in_transaction(connection, ledger_sql, ledger_params)
            
            # --- Step 5: Create the Reporting Record in pt_session_summary ---
            summary_sql = """
                INSERT INTO pt_session_summary (session_id, start_time, end_time, duration_hours, student_id, student_name, grade_id, grade_name, teacher_id, teacher_name, subject_id, subject_name) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            summary_params = (
                session_id, start_time, end_time, duration_hours, session_data['student_id'], 
                student['name'], student['grade_id'], student['grade'], teacher_id, teacher['name'], session_data['subject_id'], subject['subject_name']
            )
            self.db.execute_in_transaction(connection, summary_sql, summary_params)
            
            # --- Step 6: Create the Audit Record in pt_session_audit ---
            audit_sql = "INSERT INTO pt_session_audit (session_id, action, session_notes, teacher_id) VALUES (%s, %s, %s, %s)"
            audit_params = (session_id, 'CREATED', session_data.get('session_notes', f"Session completed for {student['name']}"), teacher_id)
            audit_id = self.db.execute_in_transaction(connection, audit_sql, audit_params, return_id=True)
            
            # --- Step 7: Commit the Transaction ---
            self.db.commit_transaction(connection)
            connection = None  # Prevent rollback in finally
            
            return {'status': 'success', 'session_id': session_id, 'audit_id': audit_id, 'message': 'Session completed successfully.'}
                
        except Exception as e:
            # Rollback the transaction if any step fails
            if connection:
                try:
                    self.db.rollback_transaction(connection)
                except:
                    pass  # Ignore errors during rollback
            return {'status': 'error', 'message': f'Failed to complete session: {str(e)}'}

    def get_sessions_by_date_range(self, start_date, end_date, teacher_id=None):
        """Get sessions within a date range"""
        query = """
        SELECT s.*, st.name as student_name, st.grade_id, g.grade, subj.subject_name
        FROM pt_sessions s
        JOIN pt_students st ON s.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects subj ON s.subject_id = subj.subject_id
        WHERE s.start_time >= %s AND s.end_time <= %s
        """
        params = [start_date, end_date]
        
        if teacher_id:
            query += " AND s.teacher_id = %s"
            params.append(teacher_id)
            
        query += " ORDER BY s.start_time"
        return self.db.fetch_all(query, params)

    def get_student_sessions_from_live(self, student_id):
        """Fetch sessions for a student directly from pt_sessions (live table), not from audit.

        Returns records with a `comments` field sourced from `session_notes` for frontend compatibility.
        """
        query = """
        SELECT 
            s.session_id,
            s.start_time,
            s.end_time,
            s.duration_hours,
            s.session_notes,
            s.status,
            s.teacher_id,
            t.name AS teacher_name,
            s.subject_id,
            subj.subject_name,
            st.grade_id,
            g.grade
        FROM pt_sessions s
        JOIN pt_students st ON s.student_id = st.student_id
        LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
        JOIN pt_subjects subj ON s.subject_id = subj.subject_id
        LEFT JOIN pt_teachers t ON s.teacher_id = t.teacher_id
        WHERE s.student_id = %s
        ORDER BY s.start_time DESC
        """
        rows = self.db.fetch_all(query, (student_id,))

        sessions = []
        for row in rows:
            sessions.append({
                'session_id': row['session_id'],
                'start_time': row['start_time'].isoformat() if row.get('start_time') else None,
                'end_time': row['end_time'].isoformat() if row.get('end_time') else None,
                'duration_hours': float(row['duration_hours']) if row.get('duration_hours') is not None else None,
                'session_notes': row.get('session_notes'),
                'status': row.get('status'),
                'teacher_id': row.get('teacher_id'),
                'teacher_name': row.get('teacher_name') or 'Unknown Teacher',
                'subject_id': row['subject_id'],
                'subject_name': row['subject_name'],
                'grade_id': row.get('grade_id'),
                'grade': row.get('grade')
            })

        return {
            'sessions': sessions
        }

    def delete_session(self, session_id):
        """Delete a session (only if not completed)"""
        # Check if session is completed
        session = self.get_session_by_id(session_id)
        if session and session['status'] == 'completed':
            raise ValueError("Cannot delete completed session")
            
        query = "DELETE FROM pt_sessions WHERE session_id = %s"
        return self.db.execute(query, (session_id,))

    def validate_session_data_integrity(self):
        """Validate that no completed hours exceed total sessions for any application"""
        query = """
        SELECT 
            sa.application_id,
            sa.student_id,
            st.name as student_name,
            ps.subject_name,
            sa.total_sessions,
            COALESCE(completed.total_hours, 0) AS completed_hours
        FROM pt_session_applications sa
        JOIN pt_students st ON sa.student_id = st.student_id
        JOIN pt_subjects ps ON sa.subject_id = ps.subject_id
        LEFT JOIN (
            SELECT application_id, COALESCE(SUM(duration_hours), 0) AS total_hours
            FROM pt_session_audit 
            WHERE is_deleted = FALSE 
            GROUP BY application_id
        ) completed ON sa.application_id = completed.application_id
        WHERE sa.status = 'active'
        HAVING completed_hours > sa.total_sessions
        ORDER BY st.name, ps.subject_name
        """
        
        violations = self.db.fetch_all(query)
        
        if violations:
            error_messages = []
            for violation in violations:
                error_messages.append(
                    f"Student {violation['student_name']} ({violation['subject_name']}): "
                    f"{violation['completed_hours']} hours completed but only {violation['total_sessions']} hours assigned"
                )
            
            return {
                'status': 'error',
                'message': 'Data integrity violations found',
                'violations': violations,
                'error_summary': '; '.join(error_messages)
            }
        
        return {'status': 'success', 'message': 'No data integrity violations found'}

    def fix_data_integrity_violations(self):
        """Fix any data integrity violations by capping completed hours to total sessions"""
        violations_result = self.validate_session_data_integrity()
        
        if violations_result['status'] == 'error':
            violations = violations_result['violations']
            fixed_count = 0
            
            for violation in violations:
                # Cap the completed hours in audit records to match total sessions
                update_query = """
                UPDATE pt_session_audit 
                SET duration_hours = LEAST(duration_hours, %s - (
                    SELECT COALESCE(SUM(duration_hours), 0) 
                    FROM pt_session_audit sa2 
                    WHERE sa2.application_id = %s 
                    AND sa2.audit_id < pt_session_audit.audit_id 
                    AND sa2.is_deleted = FALSE
                ))
                WHERE application_id = %s 
                AND is_deleted = FALSE
                AND duration_hours > 0
                ORDER BY created_at ASC
                """
                
                self.db.execute(update_query, (
                    violation['total_sessions'],
                    violation['application_id'],
                    violation['application_id']
                ))
                fixed_count += 1
            
            return {
                'status': 'success',
                'message': f'Fixed {fixed_count} data integrity violations',
                'fixed_count': fixed_count
            }
        
        return {'status': 'success', 'message': 'No violations to fix'}

    def cancel_session(self, session_id, reason=None):
        """Cancel a session"""
        query = """
        UPDATE pt_sessions 
        SET status = 'cancelled', session_notes = %s
        WHERE session_id = %s
        """
        notes = f"Session cancelled. Reason: {reason}" if reason else "Session cancelled"
        return self.db.execute(query, (notes, session_id))

    def update_session_with_audit(self, audit_id, update_data, updated_by):
        """Update a session with proper audit trail using database transaction"""
        try:
            # Start transaction
            self.db.execute("START TRANSACTION")
            
            # Get current session from audit table
            current_session_query = """
            SELECT * FROM pt_session_audit WHERE audit_id = %s AND is_deleted = FALSE
            """
            current_session = self.db.fetch_one(current_session_query, (audit_id,))
            
            if not current_session:
                self.db.execute("ROLLBACK")
                return {'status': 'error', 'message': 'Session not found'}
            
            # If there's a corresponding session in pt_sessions table, update it
            if current_session.get('session_id'):
                update_sessions_query = """
                UPDATE pt_sessions 
                SET duration_hours = %s,
                    start_time = %s,
                    end_time = %s,
                    session_notes = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE session_id = %s
                """
                
                # Combine date and time for start_time and end_time
                from datetime import datetime, date, time, timedelta
                
                # Parse time - handle both HH:MM and HH:MM:SS formats
                time_str = update_data['session_time']
                if len(time_str.split(':')) == 3:  # HH:MM:SS format
                    time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
                else:  # HH:MM format
                    time_obj = datetime.strptime(time_str, '%H:%M').time()
                
                start_time = datetime.combine(
                    datetime.strptime(update_data['session_date'], '%Y-%m-%d').date(),
                    time_obj
                )
                
                duration_hours = float(update_data['duration_hours'])
                end_time = start_time + timedelta(hours=duration_hours)
                
                self.db.execute(update_sessions_query, (
                    update_data['duration_hours'],
                    start_time,
                    end_time,
                    update_data['session_notes'],
                    current_session['session_id']
                ))
            
            # Create new audit record with updated information
            # Get updated student information
            student_query = """
            SELECT s.*, pss.subject_level
            FROM pt_students s
            LEFT JOIN pt_student_subjects pss ON s.student_id = pss.student_id 
                AND pss.subject_id = %s
            WHERE s.student_id = %s
            """
            student = self.db.fetch_one(student_query, (current_session['subject_id'], current_session['student_id']))
            
            # Get updated teacher information
            teacher_query = """
            SELECT teacher_id, name, username 
            FROM pt_teachers 
            WHERE teacher_id = %s
            """
            teacher = self.db.fetch_one(teacher_query, (updated_by,))
            
            # Get updated subject information
            subject_query = """
            SELECT subject_name FROM pt_subjects WHERE subject_id = %s
            """
            subject = self.db.fetch_one(subject_query, (current_session['subject_id'],))
            
            # Insert new audit record
            new_audit_query = """
            INSERT INTO pt_session_audit (
                session_id, session_date, session_time, duration_hours, session_notes, action, action_user,
                student_id, student_name, student_grade, student_school, parent_phone,
                subject_name, subject_level, subject_id,
                teacher_id, teacher_name, teacher_username,
                application_id, application_type, created_by, updated_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            new_audit_id = self.db.execute(new_audit_query, (
                current_session.get('session_id'),
                update_data['session_date'],
                update_data['session_time'],
                update_data['duration_hours'],
                update_data['session_notes'],
                'STATUS_UPDATED',  # action
                teacher['name'] if teacher else 'Unknown Teacher',  # action_user
                student['student_id'] if student else current_session['student_id'],
                student['name'] if student else current_session.get('student_name', 'Unknown'),
                student['grade'] if student else current_session.get('student_grade', 'Unknown'),
                student['school'] if student else current_session.get('student_school'),
                student['parent_phone'] if student else current_session.get('parent_phone'),
                subject['subject_name'] if subject else current_session.get('subject_name', 'Unknown'),
                student['subject_level'] if student else current_session.get('subject_level', 'SL'),
                current_session['subject_id'],
                teacher['teacher_id'] if teacher else updated_by,
                teacher['name'] if teacher else 'Unknown Teacher',
                teacher['username'] if teacher else None,
                current_session.get('application_id'),
                current_session.get('application_type', 'unknown'),
                updated_by,  # created_by
                updated_by   # updated_by
            ), return_id=True)
            
            # Mark the old audit record as deleted
            mark_deleted_query = """
            UPDATE pt_session_audit 
            SET is_deleted = TRUE, 
                deleted_at = CURRENT_TIMESTAMP,
                deleted_by = %s
            WHERE audit_id = %s
            """
            self.db.execute(mark_deleted_query, (updated_by, audit_id))
            
            # Commit transaction
            self.db.execute("COMMIT")
            
            return {
                'status': 'success',
                'message': 'Session updated successfully with audit trail',
                'old_audit_id': audit_id,
                'new_audit_id': new_audit_id
            }
            
        except Exception as e:
            # Rollback transaction on error
            self.db.execute("ROLLBACK")
            return {'status': 'error', 'message': f'Failed to update session: {str(e)}'}

    def update_session_with_audit_by_session_id(self, session_id, update_data, updated_by):
        """
        Update a session using the proper 3-step process:
        1. UPDATE pt_sessions: Correct the "Source of Truth" record
        2. UPDATE pt_session_summary: Update the "Live Mirror" to match the source of truth
        3. INSERT into pt_session_audit: Create a new audit log entry to record the change
        """
        try:
            # Start transaction
            self.db.execute("START TRANSACTION")
            
            # Get current session from sessions table
            current_session_query = """
            SELECT s.*, 
                   st.name as student_name,
                   g.grade as student_grade,
                   st.school as student_school,
                   st.parent_phone,
                   t.name as teacher_name,
                   t.username as teacher_username,
                   sub.subject_name,
                   sub.subject_id,
                   sa.application_id,
                   sa.application_type
            FROM pt_sessions s
            LEFT JOIN pt_students st ON s.student_id = st.student_id
            LEFT JOIN pt_grades g ON st.grade_id = g.grade_id
            LEFT JOIN pt_teachers t ON s.teacher_id = t.teacher_id
            LEFT JOIN pt_subjects sub ON s.subject_id = sub.subject_id
            LEFT JOIN pt_session_applications sa ON s.application_id = sa.application_id
            WHERE s.session_id = %s AND s.status != 'cancelled'
            """
            current_session = self.db.fetch_one(current_session_query, (session_id,))
            
            if not current_session:
                self.db.execute("ROLLBACK")
                return {'status': 'error', 'message': 'Session not found'}
            
            # Step 1: Update the session in pt_sessions table (Source of Truth)
            update_sessions_query = """
            UPDATE pt_sessions 
            SET duration_hours = %s,
                start_time = %s,
                end_time = %s,
                session_notes = %s
            WHERE session_id = %s
            """
            
            # Combine date and time for start_time and end_time
            from datetime import datetime, date, time, timedelta
            
            # Parse time - handle both HH:MM and HH:MM:SS formats
            time_str = update_data['session_time']
            if len(time_str.split(':')) == 3:  # HH:MM:SS format
                time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
            else:  # HH:MM format
                time_obj = datetime.strptime(time_str, '%H:%M').time()
            
            start_time = datetime.combine(
                datetime.strptime(update_data['session_date'], '%Y-%m-%d').date(),
                time_obj
            )
            
            duration_hours = float( update_data['duration_hours'])
            end_time = start_time + timedelta(hours=duration_hours)
            
            self.db.execute(update_sessions_query, (
                update_data['duration_hours'],
                start_time,
                end_time,
                update_data['session_notes'],
                session_id
            ))
            
            # Step 2: Update the pt_session_summary "live mirror" table
            update_summary_query = """
            UPDATE pt_session_summary 
            SET start_time = %s,
                end_time = %s,
                duration_hours = %s
            WHERE session_id = %s
            """
            
            self.db.execute(update_summary_query, (
                start_time,
                end_time,
                update_data['duration_hours'],
                session_id
            ))
            
            # Get updated teacher information
            teacher_query = """
            SELECT teacher_id, name, username 
            FROM pt_teachers 
            WHERE teacher_id = %s
            """
            teacher = self.db.fetch_one(teacher_query, (updated_by,))
            
            # Step 3: Insert new audit record
            # Determine what specific changes were made for better action tracking
            changes_made = []
            if current_session['duration_hours'] != update_data['duration_hours']:
                changes_made.append('DURATION_UPDATED')
            if current_session.get('session_notes') != update_data['session_notes']:
                changes_made.append('NOTES_UPDATED')
            # Note: TIME_UPDATED is not in the enum, so we'll use DURATION_UPDATED for time changes
            if current_session['start_time'] != start_time:
                changes_made.append('DURATION_UPDATED')
            
            # Use the first change or default to 'NOTES_UPDATED' if no specific changes detected
            action = changes_made[0] if changes_made else 'NOTES_UPDATED'
            
            new_audit_query = """
            INSERT INTO pt_session_audit (
                session_id, action, session_notes, teacher_id
            ) VALUES (%s, %s, %s, %s)
            """
            
            new_audit_id = self.db.execute(new_audit_query, (
                session_id,
                action,  # Use the specific action we determined
                update_data['session_notes'],
                teacher['teacher_id'] if teacher else updated_by
            ), return_id=True)
            
            # Commit transaction
            self.db.execute("COMMIT")
            
            return {
                'status': 'success',
                'message': 'Session updated successfully with audit trail',
                'session_id': session_id,
                'new_audit_id': new_audit_id
            }
            
        except Exception as e:
            # Rollback transaction on error
            self.db.execute("ROLLBACK")
            return {'status': 'error', 'message': f'Failed to update session: {str(e)}'}

    def get_session_summaries(self):
        """
        Gets the clean, summarized history of ALL completed sessions for ALL students.
        This powers the main global session log page by querying the optimized summary table.
        """
        try:
            query = """
                SELECT 
                    summary_id,
                    session_id,
                    start_time,
                    end_time,
                    duration_hours,
                    student_id,
                    student_name,
                    grade_id,
                    grade_name,
                    teacher_id,
                    teacher_name,
                    subject_id,
                    subject_name
                FROM 
                    pt_session_summary
                ORDER BY 
                    start_time DESC;
            """
            # Note: You can add a `session_notes` field here if you want it in the main view
            master_session_list = self.db.fetch_all(query)
            
            # Map the fields to match frontend expectations
            formatted_sessions = []
            for session in master_session_list:
                formatted_session = {
                    'session_id': session['session_id'],
                    'start_time': session['start_time'].isoformat() + 'Z' if session.get('start_time') else None,
                    'end_time': session['end_time'].isoformat() + 'Z' if session.get('end_time') else None,
                    'duration_hours': float(session['duration_hours']) if session.get('duration_hours') is not None else None,
                    'student_id': session['student_id'],
                    'student_name': session['student_name'],
                    'grade': int(session['grade_name']) if session.get('grade_name') else None,
                    'teacher_id': session['teacher_id'],
                    'teacher_name': session['teacher_name'],
                    'subject_id': session['subject_id'],
                    'subject_name': session['subject_name']
                }
                formatted_sessions.append(formatted_session)
            
            return formatted_sessions

        except Exception as e:
            print(f"Error fetching all session summaries: {e}")
            return []

    def get_audit_trail_for_session(self, session_id = None):
        """
        Gets the detailed, step-by-step audit trail for a SINGLE session.
        For the collapsible dropdown.
        """
        try:
            # Base query to get session audit records with teacher name from the audit table
            query = """
            SELECT 
                sa.audit_id,
                sa.session_id,
                sa.action,
                sa.session_notes,
                sa.created_at,
                t.name as teacher_name
            FROM 
                pt_session_audit sa
            JOIN 
                pt_teachers t ON sa.teacher_id = t.teacher_id
            WHERE 
                sa.session_id = %s
            ORDER BY
                sa.created_at ASC;
            """
            
            audit_trail = self.db.fetch_all(query, (session_id,))

            return audit_trail
            
        except Exception as e:
            print(f"Error fetching session history: {e}")
            return []

    def get_application_ledger(self, application_id):
        """Get transaction ledger for a specific application"""
        try:
            query = """
            SELECT 
                l.transaction_date,
                l.transaction_type,
                l.sessions_changed,
                l.notes,
                s.subject_name,
                st.name as student_name
            FROM pt_application_ledger l
            JOIN pt_session_applications app ON l.application_id = app.application_id
            JOIN pt_students st ON app.student_id = st.student_id
            JOIN pt_subjects s ON app.subject_id = s.subject_id
            WHERE l.application_id = %s
            ORDER BY l.transaction_date ASC, l.ledger_id ASC
            """
            result = self.db.fetch_all(query, (application_id,))
            return result if result else []
        except Exception as e:
            print(f"Error getting application ledger: {e}")
            return []