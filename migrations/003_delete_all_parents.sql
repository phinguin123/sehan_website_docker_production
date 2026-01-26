-- Script to Delete All Parents
-- WARNING: This will permanently delete all parent records and their relationships
-- The parents_students table has ON DELETE CASCADE, so those records will be deleted automatically
--
-- IMPORTANT: Backup your database before running this script!

-- ============================================================================
-- STEP 1: Show current count (for verification)
-- ============================================================================

SELECT 
    COUNT(*) as total_parents,
    COUNT(DISTINCT ps.student_id) as students_with_parents
FROM parents p
LEFT JOIN parents_students ps ON p.parent_id = ps.parent_id;

-- ============================================================================
-- STEP 2: Show sample of what will be deleted (optional - uncomment to see)
-- ============================================================================

-- SELECT 
--     p.parent_id,
--     p.parent_name,
--     p.email,
--     COUNT(ps.student_id) as linked_students
-- FROM parents p
-- LEFT JOIN parents_students ps ON p.parent_id = ps.parent_id
-- GROUP BY p.parent_id, p.parent_name, p.email
-- LIMIT 20;

-- ============================================================================
-- STEP 3: Delete all parents
-- ============================================================================

-- This will also cascade delete all records in parents_students table
DELETE FROM parents;

-- ============================================================================
-- STEP 4: Verify deletion
-- ============================================================================

SELECT 
    COUNT(*) as remaining_parents,
    'All parents deleted successfully' as status
FROM parents;

SELECT 
    COUNT(*) as remaining_parent_student_links,
    'All parent-student links deleted successfully' as status
FROM parents_students;

-- ============================================================================
-- OPTIONAL: Reset AUTO_INCREMENT (uncomment if you want to reset the counter)
-- ============================================================================

-- ALTER TABLE parents AUTO_INCREMENT = 1;
-- ALTER TABLE parents_students AUTO_INCREMENT = 1;









