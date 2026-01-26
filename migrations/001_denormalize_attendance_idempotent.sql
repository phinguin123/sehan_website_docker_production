-- Migration: Denormalize Attendance Records (Idempotent Version)
-- Purpose: Make attendance records independent of timetable entries
-- Date: 2025-01-XX
-- 
-- This migration adds denormalized fields to the attendance table so that
-- attendance records remain intact even when timetable entries are deleted.
-- This version is idempotent and can be run multiple times safely.

-- ============================================================================
-- PHASE 1: Add new columns to attendance table (only if they don't exist)
-- ============================================================================

-- Helper procedure to add column if it doesn't exist
DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(128),
    IN columnName VARCHAR(128),
    IN columnDefinition TEXT
)
BEGIN
    DECLARE columnExists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO columnExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName;
    
    IF columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add columns one by one
CALL AddColumnIfNotExists('attendance', 'class_id', 'INT NULL AFTER timetable_id');
CALL AddColumnIfNotExists('attendance', 'subject_id', 'INT NULL AFTER class_id');
CALL AddColumnIfNotExists('attendance', 'level_id', 'INT NULL AFTER subject_id');
CALL AddColumnIfNotExists('attendance', 'mode_id', 'INT NULL AFTER mode_id');
CALL AddColumnIfNotExists('attendance', 'grade_id', 'INT NULL AFTER mode_id');
CALL AddColumnIfNotExists('attendance', 'day_id', 'INT NULL AFTER grade_id');
CALL AddColumnIfNotExists('attendance', 'time_slot_id', 'VARCHAR(36) NULL AFTER day_id');
CALL AddColumnIfNotExists('attendance', 'start_time', 'TIME NULL AFTER time_slot_id');
CALL AddColumnIfNotExists('attendance', 'end_time', 'TIME NULL AFTER start_time');
CALL AddColumnIfNotExists('attendance', 'teacher_id', 'INT NULL AFTER end_time');

