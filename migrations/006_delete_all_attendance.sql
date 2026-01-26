-- Script to Delete All Attendance Records
-- WARNING: This will permanently delete ALL attendance records!
-- 
-- This is useful when starting completely fresh.
-- After deletion, you can recreate attendance as students attend classes.
--
-- IMPORTANT: Backup your database before running this script!

-- ============================================================================
-- STEP 1: Show current count (for verification)
-- ============================================================================

SELECT 
    'BEFORE DELETION - SUMMARY' as stage,
    COUNT(*) as total_attendance_records,
    COUNT(DISTINCT student_id) as unique_students,
    COUNT(DISTINCT subject_name) as unique_subjects,
    MIN(attendance_date) as earliest_date,
    MAX(attendance_date) as latest_date,
    COUNT(DISTINCT attendance_date) as unique_dates
FROM attendance;

-- ============================================================================
-- STEP 2: Show attendance by status (optional - uncomment)
-- ============================================================================

-- SELECT 
--     status,
--     COUNT(*) as count
-- FROM attendance
-- GROUP BY status
-- ORDER BY count DESC;

-- ============================================================================
-- STEP 3: Show attendance by date range (optional - uncomment)
-- ============================================================================

-- SELECT 
--     DATE_FORMAT(attendance_date, '%Y-%m') as month,
--     COUNT(*) as records
-- FROM attendance
-- GROUP BY DATE_FORMAT(attendance_date, '%Y-%m')
-- ORDER BY month DESC;

-- ============================================================================
-- STEP 4: Delete all attendance records
-- ============================================================================

DELETE FROM attendance;

-- ============================================================================
-- STEP 5: Verify deletion
-- ============================================================================

SELECT 
    'AFTER DELETION - VERIFICATION' as stage,
    COUNT(*) as remaining_attendance_records,
    'All attendance records deleted successfully' as status
FROM attendance;

-- ============================================================================
-- OPTIONAL: Reset AUTO_INCREMENT (uncomment if you want to reset the counter)
-- ============================================================================

-- ALTER TABLE attendance AUTO_INCREMENT = 1;









