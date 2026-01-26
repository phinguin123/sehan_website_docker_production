#!/bin/bash
# Script to run all tests with proper environment setup

echo "🧪 Running SEHAN System Tests"
echo "=============================="
echo ""

# Set test environment
export SEHAN_END_DATE=2026-01-05
export FLASK_ENV=testing

# Run tests
python -m pytest tests/ -v --tb=short

# Or use unittest
# python -m unittest discover tests/ -v

echo ""
echo "✅ Tests completed"





