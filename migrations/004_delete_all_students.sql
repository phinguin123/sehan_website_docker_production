-- Script to Delete All Students
-- WARNING: This will permanently delete all student records and ALL related data!
-- 
-- CASCADE DELETES will affect:
-- - attendance (all attendance records)
-- - parents_students (all parent-student links)
-- - student_classes (all class enrollments)
-- - student_comments (all student comments)
-- - student_subjects (all subject enrollments)
-- - student_time_slot (all time slot assignments)
-- - student_homework_submission (all homework submissions)
--
-- IMPORTANT: Backup your database before running this script!
-- This is a DESTRUCTIVE operation that cannot be undone!

-- ============================================================================
-- STEP 1: Show current count and impact (for verification)
-- ============================================================================

SELECT 
    'BEFORE DELETION - SUMMARY' as stage,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM attendance) as total_attendance_records,
    (SELECT COUNT(*) FROM student_classes) as total_class_enrollments,
    (SELECT COUNT(*) FROM student_comments) as total_comments,
    (SELECT COUNT(*) FROM student_subjects) as total_subject_enrollments,
    (SELECT COUNT(*) FROM student_homework_submission) as total_homework_submissions,
    (SELECT COUNT(*) FROM parents_students) as total_parent_student_links;

-- ============================================================================
-- STEP 2: Show sample of students that will be deleted (optional - uncomment)
-- ============================================================================

-- SELECT 
--     s.student_id,
--     s.name,
--     s.grade,
--     s.email,
--     COUNT(DISTINCT a.attendance_id) as attendance_count,
--     COUNT(DISTINCT sc.class_id) as class_count,
--     COUNT(DISTINCT shs.id) as homework_count
-- FROM students s
-- LEFT JOIN attendance a ON s.student_id = a.student_id
-- LEFT JOIN student_classes sc ON s.student_id = sc.student_id
-- LEFT JOIN student_homework_submission shs ON s.student_id = shs.student_id
-- GROUP BY s.student_id, s.name, s.grade, s.email
-- ORDER BY s.student_id
-- LIMIT 20;

-- ============================================================================
-- STEP 3: Handle student_homework_submission (no CASCADE, must delete first)
-- ============================================================================
-- Note: student_homework_submission FK doesn't have CASCADE, so delete first
-- OR set student_id to NULL, OR temporarily disable FK checks

-- Option 1: Delete homework submissions first (uncomment if you want to delete them)
-- DELETE FROM student_homework_submission;

-- Option 2: Set student_id to NULL (keeps homework but unlinks from students)
-- UPDATE student_homework_submission SET student_id = NULL;

-- Option 3: Temporarily disable FK checks (allows deletion without handling homework)
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- STEP 4: Delete all students
-- ============================================================================
-- WARNING: This will cascade delete ALL related records!

DELETE FROM students;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- STEP 5: Verify deletion
-- ============================================================================

SELECT 
    'AFTER DELETION - VERIFICATION' as stage,
    (SELECT COUNT(*) FROM students) as remaining_students,
    (SELECT COUNT(*) FROM attendance) as remaining_attendance,
    (SELECT COUNT(*) FROM student_classes) as remaining_class_enrollments,
    (SELECT COUNT(*) FROM student_comments) as remaining_comments,
    (SELECT COUNT(*) FROM student_subjects) as remaining_subject_enrollments,
    (SELECT COUNT(*) FROM student_homework_submission) as remaining_homework,
    (SELECT COUNT(*) FROM parents_students) as remaining_parent_links;

-- ============================================================================
-- OPTIONAL: Reset AUTO_INCREMENT (uncomment if you want to reset the counter)
-- ============================================================================

-- ALTER TABLE students AUTO_INCREMENT = 1;

