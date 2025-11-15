# Quick Reference: Celery Session Reminder System

## 🚀 Quick Start

```bash
# Setup everything
./setup_celery_reminders.sh

# Test the system
python3 test_reminder_system.py
```

## 📊 Monitor Tasks

- **Flower Dashboard**: http://localhost:5555
- **View Logs**: `docker-compose logs -f celery-worker`

## 🔧 Key Commands

```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# Restart workers
docker-compose restart celery-worker

# View logs
docker-compose logs -f celery-worker
docker-compose logs -f celery-beat
```

## 📝 API Usage

### Create Schedule with Reminder
```bash
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

### Update Schedule (Reschedules Reminder)
```bash
curl -X PUT http://localhost:5000/api/schedules/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scheduled_time": "2025-01-25T16:00:00Z"
  }'
```

### Cancel Schedule (No Notification Sent)
```bash
curl -X DELETE http://localhost:5000/api/schedules/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Services won't start | `docker-compose logs` |
| Redis connection failed | `docker-compose exec redis redis-cli ping` |
| Tasks not executing | Check Flower dashboard |
| Database connection failed | `docker-compose exec db mysqladmin ping -h localhost -u admin -p'***REMOVED-DB-PASSWORD***'` |

## 📁 Key Files

- `backend/celery_app.py` - Celery configuration
- `backend/tasks/session_reminder_tasks.py` - Reminder tasks
- `backend/services/session_reminder_service.py` - Service layer
- `docker-compose.yml` - Updated with Celery services
- `CELERY_REMINDER_SYSTEM.md` - Full documentation

## ⚙️ Configuration

- **Reminder Timing**: 24 hours before session (configurable)
- **Retry Policy**: 3 retries with 60-second intervals
- **Queues**: `reminders`, `notifications`
- **Monitoring**: Flower on port 5555
- **Notifications**: Kakao AlimTalk integration (reminders only)
- **Language**: Korean messages for Korean families
- **Cancellation**: No messages sent for cancelled sessions

## 🎯 How It Works

1. **Session Created** → Schedule reminder task in Redis
2. **Celery Beat** → Monitors scheduled tasks
3. **Celery Worker** → Executes reminder at scheduled time
4. **Task** → Checks if session still active, sends reminder
5. **Reschedule** → Updates reminder task
6. **Cancel** → Cancels reminder task (no notification sent)

## 📞 Support

- Check logs: `docker-compose logs -f`
- Monitor tasks: http://localhost:5555
- Test system: `python3 test_reminder_system.py`
