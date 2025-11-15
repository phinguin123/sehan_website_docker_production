import pymysql
from pymysql.cursors import DictCursor
import os

# Local MySQL Configuration
LOCAL_DB_HOST = os.environ.get("DATABASE_HOST", "db")  # 'db' is the service name in docker-compose
LOCAL_DB_USER = os.environ.get("MYSQL_USER", "admin")
LOCAL_DB_PASSWORD = os.environ.get("MYSQL_PASSWORD", "***REMOVED-DB-PASSWORD***")
LOCAL_DB_DATABASE = os.environ.get("MYSQL_DATABASE", "sehanDB")
LOCAL_DB_PORT = int(os.environ.get("DATABASE_PORT", "3306"))

class DBHelper:
    def __init__(self):
        self.host = LOCAL_DB_HOST
        self.user = LOCAL_DB_USER
        self.password = LOCAL_DB_PASSWORD
        self.database = LOCAL_DB_DATABASE
        self.port = LOCAL_DB_PORT

    def get_connection(self):
        return pymysql.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
            port=self.port,
            cursorclass=DictCursor,
            charset='utf8mb4',
            init_command="SET time_zone = '+09:00'",
        )

    def fetch_all(self, query, params=None):
        connection = self.get_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        finally:
            connection.close()

    def fetch_one(self, query, params=None):
        connection = self.get_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        finally:
            connection.close()

    def execute(self, query, params=None, connection=None, return_id=False):
        own_connection = False
        if connection is None:
            connection = self.get_connection()
            print(
                "Trying to execute with local MySQL at",
                f"{self.host}:{self.port}",
            )
            own_connection = True

        try:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                if own_connection:
                    connection.commit()
                if return_id:
                    return cursor.lastrowid
                return cursor.rowcount
        finally:
            if own_connection:
                connection.close()

    def begin_transaction(self):
        """Start a new transaction and return the connection"""
        connection = self.get_connection()
        connection.begin()
        return connection

    def commit_transaction(self, connection):
        """Commit the transaction and close the connection"""
        try:
            connection.commit()
        finally:
            connection.close()

    def rollback_transaction(self, connection):
        """Rollback the transaction and close the connection"""
        try:
            connection.rollback()
        finally:
            connection.close()

    def execute_in_transaction(self, connection, query, params=None, return_id=False):
        """Execute a query within an existing transaction"""
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            if return_id:
                return cursor.lastrowid
            return cursor.rowcount

    def fetch_one_in_transaction(self, connection, query, params=None):
        """Fetch one record within an existing transaction"""
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()

    def fetch_all_in_transaction(self, connection, query, params=None):
        """Fetch all records within an existing transaction"""
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()
