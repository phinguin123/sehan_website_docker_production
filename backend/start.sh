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
while ! python3 -c "import pymysql; pymysql.connect(host='db', user='admin', password='***REMOVED-DB-PASSWORD***', database='sehanDB').close()" > /dev/null 2>&1; do
    sleep 1
done
echo "Database is ready!"

# Start the appropriate service based on command
case "$1" in
    "worker")
        echo "Starting Celery worker..."
        celery -A celery_app worker --loglevel=info --queues=reminders
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
