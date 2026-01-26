-- Script to Delete All Timetable Entries
-- Purpose: Start fresh with timetable scheduling
--
-- IMPORTANT: With denormalization, deleting timetable will NOT delete attendance records!
-- Historical attendance records now store all class context directly in the attendance table.
--
-- However, timetable is still needed for:
-- - Current class lookups (what class is happening right now)
-- - Student timetable display
-- - Admin timetable management
-- - New attendance submissions (to get class context)
--
-- After deleting, you'll need to recreate the timetable via AdminTimetableSettingsPage

-- ============================================================================
-- STEP 1: Show current timetable count
-- ============================================================================

SELECT 
    'BEFORE DELETION' as stage,
    COUNT(*) as total_timetable_entries,
    COUNT(DISTINCT class_id) as unique_classes,
    COUNT(DISTINCT day_id) as days_with_classes,
    COUNT(DISTINCT time_slot_id) as time_slots_used
FROM timetable;

-- ============================================================================
-- STEP 2: Show timetable by grade and mode (optional - uncomment)
-- ============================================================================

-- SELECT 
--     g.grade,
--     m.mode_name,
--     COUNT(*) as timetable_count
-- FROM timetable t
-- JOIN classes c ON t.class_id = c.class_id
-- JOIN grades g ON c.grade_id = g.grade_id
-- JOIN modes m ON c.mode_id = m.mode_id
-- GROUP BY g.grade, m.mode_name
-- ORDER BY g.grade, m.mode_name;

-- ============================================================================
-- STEP 3: Show impact on attendance records
-- ============================================================================

SELECT 
    'ATTENDANCE RECORDS STATUS' as info,
    COUNT(*) as total_attendance_records,
    SUM(CASE WHEN timetable_id IS NOT NULL THEN 1 ELSE 0 END) as records_with_timetable_id,
    SUM(CASE WHEN class_id IS NOT NULL THEN 1 ELSE 0 END) as records_with_denormalized_data,
    SUM(CASE WHEN timetable_id IS NULL AND class_id IS NOT NULL THEN 1 ELSE 0 END) as records_independent_of_timetable
FROM attendance;

-- ============================================================================
-- STEP 4: Delete all timetable entries
-- ============================================================================

DELETE FROM timetable;

-- ============================================================================
-- STEP 5: Optionally delete time_slots (if you want to start completely fresh)
-- ============================================================================
-- Uncomment if you also want to delete time slots
-- DELETE FROM time_slots;

-- ============================================================================
-- STEP 6: Verify deletion
-- ============================================================================

SELECT 
    'AFTER DELETION' as stage,
    COUNT(*) as remaining_timetable_entries
FROM timetable;

-- Verify attendance records are still intact
SELECT 
    'ATTENDANCE RECORDS AFTER TIMETABLE DELETION' as info,
    COUNT(*) as total_attendance_records,
    SUM(CASE WHEN class_id IS NOT NULL THEN 1 ELSE 0 END) as records_with_denormalized_data,
    'All attendance records remain intact!' as status
FROM attendance;

-- ============================================================================
-- OPTIONAL: Reset AUTO_INCREMENT (uncomment if you want to reset the counter)
-- ============================================================================

-- ALTER TABLE timetable AUTO_INCREMENT = 1;
-- ALTER TABLE time_slots AUTO_INCREMENT = 1;









