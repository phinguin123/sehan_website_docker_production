-- Migration: Denormalize Attendance Records
-- Purpose: Make attendance records independent of timetable entries
-- Date: 2025-01-XX
-- 
-- This migration adds denormalized fields to the attendance table so that
-- attendance records remain intact even when timetable entries are deleted.

-- ============================================================================
-- PHASE 1: Add new columns to attendance table
-- ============================================================================

ALTER TABLE attendance
ADD COLUMN class_id INT NULL AFTER timetable_id,
ADD COLUMN subject_id INT NULL AFTER class_id,
ADD COLUMN level_id INT NULL AFTER subject_id,
ADD COLUMN mode_id INT NULL AFTER level_id,
ADD COLUMN grade_id INT NULL AFTER mode_id,
ADD COLUMN day_id INT NULL AFTER grade_id,
ADD COLUMN time_slot_id VARCHAR(36) NULL AFTER day_id,
ADD COLUMN start_time TIME NULL AFTER time_slot_id,
ADD COLUMN end_time TIME NULL AFTER start_time,
ADD COLUMN teacher_id INT NULL AFTER end_time;

-- ============================================================================
-- PHASE 2: Add indexes for performance
-- ============================================================================

ALTER TABLE attendance
ADD INDEX idx_class_id (class_id),
ADD INDEX idx_subject_id (subject_id),
ADD INDEX idx_level_id (level_id),
ADD INDEX idx_mode_id (mode_id),
ADD INDEX idx_grade_id (grade_id),
ADD INDEX idx_day_id (day_id),
ADD INDEX idx_time_slot_id (time_slot_id),
ADD INDEX idx_teacher_id (teacher_id),
ADD INDEX idx_attendance_date_class (attendance_date, class_id),
ADD INDEX idx_attendance_date_subject (attendance_date, subject_id);

-- ============================================================================
-- PHASE 3: Add foreign key constraints (with SET NULL to prevent cascade)
-- ============================================================================

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

-- Backfill records that have a valid timetable_id
UPDATE attendance a
LEFT JOIN timetable t ON a.timetable_id = t.timetable_id
LEFT JOIN classes c ON t.class_id = c.class_id
LEFT JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
SET 
    a.class_id = t.class_id,
    a.subject_id = c.subject_id,
    a.level_id = c.level_id,
    a.mode_id = c.mode_id,
    a.grade_id = c.grade_id,
    a.day_id = t.day_id,
    a.time_slot_id = t.time_slot_id,
    a.start_time = ts.start_time,
    a.end_time = ts.end_time,
    a.teacher_id = t.teacher_id
WHERE a.timetable_id IS NOT NULL
  AND t.timetable_id IS NOT NULL;

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

