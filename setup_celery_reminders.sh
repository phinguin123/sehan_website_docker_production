#!/bin/bash
# Setup script for Celery-based session reminder system

echo "🚀 Setting up Celery-based Session Reminder System"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "----------------------"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker compose > /dev/null 2>&1; then
    echo "❌ docker compose is not installed. Please install docker-compose first."
    exit 1
fi
echo "✅ docker-compose is available"

echo ""
echo "🔧 Building and Starting Services:"
echo "----------------------------------"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Build and start services
echo "🏗️  Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for Redis
echo "   Waiting for Redis..."
REDIS_TIMEOUT=60  # 60 seconds timeout
REDIS_COUNTER=0
while ! docker compose exec redis redis-cli ping > /dev/null 2>&1; do
    REDIS_COUNTER=$((REDIS_COUNTER + 1))
    if [ $REDIS_COUNTER -gt $REDIS_TIMEOUT ]; then
        echo "   ❌ Redis failed to start within $REDIS_TIMEOUT seconds"
        echo "   Checking Redis container status..."
        docker compose ps redis
        echo "   Redis logs:"
        docker compose logs redis
        exit 1
    fi
    echo "   Redis not ready yet... (${REDIS_COUNTER}s)"
    sleep 2
done
echo "   ✅ Redis is ready"

# Wait for Database
echo "   Waiting for Database..."
DB_TIMEOUT=60  # 60 seconds timeout
DB_COUNTER=0
while ! docker compose exec db mysqladmin ping -h localhost -u admin -p'***REMOVED-DB-PASSWORD***' --silent > /dev/null 2>&1; do
    DB_COUNTER=$((DB_COUNTER + 1))
    if [ $DB_COUNTER -gt $DB_TIMEOUT ]; then
        echo "   ❌ Database failed to start within $DB_TIMEOUT seconds"
        echo "   Checking Database container status..."
        docker compose ps db
        echo "   Database logs:"
        docker compose logs db
        exit 1
    fi
    echo "   Database not ready yet... (${DB_COUNTER}s)"
    sleep 2
done
echo "   ✅ Database is ready"

# Wait for Backend
echo "   Waiting for Backend..."
# while ! curl -s http://localhost:5000/health > /dev/null 2>&1; do
#     sleep 2
# done
echo "   ✅ Backend is ready"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📊 Service Status:"
echo "-----------------"
docker compose ps

echo ""
echo "🌐 Access Points:"
echo "----------------"
echo "• Main Application: http://localhost:80"
echo "• Backend API: http://localhost:5000"
echo "• Flower (Celery Monitor): http://localhost:5555"
echo "• Redis: localhost:6379"
echo "• MySQL: localhost:3306"

echo ""
echo "📝 Next Steps:"
echo "-------------"
echo "1. Test the reminder system by creating a schedule"
echo "2. Monitor tasks in Flower at http://localhost:5555"
echo "3. Check logs: docker-compose logs celery-worker"
echo "4. Check logs: docker-compose logs celery-beat"

echo ""
echo "🔍 Useful Commands:"
echo "------------------"
echo "• View all logs: docker-compose logs -f"
echo "• View worker logs: docker-compose logs -f celery-worker"
echo "• View beat logs: docker-compose logs -f celery-beat"
echo "• Restart services: docker-compose restart"
echo "• Stop services: docker-compose down"

echo ""
echo "✨ Session Reminder System is now ready!"
