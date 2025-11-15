#!/usr/bin/env python3
"""
Test script for foreign key constraint implementation
This script tests the teacher deletion prevention functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from utils.db import DBHelper
from dao.private_tutoring.pt_teacher_dao import PTTeacherDAO

def test_foreign_key_constraint():
    """Test the foreign key constraint implementation"""
    print("Testing Foreign Key Constraint Implementation")
    print("=" * 50)
    
    db = DBHelper()
    
    try:
        # Test 1: Check if foreign key constraint exists
        print("\n1. Checking if foreign key constraint exists...")
        constraint_query = """
        SELECT 
            CONSTRAINT_NAME,
            TABLE_NAME,
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME,
            DELETE_RULE
        FROM information_schema.KEY_COLUMN_USAGE kcu
        JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
            ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        WHERE kcu.TABLE_SCHEMA = 'sehanDB' 
            AND kcu.TABLE_NAME = 'pt_schedules'
            AND kcu.COLUMN_NAME = 'teacher_id'
        """
        
        constraint_result = db.fetch_one(constraint_query)
        if constraint_result:
            print(f"✓ Foreign key constraint found: {constraint_result['CONSTRAINT_NAME']}")
            print(f"  - References: {constraint_result['REFERENCED_TABLE_NAME']}.{constraint_result['REFERENCED_COLUMN_NAME']}")
            print(f"  - Delete rule: {constraint_result['DELETE_RULE']}")
        else:
            print("✗ Foreign key constraint not found!")
            return False
        
        # Test 2: Check if teacher_id column exists in pt_schedules
        print("\n2. Checking if teacher_id column exists in pt_schedules...")
        column_query = """
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'sehanDB' 
            AND TABLE_NAME = 'pt_schedules' 
            AND COLUMN_NAME = 'teacher_id'
        """
        
        column_result = db.fetch_one(column_query)
        if column_result:
            print(f"✓ teacher_id column found: {column_result['DATA_TYPE']}, nullable: {column_result['IS_NULLABLE']}")
        else:
            print("✗ teacher_id column not found!")
            return False
        
        # Test 3: Test teacher deletion with dependencies
        print("\n3. Testing teacher deletion with dependencies...")
        
        # Get a teacher with schedules
        teacher_with_schedules_query = """
        SELECT DISTINCT pt.teacher_id, pt.name, COUNT(sc.schedule_id) as schedule_count
        FROM pt_teachers pt
        JOIN pt_schedules sc ON pt.teacher_id = sc.teacher_id
        WHERE sc.status = 'scheduled'
        GROUP BY pt.teacher_id, pt.name
        LIMIT 1
        """
        
        teacher_result = db.fetch_one(teacher_with_schedules_query)
        if teacher_result:
            teacher_id = teacher_result['teacher_id']
            teacher_name = teacher_result['name']
            schedule_count = teacher_result['schedule_count']
            
            print(f"Testing deletion of teacher: {teacher_name} (ID: {teacher_id})")
            print(f"  - Has {schedule_count} scheduled sessions")
            
            # Test the DAO method
            result = PTTeacherDAO.delete_teacher(teacher_id)
            
            if result['status'] == 'error':
                print(f"✓ Deletion correctly prevented: {result['message']}")
            else:
                print(f"✗ Deletion should have been prevented but wasn't!")
                return False
        else:
            print("No teachers with scheduled sessions found for testing")
        
        # Test 4: Test teacher dependencies method
        print("\n4. Testing teacher dependencies method...")
        if teacher_result:
            dependencies_result = PTTeacherDAO.get_teacher_dependencies(teacher_id)
            
            if dependencies_result['status'] == 'success':
                deps = dependencies_result['dependencies']
                print(f"✓ Dependencies retrieved for {deps['teacher_name']}:")
                print(f"  - Active sessions: {deps['active_sessions']['count']}")
                print(f"  - Scheduled sessions: {deps['scheduled_sessions']['count']}")
                print(f"  - Can delete: {deps['can_delete']}")
                
                if deps['scheduled_sessions']['count'] > 0:
                    print("  - Upcoming sessions:")
                    for session in deps['scheduled_sessions']['details'][:3]:  # Show first 3
                        print(f"    * {session['scheduled_time']} - {session['student_name']} ({session['subject_name']})")
            else:
                print(f"✗ Failed to get dependencies: {dependencies_result['message']}")
                return False
        
        print("\n✓ All tests passed! Foreign key constraint implementation is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed with error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_foreign_key_constraint()
    sys.exit(0 if success else 1)
