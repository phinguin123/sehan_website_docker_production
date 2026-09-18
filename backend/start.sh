#!/bin/bash
# Startup script for Celery services

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! python3 -c "import redis; r = redis.Redis(host='redis', port=6379); r.ping()" > /dev/null 2>&1; do
    sleep 1
done
echo "Redis is ready!"

# Wait for database to be ready
echo "Waiting for database to be ready..."
# Use environment variables for database connection (supports both local Docker and RDS)
DB_HOST="${DATABASE_HOST:-db}"
DB_USER="${MYSQL_USER:-admin}"
DB_PASSWORD="${MYSQL_PASSWORD:?MYSQL_PASSWORD is not set}"
DB_NAME="${MYSQL_DATABASE:-sehanDB}"
DB_PORT="${DATABASE_PORT:-3306}"

# Add timeout to prevent infinite hanging (max 60 seconds)
TIMEOUT=60
ELAPSED=0
while ! python3 -c "
import pymysql
import sys
try:
    conn = pymysql.connect(
        host='$DB_HOST',
        user='$DB_USER',
        password='$DB_PASSWORD',
        database='$DB_NAME',
        port=$DB_PORT,
        connect_timeout=5
    )
    conn.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" > /dev/null 2>&1; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo "⚠️  Warning: Database connection timeout after ${TIMEOUT}s. Continuing anyway..."
        break
    fi
done
if [ $ELAPSED -lt $TIMEOUT ]; then
    echo "Database is ready!"
fi

# Start the appropriate service based on command
case "$1" in
    "worker")
        echo "Starting Celery worker..."
        # Process both reminder and recording tasks
        celery -A celery_app worker --loglevel=info --queues=reminders,recordings
        ;;
    "beat")
        echo "Starting Celery beat scheduler..."
        celery -A celery_app beat --loglevel=info
        ;;
    "flower")
        echo "Starting Flower monitoring..."
        celery -A celery_app flower --port=5555
        ;;
    *)
        echo "Starting Flask application..."
        flask run --host=0.0.0.0 --port=5000
        ;;
esac
