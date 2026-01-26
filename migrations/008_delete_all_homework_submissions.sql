-- Script to Delete All Student Homework Submissions
-- WARNING: This will permanently delete ALL homework submission records!
-- 
-- This includes:
-- - All submission records
-- - All grades/marks
-- - All comments
-- - All file references
--
-- IMPORTANT: Backup your database before running this script!
-- This is a DESTRUCTIVE operation that cannot be undone!

-- ============================================================================
-- STEP 1: Show current count (for verification)
-- ============================================================================

SELECT 
    'BEFORE DELETION - SUMMARY' as stage,
    COUNT(*) as total_submissions,
    COUNT(DISTINCT student_id) as unique_students,
    COUNT(DISTINCT homework_id) as unique_homework_assignments,
    SUM(CASE WHEN marks IS NOT NULL THEN 1 ELSE 0 END) as graded_submissions,
    SUM(CASE WHEN file_name IS NOT NULL THEN 1 ELSE 0 END) as submissions_with_files,
    MIN(submission_date) as earliest_submission,
    MAX(submission_date) as latest_submission
FROM student_homework_submission;

-- ============================================================================
-- STEP 2: Show submissions by homework (optional - uncomment)
-- ============================================================================

-- SELECT 
--     h.homework_id,
--     h.title,
--     COUNT(shs.id) as submission_count,
--     AVG(shs.marks) as average_marks
-- FROM homework h
-- LEFT JOIN student_homework_submission shs ON h.id = shs.homework_id
-- GROUP BY h.homework_id, h.title
-- ORDER BY submission_count DESC
-- LIMIT 20;

-- ============================================================================
-- STEP 3: Show submissions by student (optional - uncomment)
-- ============================================================================

-- SELECT 
--     s.student_id,
--     s.name,
--     COUNT(shs.id) as submission_count,
--     AVG(shs.marks) as average_marks
-- FROM students s
-- LEFT JOIN student_homework_submission shs ON s.student_id = shs.student_id
-- WHERE shs.id IS NOT NULL
-- GROUP BY s.student_id, s.name
-- ORDER BY submission_count DESC
-- LIMIT 20;

-- ============================================================================
-- STEP 4: Delete all homework submissions
-- ============================================================================

DELETE FROM student_homework_submission;

-- ============================================================================
-- STEP 5: Verify deletion
-- ============================================================================

SELECT 
    'AFTER DELETION - VERIFICATION' as stage,
    COUNT(*) as remaining_submissions,
    'All homework submissions deleted successfully' as status
FROM student_homework_submission;

-- ============================================================================
-- OPTIONAL: Reset AUTO_INCREMENT (uncomment if you want to reset the counter)
-- ============================================================================

-- ALTER TABLE student_homework_submission AUTO_INCREMENT = 1;









