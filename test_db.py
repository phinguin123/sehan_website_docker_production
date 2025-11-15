#!/usr/bin/env python3
"""
Database Connection Test Script
This script tests the connection to the local MySQL database
"""

import os
import sys
import pymysql
from pymysql.cursors import DictCursor

# Load env from env.local if present
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), 'env.local')
    if os.path.exists(env_path):
        load_dotenv(env_path)
except Exception:
    pass

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_database_connection():
    """Test the database connection using the updated configuration"""
    
    # Import the database helper
    try:
        from utils.db import DBHelper
    except ImportError as e:
        print(f"❌ Error importing DBHelper: {e}")
        return False
    
    # Create database helper instance
    db_helper = DBHelper()
    
    # Override host for local testing (when not running in Docker)
    if db_helper.host == 'db':
        db_helper.host = 'localhost'
    
    print("🔍 Testing database connection...")
    print(f"   Host: {db_helper.host}")
    print(f"   Port: {db_helper.port}")
    print(f"   Database: {db_helper.database}")
    print(f"   User: {db_helper.user}")
    
    try:
        # Test connection
        connection = db_helper.get_connection()
        print("✅ Database connection successful!")
        
        # Test a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION() as version")
            result = cursor.fetchone()
            print(f"✅ MySQL Version: {result['version']}")
            
            # Test if our tables exist
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"✅ Found {len(tables)} tables in database")
            
            if tables:
                print("📋 Tables found:")
                for table in tables:
                    table_name = list(table.values())[0]
                    print(f"   - {table_name}")
        
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_sample_data():
    """Test if sample data exists"""
    
    try:
        from utils.db import DBHelper
        db_helper = DBHelper()
        
        print("\n🔍 Testing sample data...")
        
        # Test students table
        students = db_helper.fetch_all("SELECT COUNT(*) as count FROM students")
        if students:
            print(f"✅ Students table has {students[0]['count']} records")
        
        # Test teachers table
        teachers = db_helper.fetch_all("SELECT COUNT(*) as count FROM teachers")
        if teachers:
            print(f"✅ Teachers table has {teachers[0]['count']} records")
        
        # Test parents table
        parents = db_helper.fetch_all("SELECT COUNT(*) as count FROM parents")
        if parents:
            print(f"✅ Parents table has {parents[0]['count']} records")
            
    except Exception as e:
        print(f"❌ Error testing sample data: {e}")

if __name__ == "__main__":
    print("🚀 Database Connection Test for Sehan Website")
    print("=" * 50)
    
    # Test connection
    if test_database_connection():
        # Test sample data
        test_sample_data()
        print("\n✅ All tests passed! Your local MySQL database is working correctly.")
    else:
        print("\n❌ Database connection failed. Please check your setup.")
        print("\n💡 Troubleshooting tips:")
        print("   1. Make sure Docker is running")
        print("   2. Run: ./manage_db.sh start")
        print("   3. Check if the MySQL container is running: ./manage_db.sh status")
        print("   4. View logs: ./manage_db.sh logs")