-- Clean up procedure
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- ============================================================================
-- PHASE 2: Add indexes for performance (only if they don't exist)
-- ============================================================================

-- Helper procedure to add index if it doesn't exist
DELIMITER $$

DROP PROCEDURE IF EXISTS AddIndexIfNotExists$$
CREATE PROCEDURE AddIndexIfNotExists(
    IN tableName VARCHAR(128),
    IN indexName VARCHAR(128),
    IN indexDefinition TEXT
)
BEGIN
    DECLARE indexExists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO indexExists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = tableName
      AND INDEX_NAME = indexName;
    
    IF indexExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD INDEX ', indexName, ' ', indexDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add indexes
CALL AddIndexIfNotExists('attendance', 'idx_class_id', '(class_id)');
CALL AddIndexIfNotExists('attendance', 'idx_subject_id', '(subject_id)');
CALL AddIndexIfNotExists('attendance', 'idx_level_id', '(level_id)');
CALL AddIndexIfNotExists('attendance', 'idx_mode_id', '(mode_id)');
CALL AddIndexIfNotExists('attendance', 'idx_grade_id', '(grade_id)');
CALL AddIndexIfNotExists('attendance', 'idx_day_id', '(day_id)');
CALL AddIndexIfNotExists('attendance', 'idx_time_slot_id', '(time_slot_id)');
CALL AddIndexIfNotExists('attendance', 'idx_teacher_id', '(teacher_id)');
CALL AddIndexIfNotExists('attendance', 'idx_attendance_date_class', '(attendance_date, class_id)');
CALL AddIndexIfNotExists('attendance', 'idx_attendance_date_subject', '(attendance_date, subject_id)');

-- Clean up procedure
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

-- ============================================================================
-- PHASE 3: Add foreign key constraints (with SET NULL to prevent cascade)
-- ============================================================================

-- Drop existing constraints if they exist, then add new ones
ALTER TABLE attendance
DROP FOREIGN KEY IF EXISTS fk_attendance_class,
DROP FOREIGN KEY IF EXISTS fk_attendance_subject,
DROP FOREIGN KEY IF EXISTS fk_attendance_level,
DROP FOREIGN KEY IF EXISTS fk_attendance_mode,
DROP FOREIGN KEY IF EXISTS fk_attendance_grade,
DROP FOREIGN KEY IF EXISTS fk_attendance_day,
DROP FOREIGN KEY IF EXISTS fk_attendance_time_slot,
DROP FOREIGN KEY IF EXISTS fk_attendance_teacher;

-- Add foreign key constraints
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_class FOREIGN KEY (class_id) 
    REFERENCES classes(class_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_attendance_subject FOREIGN KEY (subject_id) 
    REFERENCES subjects(subject_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_attendance_level FOREIGN KEY (level_id) 
    REFERENCES levels(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_attendance_mode FOREIGN KEY (mode_id) 
    REFERENCES modes(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_attendance_grade FOREIGN KEY (grade_id) 
    REFERENCES grades(grade_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_attendance_day FOREIGN KEY (day_id) 
    REFERENCES days(day_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_attendance_time_slot FOREIGN KEY (time_slot_id) 
    REFERENCES time_slots(time_slot_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_attendance_teacher FOREIGN KEY (teacher_id) 
    REFERENCES teachers(id) ON DELETE SET NULL;

-- ============================================================================
-- PHASE 4: Change timetable_id foreign key from CASCADE to SET NULL
-- ============================================================================

-- Drop the existing CASCADE constraint if it exists
ALTER TABLE attendance
DROP FOREIGN KEY IF EXISTS fk_attendance_timetable;

-- Re-add with SET NULL instead of CASCADE
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_timetable FOREIGN KEY (timetable_id) 
    REFERENCES timetable(timetable_id) ON DELETE SET NULL;

-- ============================================================================
-- PHASE 5: Backfill existing attendance records
-- ============================================================================

-- Backfill records that have a valid timetable_id
UPDATE attendance a
LEFT JOIN timetable t ON a.timetable_id = t.timetable_id
LEFT JOIN classes c ON t.class_id = c.class_id
LEFT JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
SET 
    a.class_id = COALESCE(a.class_id, t.class_id),
    a.subject_id = COALESCE(a.subject_id, c.subject_id),
    a.level_id = COALESCE(a.level_id, c.level_id),
    a.mode_id = COALESCE(a.mode_id, c.mode_id),
    a.grade_id = COALESCE(a.grade_id, c.grade_id),
    a.day_id = COALESCE(a.day_id, t.day_id),
    a.time_slot_id = COALESCE(a.time_slot_id, t.time_slot_id),
    a.start_time = COALESCE(a.start_time, ts.start_time),
    a.end_time = COALESCE(a.end_time, ts.end_time),
    a.teacher_id = COALESCE(a.teacher_id, t.teacher_id)
WHERE a.timetable_id IS NOT NULL
  AND t.timetable_id IS NOT NULL
  AND (a.class_id IS NULL OR a.subject_id IS NULL OR a.level_id IS NULL);

-- Handle records with NULL timetable_id by deriving from subject_name and level
-- This attempts to match based on subject name and level string
UPDATE attendance a
LEFT JOIN subjects s ON a.subject_name = s.subject_name
LEFT JOIN levels l ON (
    (a.level = 'SL' AND l.level_name = 'SL') OR
    (a.level = 'HL' AND l.level_name = 'HL') OR
    ((a.level = 'SL/HL' OR a.level = 'SL,HL') AND l.level_name = 'SL/HL')
)
LEFT JOIN student_classes sc ON sc.student_id = a.student_id
LEFT JOIN classes c ON sc.class_id = c.class_id 
    AND c.subject_id = s.subject_id 
    AND c.level_id = l.id
WHERE a.timetable_id IS NULL
  AND a.class_id IS NULL
  AND s.subject_id IS NOT NULL
  AND l.id IS NOT NULL
  AND c.class_id IS NOT NULL
SET 
    a.class_id = c.class_id,
    a.subject_id = c.subject_id,
    a.level_id = c.level_id,
    a.mode_id = c.mode_id,
    a.grade_id = c.grade_id;

-- ============================================================================
-- Verification queries (run these to check migration success)
-- ============================================================================

-- Check how many records were successfully backfilled
-- SELECT 
--     COUNT(*) as total_records,
--     SUM(CASE WHEN class_id IS NOT NULL THEN 1 ELSE 0 END) as backfilled_records,
--     SUM(CASE WHEN class_id IS NULL THEN 1 ELSE 0 END) as orphaned_records
-- FROM attendance;

-- Check for records that still need attention
-- SELECT 
--     attendance_id, 
--     student_id, 
--     subject_name, 
--     level, 
--     attendance_date,
--     timetable_id,
--     class_id
-- FROM attendance 
-- WHERE class_id IS NULL 
-- LIMIT 100;









