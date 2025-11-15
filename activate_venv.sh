#!/bin/bash
# Activation script for the Python virtual environment

echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

echo "✅ Virtual environment activated!"
echo "📍 Current directory: $(pwd)"
echo "🐍 Python version: $(python --version)"
echo "📦 Virtual environment: $VIRTUAL_ENV"

echo ""
echo "🚀 Quick commands:"
echo "   Backend development server: cd backend && python3 app.py"
echo "   Flask CLI: cd backend && flask --app app run --debug"
echo "   Frontend development: cd frontend && npm run dev"
echo "   Docker compose: docker compose up"
echo ""
echo "🔗 Available endpoints:"
echo "   Student Management API: http://localhost:5000/api/"
echo "   Private Tutoring API: http://localhost:5000/api/private_tutor/"
echo "   Frontend: http://localhost:8080"
echo ""
echo "💡 To deactivate: type 'deactivate'"
