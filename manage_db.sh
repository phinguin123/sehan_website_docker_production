#!/bin/bash

# Local MySQL Database Setup Script for Sehan Website
# This script helps you start and manage your local MySQL database

echo "🚀 Starting Local MySQL Database Setup for Sehan Website"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Function to start the database
start_database() {
    echo "📦 Starting MySQL database container..."
    docker compose up -d db
    
    echo "⏳ Waiting for MySQL to be ready..."
    sleep 10
    
    echo "✅ MySQL database is ready!"
    echo "📍 Database connection details:"
    echo "   Host: localhost (or 'db' from within containers)"
    echo "   Port: 3306"
    echo "   Database: sehanDB"
    echo "   User: sehan_user"
    echo "   Password: sehan_password123"
}

# Function to stop the database
stop_database() {
    echo "🛑 Stopping MySQL database container..."
    docker compose down db
    echo "✅ Database stopped!"
}

# Function to restart the database
restart_database() {
    echo "🔄 Restarting MySQL database..."
    stop_database
    start_database
}

# Function to view logs
view_logs() {
    echo "📋 Showing MySQL logs..."
    docker compose logs -f db
}

# Function to connect to MySQL
connect_mysql() {
    echo "🔌 Connecting to MySQL..."
    docker compose exec db mysql -u admin -p***REMOVED-DB-PASSWORD*** sehanDB
}

# Function to reset database (WARNING: This will delete all data)
reset_database() {
    echo "⚠️  WARNING: This will delete all data in the database!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing database volume..."
        docker compose down db
        docker volume rm sehan_website_db_data
        echo "🔄 Starting fresh database..."
        start_database
        echo "✅ Database reset complete!"
    else
        echo "❌ Database reset cancelled."
    fi
}

# Main script logic
case "${1:-start}" in
    "start")
        start_database
        ;;
    "stop")
        stop_database
        ;;
    "restart")
        restart_database
        ;;
    "logs")
        view_logs
        ;;
    "connect")
        connect_mysql
        ;;
    "reset")
        reset_database
        ;;
    "status")
        echo "📊 Database Status:"
        docker compose ps db
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|connect|reset|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the MySQL database"
        echo "  stop    - Stop the MySQL database"
        echo "  restart - Restart the MySQL database"
        echo "  logs    - View MySQL logs"
        echo "  connect - Connect to MySQL CLI"
        echo "  reset   - Reset database (delete all data)"
        echo "  status  - Show database status"
        exit 1
        ;;
esac
