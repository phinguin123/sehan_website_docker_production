#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from utils.db import DBHelper

def test_db_connection():
    """Test database connection and fetch_one method"""
    print("Testing database connection...")
    
    try:
        db = DBHelper()
        
        # Test a simple query
        query = "SELECT 1 as test_value"
        result = db.fetch_one(query)
        
        print(f"Query: {query}")
        print(f"Result type: {type(result)}")
        print(f"Result: {result}")
        
        if isinstance(result, dict):
            print("✓ fetch_one returns a dictionary (correct)")
            print(f"✓ Can access by key: {result.get('test_value')}")
        else:
            print("✗ fetch_one returns a tuple (incorrect)")
            print(f"✗ Cannot access by key, result is: {result}")
            
        # Test the actual teacher query
        print("\nTesting teacher query...")
        teacher_query = """
        SELECT teacher_id, name, username, password_hash
        FROM pt_teachers
        WHERE username = %s
        """
        
        # Test with a non-existent username first
        result = db.fetch_one(teacher_query, ('nonexistent',))
        print(f"Teacher query result type: {type(result)}")
        print(f"Teacher query result: {result}")
        
        if result and isinstance(result, dict):
            print("✓ Teacher query returns dictionary")
            print(f"✓ Teacher ID: {result.get('teacher_id')}")
        elif result and isinstance(result, tuple):
            print("✗ Teacher query returns tuple")
            print(f"✗ Cannot access teacher_id, result is: {result}")
        else:
            print("✓ Teacher query returns None (no results)")
            
    except Exception as e:
        print(f"Error testing database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_db_connection()
