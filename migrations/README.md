# Attendance Denormalization Migration Guide

## Overview

This migration decouples attendance records from timetable entries, ensuring that historical attendance data remains intact even when timetable settings are changed or deleted.

## Problem Statement

Previously, attendance records had a foreign key to `timetable` with `ON DELETE CASCADE`. When timetable entries were deleted (which happens when updating the timetable), all related attendance records were automatically deleted, causing data loss.

## Solution

We denormalize attendance records by storing all necessary class context directly in the attendance table. This makes attendance records self-contained and independent of the timetable.

## Migration Steps

### 1. Backup Database

**CRITICAL**: Always backup your database before running migrations.

```bash
# Example backup command (adjust for your setup)
mysqldump -u [username] -p sehanDB > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run Migration Script

```bash
# Connect to your database
mysql -u [username] -p sehanDB

# Run the migration
source migrations/001_denormalize_attendance.sql;
```

Or execute directly:
```bash
mysql -u [username] -p sehanDB < migrations/001_denormalize_attendance.sql
```

### 3. Verify Migration

Run the verification script:
```bash
mysql -u [username] -p sehanDB < migrations/002_backfill_attendance_verification.sql
```

Check the output:
- **Backfill percentage** should be > 95% (ideally 100%)
- **Orphaned records** should be minimal or zero
- Review any data consistency warnings

### 4. Deploy Code Changes

After the database migration is complete:
1. Deploy the updated backend code
2. Restart the application
3. Monitor for any errors

### 5. Test

Test the following scenarios:
- [ ] Student submits attendance (should populate all new fields)
- [ ] Admin manually changes attendance (should populate all new fields)
- [ ] View attendance for a past date (should work even if timetable changed)
- [ ] Generate reports (should work with historical data)
- [ ] Delete/update timetable (attendance records should remain intact)

## Rollback Plan

If you need to rollback:

1. **Database Rollback**:
   ```sql
   -- Remove new columns (WARNING: This will lose denormalized data)
   ALTER TABLE attendance
   DROP FOREIGN KEY fk_attendance_class,
   DROP FOREIGN KEY fk_attendance_subject,
   DROP FOREIGN KEY fk_attendance_level,
   DROP FOREIGN KEY fk_attendance_mode,
   DROP FOREIGN KEY fk_attendance_grade,
   DROP FOREIGN KEY fk_attendance_day,
   DROP FOREIGN KEY fk_attendance_time_slot,
   DROP FOREIGN KEY fk_attendance_teacher;
   
   ALTER TABLE attendance
   DROP COLUMN class_id,
   DROP COLUMN subject_id,
   DROP COLUMN level_id,
   DROP COLUMN mode_id,
   DROP COLUMN grade_id,
   DROP COLUMN day_id,
   DROP COLUMN time_slot_id,
   DROP COLUMN start_time,
   DROP COLUMN end_time,
   DROP COLUMN teacher_id;
   
   -- Restore CASCADE constraint
   ALTER TABLE attendance
   DROP FOREIGN KEY fk_attendance_timetable;
   
   ALTER TABLE attendance
   ADD CONSTRAINT fk_attendance_timetable FOREIGN KEY (timetable_id) 
       REFERENCES timetable(timetable_id) ON DELETE CASCADE;
   ```

2. **Code Rollback**: Revert to previous code version

## What Changed

### Database Schema

**New columns in `attendance` table:**
- `class_id` - Links to classes table
- `subject_id` - Subject ID (redundant with subject_name but more stable)
- `level_id` - Level ID (redundant with level string but more stable)
- `mode_id` - Online/Offline mode
- `grade_id` - Grade ID
- `day_id` - Day of week
- `time_slot_id` - Time slot reference
- `start_time` - Class start time
- `end_time` - Class end time
- `teacher_id` - Teacher who taught the class

**Foreign Key Changes:**
- `timetable_id` FK changed from `ON DELETE CASCADE` to `ON DELETE SET NULL`
- New FKs added for all denormalized fields (all with `ON DELETE SET NULL`)

### Code Changes

1. **AttendanceDAO**:
   - `submit_attendance()` now populates all denormalized fields
   - `get_attendance()` uses denormalized fields with fallback to timetable join
   - `check_attendance_submission()` uses denormalized fields first

2. **app.py**:
   - Admin submission endpoint populates denormalized fields
   - Auto-absent function populates denormalized fields

## Performance Considerations

- New indexes added for fast lookups on denormalized fields
- Queries now use denormalized fields directly (faster than joins)
- Fallback to timetable join for backward compatibility with old records

## Monitoring

After migration, monitor:
- Query performance (should improve)
- Data integrity (verify attendance records remain after timetable changes)
- Error logs for any issues

## Support

If you encounter issues:
1. Check the verification script output
2. Review application logs
3. Verify all new columns are populated for recent records
4. Check for orphaned records that need manual attention









