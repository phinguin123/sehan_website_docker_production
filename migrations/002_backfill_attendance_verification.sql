-- Verification and cleanup script for attendance denormalization
-- Run this after migration 001 to verify data integrity

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- 1. Check backfill success rate
SELECT 
    COUNT(*) as total_records,
    SUM(CASE WHEN class_id IS NOT NULL THEN 1 ELSE 0 END) as backfilled_records,
    SUM(CASE WHEN class_id IS NULL THEN 1 ELSE 0 END) as orphaned_records,
    ROUND(SUM(CASE WHEN class_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as backfill_percentage
FROM attendance;

-- 2. Check records with NULL timetable_id but populated denormalized fields
SELECT 
    COUNT(*) as records_without_timetable_id
FROM attendance
WHERE timetable_id IS NULL 
  AND class_id IS NOT NULL;

-- 3. Check for orphaned records (no timetable_id and no class_id)
SELECT 
    attendance_id, 
    student_id, 
    subject_name, 
    level, 
    attendance_date,
    status,
    created_at
FROM attendance 
WHERE class_id IS NULL 
  AND timetable_id IS NULL
ORDER BY attendance_date DESC, created_at DESC
LIMIT 100;

-- 4. Check data consistency: subject_name vs subject_id
SELECT 
    a.attendance_id,
    a.subject_name,
    s.subject_name as subject_name_from_id,
    a.subject_id
FROM attendance a
LEFT JOIN subjects s ON a.subject_id = s.subject_id
WHERE a.subject_id IS NOT NULL
  AND a.subject_name != s.subject_name
LIMIT 50;

-- 5. Check data consistency: level string vs level_id
SELECT 
    a.attendance_id,
    a.level,
    l.level_name,
    a.level_id
FROM attendance a
LEFT JOIN levels l ON a.level_id = l.id
WHERE a.level_id IS NOT NULL
  AND (
    (a.level = 'SL' AND l.level_name != 'SL') OR
    (a.level = 'HL' AND l.level_name != 'HL') OR
    (a.level IN ('SL/HL', 'SL,HL') AND l.level_name != 'SL/HL')
  )
LIMIT 50;

-- 6. Check for records missing critical fields
SELECT 
    COUNT(*) as records_missing_critical_fields
FROM attendance
WHERE class_id IS NULL 
   OR subject_id IS NULL 
   OR level_id IS NULL
   OR mode_id IS NULL
   OR grade_id IS NULL;

-- ============================================================================
-- Optional: Manual cleanup for orphaned records
-- ============================================================================

-- If you have orphaned records, you can try to match them manually
-- This query helps identify potential matches
-- SELECT 
--     a.attendance_id,
--     a.student_id,
--     a.subject_name,
--     a.level,
--     a.attendance_date,
--     s.subject_id,
--     l.id as level_id,
--     sc.class_id,
--     c.mode_id,
--     c.grade_id
-- FROM attendance a
-- LEFT JOIN subjects s ON a.subject_name = s.subject_name
-- LEFT JOIN levels l ON (
--     CASE 
--         WHEN a.level = 'SL' THEN l.level_name = 'SL'
--         WHEN a.level = 'HL' THEN l.level_name = 'HL'
--         WHEN a.level IN ('SL/HL', 'SL,HL') THEN l.level_name = 'SL/HL'
--         ELSE FALSE
--     END
-- )
-- LEFT JOIN student_classes sc ON sc.student_id = a.student_id
-- LEFT JOIN classes c ON sc.class_id = c.class_id 
--     AND c.subject_id = s.subject_id 
--     AND c.level_id = l.id
-- WHERE a.class_id IS NULL
--   AND s.subject_id IS NOT NULL
--   AND l.id IS NOT NULL
--   AND c.class_id IS NOT NULL
-- LIMIT 100;









