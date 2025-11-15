#!/bin/bash

# Setup script for Private Tutoring System
# This script initializes the private tutoring database tables and sample data

echo "🎓 Setting up Private Tutoring System"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if database is running
if ! docker compose ps db | grep -q "running"; then
    echo "❌ Database is not running. Starting database..."
    ./manage_db.sh start
    sleep 10
fi

echo "📚 Initializing Private Tutoring database tables..."

# Execute the private tutoring schema SQL
docker compose exec -T db mysql -u admin -p***REMOVED-DB-PASSWORD*** sehanDB < mysql-init/02-private_tutoring_init.sql

if [ $? -eq 0 ]; then
    echo "✅ Private tutoring tables created successfully!"
else
    echo "❌ Failed to create private tutoring tables"
    exit 1
fi

echo "📊 Inserting sample data..."

# Execute the sample data SQL
docker compose exec -T db mysql -u admin -p***REMOVED-DB-PASSWORD*** sehanDB < mysql-init/03-private_tutoring_sample_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Sample data inserted successfully!"
else
    echo "❌ Failed to insert sample data"
    exit 1
fi

echo "🎉 Private Tutoring System setup complete!"
echo ""
echo "📋 What was created:"
echo "   • 8 Sample students with subjects"
echo "   • Session applications for each student"
echo "   • Completed sessions with progress tracking"
echo "   • Upcoming schedules"
echo "   • Sample alerts and comments"
echo ""
echo "🚀 You can now:"
echo "   • Start the backend: cd backend && python app.py"
echo "   • Start the frontend: cd frontend && npm start"
echo "   • Access the private tutoring system at /private-tutoring"
echo ""
echo "🔍 To verify the setup:"
echo "   • Run: python test_db.py"
echo "   • Or connect to MySQL: ./manage_db.sh connect"
