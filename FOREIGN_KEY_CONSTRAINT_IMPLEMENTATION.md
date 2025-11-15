# Foreign Key Constraint Implementation for pt_teachers and pt_schedules

## Overview

This implementation implements **Solution 1: Prevent the Deletion** using a database foreign key constraint with `ON DELETE RESTRICT`. This is the safest method from a database perspective as it prevents accidental data loss by forcing administrators to make conscious decisions about dependent records.

## Implementation Details

### 1. Database Migration (`11-add_teacher_foreign_key_constraint.sql`)

The migration script performs the following operations:

1. **Adds `teacher_id` column** to `pt_schedules` table if it doesn't exist
2. **Migrates existing data** from `tutor_id` to `teacher_id` (if applicable)
3. **Sets default values** for any NULL `teacher_id` records to reference the first teacher
4. **Adds foreign key constraint** with `ON DELETE RESTRICT`:
   ```sql
   ALTER TABLE pt_schedules 
   ADD CONSTRAINT fk_pt_schedules_teacher_id 
   FOREIGN KEY (teacher_id) REFERENCES pt_teachers(teacher_id) ON DELETE RESTRICT;
   ```
5. **Adds index** for better performance on `teacher_id` lookups

### 2. Application Code Updates

#### Enhanced Teacher Deletion Logic (`pt_teacher_dao.py`)

The `delete_teacher` method now:

1. **Checks for active sessions** in `pt_sessions` table
2. **Checks for scheduled sessions** in `pt_schedules` table  
3. **Provides detailed error messages** with specific counts
4. **Handles foreign key constraint violations** gracefully
5. **Returns user-friendly error messages** like:
   - "Cannot delete Teacher Davis. They have 5 upcoming sessions. Please reassign or cancel these sessions first before removing the teacher."

#### New Dependencies API Endpoint

Added `GET /teachers/{teacher_id}/dependencies` endpoint that returns:

```json
{
  "teacher_name": "Dr. Sarah Kim",
  "active_sessions": {
    "count": 2,
    "statuses": ["scheduled", "in_progress"]
  },
  "scheduled_sessions": {
    "count": 5,
    "details": [
      {
        "schedule_id": 123,
        "scheduled_time": "2024-01-15T14:00:00",
        "student_name": "John Doe",
        "subject_name": "Math AA"
      }
    ]
  },
  "can_delete": false
}
```

#### Frontend Error Handling

Updated `TeacherManager.jsx` to display detailed error messages from the backend instead of generic "Failed to delete teacher" messages.

## How It Works

### Scenario: Admin tries to delete a teacher with scheduled sessions

1. **Admin Action**: Admin clicks "Delete Teacher" for Dr. Sarah Kim
2. **Application Check**: Code checks for active sessions and scheduled sessions
3. **Database Constraint**: If checks pass but constraint exists, database prevents deletion
4. **Error Response**: Application catches the constraint violation and returns detailed message
5. **User Feedback**: Frontend displays: "Cannot delete Dr. Sarah Kim. They have 5 upcoming sessions. Please reassign or cancel these sessions first before removing the teacher."

### Benefits

1. **Data Integrity**: Prevents accidental deletion of teachers with dependent records
2. **User-Friendly**: Clear error messages explain exactly what needs to be done
3. **Database-Level Protection**: Even if application logic fails, database constraint prevents data loss
4. **Detailed Information**: New API endpoint provides comprehensive dependency information
5. **Performance**: Indexed foreign key for efficient lookups

## Testing

Run the test script to verify the implementation:

```bash
cd /home/phinguin_user/sehan_website
python test_foreign_key_constraint.py
```

The test script verifies:
- Foreign key constraint exists
- `teacher_id` column exists in `pt_schedules`
- Teacher deletion is properly prevented
- Dependencies API returns correct information

## Database Schema Changes

### Before
```sql
CREATE TABLE pt_schedules (
  schedule_id int(11) NOT NULL AUTO_INCREMENT,
  student_id int(11) NOT NULL,
  tutor_id int(11) DEFAULT 1,  -- No foreign key constraint
  -- ... other columns
);
```

### After
```sql
CREATE TABLE pt_schedules (
  schedule_id int(11) NOT NULL AUTO_INCREMENT,
  student_id int(11) NOT NULL,
  teacher_id int(11) NOT NULL,  -- Added with foreign key constraint
  -- ... other columns
  CONSTRAINT fk_pt_schedules_teacher_id 
    FOREIGN KEY (teacher_id) REFERENCES pt_teachers(teacher_id) ON DELETE RESTRICT,
  INDEX idx_teacher_id (teacher_id)
);
```

## Error Messages

The system now provides specific error messages:

- **Active Sessions**: "Cannot delete teacher. They have 3 active sessions. Please complete or cancel these sessions first."
- **Scheduled Sessions**: "Cannot delete Teacher Davis. They have 5 upcoming sessions. Please reassign or cancel these sessions first before removing the teacher."
- **Generic Constraint**: "Cannot delete teacher. They have dependent records that must be handled first."

## Migration Instructions

1. **Run the migration script**:
   ```bash
   mysql -u username -p sehanDB < mysql-init/11-add_teacher_foreign_key_constraint.sql
   ```

2. **Verify the constraint**:
   ```sql
   SELECT CONSTRAINT_NAME, DELETE_RULE 
   FROM information_schema.REFERENTIAL_CONSTRAINTS 
   WHERE CONSTRAINT_NAME = 'fk_pt_schedules_teacher_id';
   ```

3. **Test the functionality** using the provided test script

## Future Enhancements

Potential improvements that could be added:

1. **Bulk Reassignment**: API endpoint to reassign all sessions from one teacher to another
2. **Cascade Options**: Different constraint behaviors (SET NULL, CASCADE) for different scenarios
3. **Audit Trail**: Track when teachers are deleted and what dependent records were affected
4. **UI Improvements**: Show dependency information in the teacher management interface before attempting deletion
