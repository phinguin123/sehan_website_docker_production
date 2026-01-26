#!/bin/bash
# Script to clean up old recording files and restart celery worker

echo "🧹 Cleaning up old recording files..."

# Find and list old MP4 files in backend directory (older than 7 days)
echo "Finding MP4 files older than 7 days in backend directory..."
find /home/ubuntu/sehan_website_docker_production/backend -name "*.mp4" -type f -mtime +7 -ls

# Ask for confirmation before deleting
read -p "Do you want to delete these old MP4 files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting old MP4 files..."
    find /home/ubuntu/sehan_website_docker_production/backend -name "*.mp4" -type f -mtime +7 -delete
    echo "✅ Cleanup complete"
else
    echo "❌ Cleanup cancelled"
    exit 1
fi

# Create recordings directory if it doesn't exist
echo "Creating recordings directory..."
mkdir -p /home/ubuntu/sehan_website/recordings
chmod 755 /home/ubuntu/sehan_website/recordings

# Restart celery worker
echo "Restarting celery-worker container..."
cd /home/ubuntu/sehan_website_docker_production
docker compose restart celery-worker

echo "✅ Done! Check logs with: docker logs -f celery_worker"


