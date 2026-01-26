"""
Celery application configuration for scheduled tasks
"""
from celery import Celery
import os
from datetime import datetime, timedelta

# Initialize Celery
celery_app = Celery('sehan_website')

# Celery configuration
celery_app.conf.update(
    broker_url='redis://redis:6379/0',
    result_backend='redis://redis:6379/0',
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
    # Task routing
    task_routes={
        'tasks.send_session_reminder': {'queue': 'reminders'},
        'celery_tasks.process_recording': {'queue': 'recordings'},
        'celery_tasks.process_generate_student_report': {'queue': 'recordings'},
    },
    # Task name format
    task_default_queue='default',
    task_default_exchange='default',
    task_default_exchange_type='direct',
    task_default_routing_key='default',
    # Beat schedule for periodic tasks
    beat_schedule={
        'cleanup-expired-tasks': {
            'task': 'tasks.cleanup_expired_tasks',
            'schedule': 3600.0,  # Run every hour
        },
    },
)

# Import tasks to register them
# session_reminder_tasks removed - Private Tutoring feature deprecated
import celery_tasks  # noqa: F401
