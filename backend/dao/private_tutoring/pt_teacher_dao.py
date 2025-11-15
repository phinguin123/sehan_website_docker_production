"""
Private Tutoring Teacher DAO
Data Access Object for managing teachers in the private tutoring system
"""

import bcrypt
from utils.db import DBHelper

class PTTeacherDAO:
    @staticmethod
    def get_all_teachers():
        """Get all teachers with their subjects"""
        query = """
        SELECT 
            t.teacher_id,
            t.name,
            t.username,
            t.created_at,
            GROUP_CONCAT(s.subject_name) as subjects
        FROM pt_teachers t
        LEFT JOIN pt_teacher_subjects ts ON t.teacher_id = ts.teacher_id
        LEFT JOIN pt_subjects s ON ts.subject_id = s.subject_id
        GROUP BY t.teacher_id, t.name, t.username, t.created_at
        ORDER BY t.name
        """
        
        try:
            db = DBHelper()
            results = db.fetch_all(query)
            
            # Process results to format subjects as array
            teachers = []
            for row in results:
                teacher = {
                    'teacher_id': row['teacher_id'],
                    'name': row['name'],
                    'username': row['username'],
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                    'subjects': row['subjects'].split(',') if row['subjects'] else []
                }
                teachers.append(teacher)
            
            return {'status': 'success', 'teachers': teachers}
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error fetching teachers: {str(e)}'}

    @staticmethod
    def get_teacher_by_id(teacher_id):
        """Get a specific teacher by ID"""
        query = """
        SELECT 
            t.teacher_id,
            t.name,
            t.username,
            t.created_at,
            GROUP_CONCAT(s.subject_name) as subjects
        FROM pt_teachers t
        LEFT JOIN pt_teacher_subjects ts ON t.teacher_id = ts.teacher_id
        LEFT JOIN pt_subjects s ON ts.subject_id = s.subject_id
        WHERE t.teacher_id = %s
        GROUP BY t.teacher_id, t.name, t.username, t.created_at
        """
        
        try:
            db = DBHelper()
            result = db.fetch_one(query, (teacher_id,))
            
            if not result:
                return {'status': 'error', 'message': 'Teacher not found'}
            
            teacher = {
                'teacher_id': result['teacher_id'],
                'name': result['name'],
                'username': result['username'],
                'created_at': result['created_at'].isoformat() if result['created_at'] else None,
                'subjects': result['subjects'].split(',') if result['subjects'] else []
            }
            
            return {'status': 'success', 'teacher': teacher}
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error fetching teacher: {str(e)}'}

    @staticmethod
    def create_teacher(name, username, password, subjects=None):
        """Create a new teacher"""
        try:
            db = DBHelper()
            
            # Hash the password using bcrypt
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Insert teacher
            teacher_query = """
            INSERT INTO pt_teachers (name, username, password_hash)
            VALUES (%s, %s, %s)
            """
            
            teacher_id = db.execute(teacher_query, (name, username, password_hash), return_id=True)
            
            # Insert teacher subjects if provided
            if subjects and len(subjects) > 0:
                subject_query = """
                INSERT INTO pt_teacher_subjects (teacher_id, subject_id)
                SELECT %s, subject_id FROM pt_subjects WHERE subject_name = %s
                """
                
                for subject in subjects:
                    db.execute(subject_query, (teacher_id, subject))
            
            return {'status': 'success', 'teacher_id': teacher_id, 'message': 'Teacher created successfully'}
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error creating teacher: {str(e)}'}

    @staticmethod
    def update_teacher(teacher_id, name=None, username=None, subjects=None):
        """Update a teacher"""
        try:
            db = DBHelper()
            
            # Update teacher basic info
            if name or username:
                update_fields = []
                params = []
                
                if name:
                    update_fields.append("name = %s")
                    params.append(name)
                if username:
                    update_fields.append("username = %s")
                    params.append(username)
                
                params.append(teacher_id)
                
                teacher_query = f"""
                UPDATE pt_teachers 
                SET {', '.join(update_fields)}
                WHERE teacher_id = %s
                """
                
                db.execute(teacher_query, params)
            
            # Update subjects if provided
            if subjects is not None:
                # Delete existing subjects
                delete_query = "DELETE FROM pt_teacher_subjects WHERE teacher_id = %s"
                db.execute(delete_query, (teacher_id,))
                
                # Insert new subjects
                if len(subjects) > 0:
                    subject_query = """
                    INSERT INTO pt_teacher_subjects (teacher_id, subject_id)
                    SELECT %s, subject_id FROM pt_subjects WHERE subject_name = %s
                    """
                    
                    for subject in subjects:
                        db.execute(subject_query, (teacher_id, subject))
            
            return {'status': 'success', 'message': 'Teacher updated successfully'}
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error updating teacher: {str(e)}'}

    @staticmethod
    def delete_teacher(teacher_id):
        """Delete a teacher"""
        try:
            db = DBHelper()
            
            # Check if teacher has any active sessions
            active_sessions_query = """
            SELECT COUNT(*) as session_count 
            FROM pt_sessions 
            WHERE teacher_id = %s AND status IN ('scheduled', 'in_progress')
            """
            
            active_result = db.fetch_one(active_sessions_query, (teacher_id,))
            
            if active_result['session_count'] > 0:
                return {'status': 'error', 'message': f'Cannot delete teacher. They have {active_result["session_count"]} active sessions. Please complete or cancel these sessions first.'}
            
            # Check if teacher has any scheduled sessions (future appointments)
            scheduled_sessions_query = """
            SELECT COUNT(*) as schedule_count 
            FROM pt_schedules 
            WHERE teacher_id = %s AND status = 'scheduled'
            """
            
            scheduled_result = db.fetch_one(scheduled_sessions_query, (teacher_id,))
            
            if scheduled_result['schedule_count'] > 0:
                return {'status': 'error', 'message': f'Cannot delete teacher. They have {scheduled_result["schedule_count"]} upcoming sessions scheduled. Please reassign or cancel these sessions first.'}
            
            # Get teacher name for better error messages
            teacher_query = "SELECT name FROM pt_teachers WHERE teacher_id = %s"
            teacher_result = db.fetch_one(teacher_query, (teacher_id,))
            teacher_name = teacher_result['name'] if teacher_result else 'Unknown Teacher'
            
            # Delete teacher (this will cascade delete subjects due to foreign key)
            # The foreign key constraint with ON DELETE RESTRICT will prevent deletion
            # if there are any remaining references
            delete_query = "DELETE FROM pt_teachers WHERE teacher_id = %s"
            db.execute(delete_query, (teacher_id,))
            
            return {'status': 'success', 'message': f'Teacher {teacher_name} deleted successfully'}
            
        except Exception as e:
            error_message = str(e)
            
            # Check if this is a foreign key constraint violation
            if 'foreign key constraint' in error_message.lower() or 'cannot delete' in error_message.lower():
                # Get teacher name for better error message
                try:
                    teacher_query = "SELECT name FROM pt_teachers WHERE teacher_id = %s"
                    teacher_result = db.fetch_one(teacher_query, (teacher_id,))
                    teacher_name = teacher_result['name'] if teacher_result else 'Unknown Teacher'
                    
                    # Get count of dependent schedules for detailed error message
                    count_query = """
                    SELECT COUNT(*) as count FROM pt_schedules 
                    WHERE teacher_id = %s AND status = 'scheduled'
                    """
                    count_result = db.fetch_one(count_query, (teacher_id,))
                    schedule_count = count_result['count'] if count_result else 0
                    
                    if schedule_count > 0:
                        return {'status': 'error', 'message': f'Cannot delete {teacher_name}. They have {schedule_count} upcoming sessions. Please reassign or cancel these sessions first before removing the teacher.'}
                    else:
                        return {'status': 'error', 'message': f'Cannot delete {teacher_name}. They have dependent records that must be handled first.'}
                        
                except:
                    return {'status': 'error', 'message': f'Cannot delete teacher. They have dependent records that must be handled first.'}
            else:
                return {'status': 'error', 'message': f'Error deleting teacher: {error_message}'}

    @staticmethod
    def get_teacher_dependencies(teacher_id):
        """Get detailed information about what prevents teacher deletion"""
        try:
            db = DBHelper()
            
            # Get teacher info
            teacher_query = "SELECT name FROM pt_teachers WHERE teacher_id = %s"
            teacher_result = db.fetch_one(teacher_query, (teacher_id,))
            
            if not teacher_result:
                return {'status': 'error', 'message': 'Teacher not found'}
            
            teacher_name = teacher_result['name']
            
            # Check active sessions
            active_sessions_query = """
            SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT status) as statuses
            FROM pt_sessions 
            WHERE teacher_id = %s AND status IN ('scheduled', 'in_progress')
            """
            active_result = db.fetch_one(active_sessions_query, (teacher_id,))
            
            # Check scheduled sessions
            scheduled_sessions_query = """
            SELECT COUNT(*) as count
            FROM pt_schedules 
            WHERE teacher_id = %s AND status = 'scheduled'
            """
            scheduled_result = db.fetch_one(scheduled_sessions_query, (teacher_id,))
            
            # Get detailed schedule information
            schedule_details_query = """
            SELECT 
                sc.schedule_id,
                sc.start_time,
                st.name as student_name,
                ps.subject_name
            FROM pt_schedules sc
            JOIN pt_students st ON sc.student_id = st.student_id
            JOIN pt_subjects ps ON sc.subject_id = ps.subject_id
            WHERE sc.teacher_id = %s AND sc.status = 'scheduled'
            ORDER BY sc.start_time ASC
            LIMIT 10
            """
            schedule_details = db.fetch_all(schedule_details_query, (teacher_id,))
            
            dependencies = {
                'teacher_name': teacher_name,
                'active_sessions': {
                    'count': active_result['count'] if active_result else 0,
                    'statuses': active_result['statuses'].split(',') if active_result and active_result['statuses'] else []
                },
                'scheduled_sessions': {
                    'count': scheduled_result['count'] if scheduled_result else 0,
                    'details': schedule_details
                },
                'can_delete': (active_result['count'] if active_result else 0) == 0 and (scheduled_result['count'] if scheduled_result else 0) == 0
            }
            
            return {'status': 'success', 'dependencies': dependencies}
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error checking teacher dependencies: {str(e)}'}

    @staticmethod
    def get_teachers_by_subject(subject_name):
        query = """
        SELECT 
            t.teacher_id,
            t.name,
            t.username
        FROM pt_teachers t
        INNER JOIN pt_teacher_subjects ts ON t.teacher_id = ts.teacher_id
        INNER JOIN pt_subjects s ON ts.subject_id = s.subject_id
        WHERE s.subject_name = %s
        ORDER BY t.name
        """
        
        try:
            db = DBHelper()
            results = db.fetch_all(query, (subject_name,))
            
            teachers = []
            for row in results:
                teacher = {
                    'teacher_id': row['teacher_id'],
                    'name': row['name'],
                    'username': row['username']
                }
                teachers.append(teacher)
            
            return {'status': 'success', 'teachers': teachers}
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error fetching teachers by subject: {str(e)}'}

    @staticmethod
    def authenticate_teacher(username, password):
        """Authenticate teacher login"""
        query = """
        SELECT teacher_id, name, username, password_hash
        FROM pt_teachers
        WHERE username = %s
        """
        
        try:
            db = DBHelper()
            result = db.fetch_one(query, (username,))
            
            if not result:
                return {'status': 'error', 'message': 'Teacher not found'}
            
            # Verify password using bcrypt
            stored_hash = result['password_hash']
            
            # Check if the stored hash is a proper bcrypt hash
            if stored_hash.startswith('$2b$'):
                # It's a proper bcrypt hash, verify it
                if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                    teacher = {
                        'teacher_id': result['teacher_id'],
                        'name': result['name'],
                        'username': result['username']
                    }
                    return {'status': 'success', 'teacher': teacher}
                else:
                    return {'status': 'error', 'message': 'Invalid password'}
            else:
                # Legacy plain text password (for backward compatibility)
                # This should be migrated to proper hashing
                if password == stored_hash:
                    teacher = {
                        'teacher_id': result['teacher_id'],
                        'name': result['name'],
                        'username': result['username']
                    }
                    return {'status': 'success', 'teacher': teacher}
                else:
                    return {'status': 'error', 'message': 'Invalid password'}
            
        except Exception as e:
            return {'status': 'error', 'message': f'Error authenticating teacher: {str(e)}'}
