-- SAFE Script to Delete All Students (with detailed preview)
-- This version shows detailed information before deletion
--
-- WARNING: This will permanently delete ALL students and ALL related data!
-- This includes:
-- - All attendance records
-- - All homework submissions
-- - All class enrollments
-- - All comments
-- - All parent-student links
-- - All subject enrollments
--
-- This is IRREVERSIBLE without a backup!

-- ============================================================================
-- STEP 1: Create backup tables (RECOMMENDED - uncomment to enable)
-- ============================================================================

-- CREATE TABLE students_backup AS SELECT * FROM students;
-- CREATE TABLE attendance_backup AS SELECT * FROM attendance;
-- CREATE TABLE student_homework_submission_backup AS SELECT * FROM student_homework_submission;
-- CREATE TABLE student_classes_backup AS SELECT * FROM student_classes;
-- CREATE TABLE student_comments_backup AS SELECT * FROM student_comments;
-- CREATE TABLE student_subjects_backup AS SELECT * FROM student_subjects;
-- CREATE TABLE parents_students_backup AS SELECT * FROM parents_students;

-- ============================================================================
-- STEP 2: Show detailed impact summary
-- ============================================================================

SELECT 
    'IMPACT SUMMARY' as info,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM attendance) as attendance_records_to_delete,
    (SELECT COUNT(*) FROM student_homework_submission) as homework_submissions_to_delete,
    (SELECT COUNT(*) FROM student_classes) as class_enrollments_to_delete,
    (SELECT COUNT(*) FROM student_comments) as comments_to_delete,
    (SELECT COUNT(*) FROM student_subjects) as subject_enrollments_to_delete,
    (SELECT COUNT(*) FROM parents_students) as parent_links_to_delete;

-- ============================================================================
-- STEP 3: Show students by grade (to see distribution)
-- ============================================================================

SELECT 
    'STUDENTS BY GRADE' as info,
    grade,
    COUNT(*) as student_count,
    SUM((SELECT COUNT(*) FROM attendance WHERE student_id = s.student_id)) as total_attendance,
    SUM((SELECT COUNT(*) FROM student_homework_submission WHERE student_id = s.student_id)) as total_homework
FROM students s
GROUP BY grade
ORDER BY grade;

-- ============================================================================
-- STEP 4: Show top students by activity (to see who will be most affected)
-- ============================================================================

SELECT 
    'TOP STUDENTS BY ACTIVITY' as info,
    s.student_id,
    s.name,
    s.grade,
    COUNT(DISTINCT a.attendance_id) as attendance_count,
    COUNT(DISTINCT shs.id) as homework_count,
    COUNT(DISTINCT sc.class_id) as class_count
FROM students s
LEFT JOIN attendance a ON s.student_id = a.student_id
LEFT JOIN student_homework_submission shs ON s.student_id = shs.student_id
LEFT JOIN student_classes sc ON s.student_id = sc.student_id
GROUP BY s.student_id, s.name, s.grade
ORDER BY (attendance_count + homework_count + class_count) DESC
LIMIT 20;

-- ============================================================================
-- STEP 5: Handle student_homework_submission
-- ============================================================================
-- IMPORTANT: student_homework_submission FK doesn't have ON DELETE CASCADE
-- You must choose one of these options:

-- Option 1: Delete homework submissions first
-- DELETE FROM student_homework_submission;

-- Option 2: Set student_id to NULL (keeps homework records but unlinks them)
-- UPDATE student_homework_submission SET student_id = NULL;

-- Option 3: Temporarily disable FK checks (allows deletion)
-- SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- STEP 6: Delete all students
-- ============================================================================
-- UNCOMMENT THE LINE BELOW TO ACTUALLY DELETE
-- WARNING: This cannot be undone!

-- DELETE FROM students;

-- Re-enable FK checks if you disabled them
-- SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- STEP 7: Verify deletion (after uncommenting step 6)
-- ============================================================================

-- SELECT 
--     'VERIFICATION AFTER DELETION' as stage,
--     (SELECT COUNT(*) FROM students) as remaining_students,
--     (SELECT COUNT(*) FROM attendance) as remaining_attendance,
--     (SELECT COUNT(*) FROM student_homework_submission) as remaining_homework,
--     (SELECT COUNT(*) FROM student_classes) as remaining_enrollments,
--     (SELECT COUNT(*) FROM student_comments) as remaining_comments,
--     (SELECT COUNT(*) FROM student_subjects) as remaining_subjects,
--     (SELECT COUNT(*) FROM parents_students) as remaining_parent_links;

