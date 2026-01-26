-- Complete Fresh Start Script
-- This script deletes ALL data to start completely fresh
--
-- WARNING: This is a DESTRUCTIVE operation that will delete:
-- - All homework submissions
-- - All attendance records
-- - All students
-- - All parents
-- - All timetable entries
-- - All time slots
--
-- IMPORTANT: Backup your database before running this!
-- This cannot be undone!

-- ============================================================================
-- STEP 1: Show summary of what will be deleted
-- ============================================================================

SELECT 
    'DATA TO BE DELETED' as info,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM parents) as total_parents,
    (SELECT COUNT(*) FROM timetable) as total_timetable_entries,
    (SELECT COUNT(*) FROM time_slots) as total_time_slots,
    (SELECT COUNT(*) FROM attendance) as total_attendance_records,
    (SELECT COUNT(*) FROM student_homework_submission) as total_homework_submissions,
    (SELECT COUNT(*) FROM student_classes) as total_class_enrollments,
    (SELECT COUNT(*) FROM student_comments) as total_comments,
    (SELECT COUNT(*) FROM student_subjects) as total_subject_enrollments;

-- ============================================================================
-- STEP 2: Handle student_homework_submission (no CASCADE)
-- ============================================================================
-- Temporarily disable FK checks to allow deletion
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- STEP 3: Delete all homework submissions
-- ============================================================================

DELETE FROM student_homework_submission;

-- ============================================================================
-- STEP 4: Delete all attendance records
-- ============================================================================

DELETE FROM attendance;

-- ============================================================================
-- STEP 5: Delete all students (will cascade delete related records)
-- ============================================================================

DELETE FROM students;

-- ============================================================================
-- STEP 6: Delete all parents (will cascade delete parent-student links)
-- ============================================================================

DELETE FROM parents;

-- ============================================================================
-- STEP 7: Delete all timetable entries
-- ============================================================================

DELETE FROM timetable;

-- ============================================================================
-- STEP 8: Delete all time slots (optional - uncomment if you want complete reset)
-- ============================================================================

DELETE FROM time_slots;

-- ============================================================================
-- STEP 9: Re-enable FK checks
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- STEP 10: Verify deletion
-- ============================================================================

SELECT 
    'AFTER DELETION - VERIFICATION' as stage,
    (SELECT COUNT(*) FROM students) as remaining_students,
    (SELECT COUNT(*) FROM parents) as remaining_parents,
    (SELECT COUNT(*) FROM timetable) as remaining_timetable,
    (SELECT COUNT(*) FROM time_slots) as remaining_time_slots,
    (SELECT COUNT(*) FROM attendance) as remaining_attendance,
    (SELECT COUNT(*) FROM student_homework_submission) as remaining_homework,
    (SELECT COUNT(*) FROM student_classes) as remaining_enrollments,
    (SELECT COUNT(*) FROM student_comments) as remaining_comments,
    (SELECT COUNT(*) FROM student_subjects) as remaining_subjects,
    (SELECT COUNT(*) FROM parents_students) as remaining_parent_links;

-- ============================================================================
-- OPTIONAL: Reset AUTO_INCREMENT counters (uncomment if desired)
-- ============================================================================

-- ALTER TABLE students AUTO_INCREMENT = 1;
-- ALTER TABLE parents AUTO_INCREMENT = 1;
-- ALTER TABLE attendance AUTO_INCREMENT = 1;
-- ALTER TABLE timetable AUTO_INCREMENT = 1;
-- ALTER TABLE time_slots AUTO_INCREMENT = 1;
-- ALTER TABLE student_homework_submission AUTO_INCREMENT = 1;

