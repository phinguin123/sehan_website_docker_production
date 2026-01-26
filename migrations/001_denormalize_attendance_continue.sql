-- Migration: Denormalize Attendance Records (Continue from partial run)
-- This script continues the migration from where it left off
-- Run this if the original migration was partially executed

-- ============================================================================
-- Check what columns already exist and add missing ones
-- ============================================================================

-- Add subject_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'subject_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN subject_id INT NULL AFTER class_id',
    'SELECT "Column subject_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add level_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'level_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN level_id INT NULL AFTER subject_id',
    'SELECT "Column level_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add mode_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'mode_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN mode_id INT NULL AFTER level_id',
    'SELECT "Column mode_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add grade_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'grade_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN grade_id INT NULL AFTER mode_id',
    'SELECT "Column grade_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add day_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'day_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN day_id INT NULL AFTER grade_id',
    'SELECT "Column day_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add time_slot_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'time_slot_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN time_slot_id VARCHAR(36) NULL AFTER day_id',
    'SELECT "Column time_slot_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add start_time if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'start_time');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN start_time TIME NULL AFTER time_slot_id',
    'SELECT "Column start_time already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add end_time if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'end_time');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN end_time TIME NULL AFTER start_time',
    'SELECT "Column end_time already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add teacher_id if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'teacher_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN teacher_id INT NULL AFTER end_time',
    'SELECT "Column teacher_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PHASE 2: Add indexes for performance (skip if already exist)
-- ============================================================================

-- Note: MySQL doesn't support IF NOT EXISTS for indexes, so we'll use a procedure
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

DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

-- ============================================================================
-- PHASE 3: Add foreign key constraints (drop existing first if needed)
-- ============================================================================

-- Drop existing constraints if they exist (MySQL 8.0.19+ supports IF EXISTS)
-- For older versions, errors will be ignored if constraint doesn't exist
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_class;
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_subject;
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_level;
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_mode;
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_grade;
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_day;
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_time_slot;
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_teacher;

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

-- Drop the existing CASCADE constraint
ALTER TABLE attendance
DROP FOREIGN KEY fk_attendance_timetable;

-- Re-add with SET NULL instead of CASCADE
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_timetable FOREIGN KEY (timetable_id) 
    REFERENCES timetable(timetable_id) ON DELETE SET NULL;

-- ============================================================================
-- PHASE 5: Backfill existing attendance records
-- ============================================================================

-- Backfill records that have a valid timetable_id (only update NULL fields)
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
-- Use a subquery approach to avoid complex JOIN conditions
UPDATE attendance a
INNER JOIN (
    SELECT 
        a.attendance_id,
        c.class_id,
        c.subject_id,
        c.level_id,
        c.mode_id,
        c.grade_id
    FROM attendance a
    INNER JOIN subjects s ON a.subject_name = s.subject_name
    INNER JOIN levels l ON (
        (a.level = 'SL' AND l.level_name = 'SL') OR
        (a.level = 'HL' AND l.level_name = 'HL') OR
        ((a.level = 'SL/HL' OR a.level = 'SL,HL') AND l.level_name = 'SL/HL')
    )
    INNER JOIN student_classes sc ON sc.student_id = a.student_id
    INNER JOIN classes c ON sc.class_id = c.class_id 
        AND c.subject_id = s.subject_id 
        AND c.level_id = l.id
    WHERE a.timetable_id IS NULL
      AND a.class_id IS NULL
) matched ON a.attendance_id = matched.attendance_id
SET 
    a.class_id = matched.class_id,
    a.subject_id = matched.subject_id,
    a.level_id = matched.level_id,
    a.mode_id = matched.mode_id,
    a.grade_id = matched.grade_id;

