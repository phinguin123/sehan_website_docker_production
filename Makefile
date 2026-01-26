# Makefile for Docker Compose operations
# This simplifies common Docker commands for the Sehan IBP Website project

.PHONY: help dev prod down logs clean restart

# Default target - show help
help:
	@echo "========================================"
	@echo "  Sehan IBP Website - Docker Commands"
	@echo "========================================"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev        - Start in DEVELOPMENT mode (with hot-reload, exposed ports)"
	@echo "  make prod       - Start in PRODUCTION mode (optimized, minimal exposed ports)"
	@echo "  make down       - Stop and remove all containers"
	@echo "  make logs       - Show logs from all containers (follow mode)"
	@echo "  make clean      - Stop containers and remove volumes (WARNING: deletes data)"
	@echo "  make restart    - Restart all containers"
	@echo ""

# Development mode
dev:
	@echo "🚀 Starting in DEVELOPMENT mode..."
	docker compose up --build

# Production mode
prod:
	@echo "🚀 Starting in PRODUCTION mode..."
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Stop all containers
down:
	@echo "🛑 Stopping all containers..."
	docker compose down

# Show logs
logs:
	@echo "📋 Showing logs (Ctrl+C to exit)..."
	docker compose logs -f

# Clean everything (including volumes)
clean:
	@echo "⚠️  WARNING: This will delete all data in volumes!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	docker compose down -v
	@echo "✅ Cleaned up containers and volumes"

# Restart containers
restart:
	@echo "🔄 Restarting containers..."
	docker compose restart
	@echo "✅ Containers restarted"
