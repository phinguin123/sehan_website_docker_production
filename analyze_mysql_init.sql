-- SQL Script Analyzer for mysql-init/
-- Run this to understand your current database structure
-- Execute: mysql -u admin -p sehanDB < analyze_mysql_init.sql

USE sehanDB;

-- Show all tables
SELECT '=== ALL TABLES ===' AS '';
SHOW TABLES;

-- Show pt tables specifically
SELECT '=== PT (Private Tutoring) TABLES ===' AS '';
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'sehanDB' 
AND table_name LIKE 'pt_%'
ORDER BY table_name;

-- Count records in each pt table
SELECT '=== RECORD COUNTS ===' AS '';
SELECT 
    'pt_students' as table_name, COUNT(*) as count FROM pt_students
UNION ALL
SELECT 'pt_teachers', COUNT(*) FROM pt_teachers
UNION ALL
SELECT 'pt_subjects', COUNT(*) FROM pt_subjects
UNION ALL
SELECT 'pt_student_subjects', COUNT(*) FROM pt_student_subjects  
UNION ALL
SELECT 'pt_session_applications', COUNT(*) FROM pt_session_applications
UNION ALL
SELECT 'pt_sessions', COUNT(*) FROM pt_sessions
UNION ALL
SELECT 'pt_session_audit', COUNT(*) FROM pt_session_audit
UNION ALL
SELECT 'pt_application_ledger', COUNT(*) FROM pt_application_ledger;

-- Show table structures
SELECT '=== TABLES WITH DEFINITIONS ===' AS '';
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sehanDB'
AND TABLE_NAME LIKE 'pt_%'
ORDER BY TABLE_NAME, ORDINAL_POSITION;















