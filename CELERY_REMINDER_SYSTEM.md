# Celery-Based Session Reminder System

## Overview

This implementation provides a robust, scalable solution for sending session reminders using Celery and Redis. The system automatically schedules reminders when sessions are created and handles rescheduling/cancellation seamlessly.

## Architecture

### Components

1. **Celery**: Task queue system for background job processing
2. **Redis**: In-memory database serving as message broker
3. **Celery Beat**: Scheduler for periodic tasks
4. **Flower**: Web-based monitoring tool for Celery tasks

### Workflow

```
Session Created → Schedule Reminder Task → Redis Queue → Celery Worker → Send Reminder
```

## Features

✅ **Automatic Reminder Scheduling**: Reminders are automatically scheduled when sessions are created  
✅ **Rescheduling Support**: When sessions are moved, reminders are automatically rescheduled  
✅ **Cancellation Handling**: Cancelled sessions trigger immediate notifications  
✅ **Robust Error Handling**: Tasks retry on failure with exponential backoff  
✅ **Monitoring**: Flower provides real-time task monitoring  
✅ **Scalable**: Can handle multiple workers and queues  

## Setup Instructions

### 1. Run the Setup Script

```bash
# From the project root directory
./setup_celery_reminders.sh
```

This script will:
- Build all Docker containers
- Start Redis, Celery workers, and beat scheduler
- Wait for all services to be ready
- Display access points and useful commands

### 2. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Stop existing containers
docker-compose down

# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps
```

## Service Access Points

- **Main Application**: http://localhost:80
- **Backend API**: http://localhost:5000
- **Flower (Celery Monitor)**: http://localhost:5555
- **Redis**: localhost:6379
- **MySQL**: localhost:3306

## API Integration

### Creating a Schedule with Reminder

```bash
POST /api/schedules
{
  "application_id": 1,
  "student_id": 123,
  "teacher_id": 456,
  "subject_id": 789,
  "scheduled_time": "2025-01-25T14:00:00Z",
  "scheduled_duration": 1.0,
  "notes": "Math tutoring session"
}
```

**Response:**
```json
{
  "schedule_id": 1,
  "message": "Schedule created successfully",
  "reminder_scheduled": true,
  "reminder_task_id": "abc123-def456-ghi789"
}
```

### Updating a Schedule

```bash
PUT /api/schedules/1
{
  "scheduled_time": "2025-01-25T16:00:00Z",
  // ... other fields
}
```

**Response:**
```json
{
  "message": "Schedule updated successfully",
  "reminder_rescheduled": true,
  "new_reminder_task_id": "xyz789-uvw456-rst123"
}
```

### Cancel Schedule (No Notification Sent)

```bash
DELETE /api/schedules/1
```

**Response:**
```json
{
  "message": "Schedule cancelled successfully",
  "reminder_cancelled": true
}
```

## Configuration

### Reminder Timing

By default, reminders are sent **24 hours** before the session. You can customize this in the schedule creation:

```python
reminder_result = reminder_service.schedule_reminder(
    schedule_id=schedule_id,
    session_datetime=scheduled_time,
    reminder_hours_before=48  # Send reminder 48 hours before
)
```

### Notification Methods

The system uses **Kakao AlimTalk** for sending session reminders:

- **Session Reminders**: Sent 24 hours before scheduled sessions
- **No Cancellation Messages**: Cancelled sessions do not trigger notifications (as requested)
- **Korean Language**: All messages are sent in Korean for Korean families
- **Template Integration**: Uses existing Kakao AlimTalk templates

The notification function is implemented in:
- `send_pt_session_reminder()` - For session reminders only

## Monitoring

### Flower Dashboard

Access Flower at http://localhost:5555 to:
- View active tasks
- Monitor task success/failure rates
- Inspect task details and results
- View worker status

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f celery-worker
docker-compose logs -f celery-beat
docker-compose logs -f redis
```

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check service status
   docker-compose ps
   
   # View logs for errors
   docker-compose logs celery-worker
   ```

2. **Redis connection issues**
   ```bash
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   ```

3. **Database connection issues**
   ```bash
   # Test database connection
   docker-compose exec db mysqladmin ping -h localhost -u admin -p'***REMOVED-DB-PASSWORD***'
   ```

4. **Tasks not executing**
   - Check Flower dashboard for task status
   - Verify worker is running: `docker-compose logs celery-worker`
   - Check Redis queue: `docker-compose exec redis redis-cli llen reminders`

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart celery-worker
```

## Development

### Adding New Task Types

1. Create new task in `tasks/session_reminder_tasks.py`:
   ```python
   @celery_app.task(name='tasks.new_task')
   def new_task(param1, param2):
       # Task implementation
       pass
   ```

2. Add to service in `services/session_reminder_service.py`:
   ```python
   def schedule_new_task(self, param1, param2):
       task = new_task.apply_async(args=[param1, param2])
       return {'task_id': task.id}
   ```

### Testing

```bash
# Test reminder system
curl -X POST http://localhost:5000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "application_id": 1,
    "student_id": 123,
    "teacher_id": 456,
    "subject_id": 789,
    "scheduled_time": "2025-01-25T14:00:00Z",
    "scheduled_duration": 1.0
  }'
```

## Production Considerations

1. **Redis Persistence**: Redis is configured with AOF (Append Only File) for durability
2. **Worker Scaling**: Add more worker containers for higher throughput
3. **Monitoring**: Set up proper logging and alerting
4. **Security**: Secure Redis and Flower access in production
5. **Backup**: Regular backups of Redis and MySQL data

## File Structure

```
backend/
├── celery_app.py                 # Celery application configuration
├── tasks/
│   ├── __init__.py
│   └── session_reminder_tasks.py # Celery tasks
├── services/
│   ├── __init__.py
│   └── session_reminder_service.py # Reminder service
├── blueprints/private_tutoring/routes/
│   └── schedules.py              # Updated with reminder integration
└── start.sh                     # Startup script

docker-compose.yml               # Updated with Celery services
setup_celery_reminders.sh        # Setup script
```

## Benefits

1. **Reliability**: Tasks are persisted in Redis and retry on failure
2. **Scalability**: Can easily add more workers as needed
3. **Monitoring**: Real-time visibility into task execution
4. **Flexibility**: Easy to add new notification methods
5. **Maintainability**: Clean separation of concerns

This implementation provides a production-ready solution for session reminders that can scale with your tutoring business needs.
