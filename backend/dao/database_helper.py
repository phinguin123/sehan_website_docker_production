"""
Database helper module for managing database connections
"""
import pymysql
from secret_db_config import db_config


class DatabaseHelper:
    """Helper class for database operations"""
    
    @staticmethod
    def get_connection():
        """Get a database connection"""
        return pymysql.connect(**db_config)
    
    @staticmethod
    def execute_query(query, params=None):
        """Execute a query and return results"""
        connection = DatabaseHelper.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                if query.strip().upper().startswith('SELECT'):
                    return cursor.fetchall()
                else:
                    connection.commit()
                    return cursor.rowcount
        finally:
            connection.close()
    
    @staticmethod
    def execute_fetchone(query, params=None):
        """Execute a query and return single result"""
        connection = DatabaseHelper.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        finally:
            connection.close()
    
    @staticmethod
    def execute_fetchall(query, params=None):
        """Execute a query and return all results"""
        connection = DatabaseHelper.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        finally:
            connection.close()
