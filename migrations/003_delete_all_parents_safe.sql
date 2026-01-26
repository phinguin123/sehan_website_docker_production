-- SAFE Script to Delete All Parents (with backup option)
-- This version includes a backup step before deletion
--
-- WARNING: This will permanently delete all parent records!

-- ============================================================================
-- STEP 1: Create backup table (optional - uncomment to enable backup)
-- ============================================================================

-- Create backup of parents table
-- CREATE TABLE parents_backup_$(date +%Y%m%d) AS SELECT * FROM parents;
-- CREATE TABLE parents_students_backup_$(date +%Y%m%d) AS SELECT * FROM parents_students;

-- Or use this simpler version:
-- CREATE TABLE parents_backup AS SELECT * FROM parents;
-- CREATE TABLE parents_students_backup AS SELECT * FROM parents_students;

-- ============================================================================
-- STEP 2: Show current count
-- ============================================================================

SELECT 
    'BEFORE DELETION' as stage,
    COUNT(*) as total_parents,
    COUNT(DISTINCT ps.student_id) as students_with_parents
FROM parents p
LEFT JOIN parents_students ps ON p.parent_id = ps.parent_id;

-- ============================================================================
-- STEP 3: Show what will be deleted
-- ============================================================================

SELECT 
    'PARENTS TO BE DELETED' as info,
    p.parent_id,
    p.parent_name,
    p.email,
    COUNT(ps.student_id) as linked_students
FROM parents p
LEFT JOIN parents_students ps ON p.parent_id = ps.parent_id
GROUP BY p.parent_id, p.parent_name, p.email
ORDER BY p.parent_id;

-- ============================================================================
-- STEP 4: Delete all parents
-- ============================================================================
-- UNCOMMENT THE LINE BELOW TO ACTUALLY DELETE
-- DELETE FROM parents;

-- ============================================================================
-- STEP 5: Verify deletion (after uncommenting step 4)
-- ============================================================================

-- SELECT 
--     'AFTER DELETION' as stage,
--     COUNT(*) as remaining_parents
-- FROM parents;

-- SELECT 
--     'AFTER DELETION' as stage,
--     COUNT(*) as remaining_parent_student_links
-- FROM parents_students;









