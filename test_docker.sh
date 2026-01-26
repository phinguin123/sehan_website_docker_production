#!/bin/bash
# Docker-based testing script for week-based reports
# Usage: ./test_docker.sh [student_id]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Docker Week-Based Report Testing${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if containers are running
echo "Checking Docker containers..."
if ! docker compose ps | grep -q "backend.*Up"; then
    echo -e "${RED}❌ Backend container not running!${NC}"
    echo -e "${YELLOW}Start with: docker compose up -d${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend container running${NC}"

if ! docker compose ps | grep -q "main_nginx.*running"; then
    echo -e "${YELLOW}⚠ Warning: Nginx container not running${NC}"
fi
echo ""

# Configuration
STUDENT_ID="${1:-123}"
OUTPUT_DIR="./test_reports"
mkdir -p "$OUTPUT_DIR"

echo "Configuration:"
echo "  Student ID: $STUDENT_ID"
echo "  Output Directory: $OUTPUT_DIR"
echo "  API Endpoint: http://localhost:5000"
echo ""

# Test 1: Date utilities
echo -e "${GREEN}Test 1: Testing date utilities...${NC}"
docker compose exec -T backend python tests/test_week_based_reports.py --test-dates
echo ""

# Test 2: Check student data
echo -e "${GREEN}Test 2: Checking student data...${NC}"
docker compose exec -T backend python tests/test_week_based_reports.py \
    --student-id $STUDENT_ID --check-data || true
echo ""

# Test 3: Generate 6-week report
echo -e "${GREEN}Test 3: Generating 6-week report via API...${NC}"
if curl -X GET "http://localhost:5000/api/reports/students/$STUDENT_ID/weekly?num_weeks=6" \
     --output "$OUTPUT_DIR/student_${STUDENT_ID}_6weeks.pdf" \
     --silent --show-error --fail; then
    FILE_SIZE=$(stat -c%s "$OUTPUT_DIR/student_${STUDENT_ID}_6weeks.pdf" 2>/dev/null || stat -f%z "$OUTPUT_DIR/student_${STUDENT_ID}_6weeks.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ Success: Generated 6-week report ($FILE_SIZE bytes)${NC}"
else
    echo -e "${RED}✗ Failed to generate 6-week report${NC}"
fi
echo ""

# Test 4: Generate 4-week report
echo -e "${GREEN}Test 4: Generating 4-week report via API...${NC}"
if curl -X GET "http://localhost:5000/api/reports/students/$STUDENT_ID/weekly?num_weeks=4" \
     --output "$OUTPUT_DIR/student_${STUDENT_ID}_4weeks.pdf" \
     --silent --show-error --fail; then
    FILE_SIZE=$(stat -c%s "$OUTPUT_DIR/student_${STUDENT_ID}_4weeks.pdf" 2>/dev/null || stat -f%z "$OUTPUT_DIR/student_${STUDENT_ID}_4weeks.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ Success: Generated 4-week report ($FILE_SIZE bytes)${NC}"
else
    echo -e "${RED}✗ Failed to generate 4-week report${NC}"
fi
echo ""

# Test 5: Generate day-based report for comparison
echo -e "${GREEN}Test 5: Generating day-based report (legacy) via API...${NC}"
if curl -X GET "http://localhost:5000/api/reports/students/$STUDENT_ID" \
     --output "$OUTPUT_DIR/student_${STUDENT_ID}_daybased.pdf" \
     --silent --show-error --fail; then
    FILE_SIZE=$(stat -c%s "$OUTPUT_DIR/student_${STUDENT_ID}_daybased.pdf" 2>/dev/null || stat -f%z "$OUTPUT_DIR/student_${STUDENT_ID}_daybased.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ Success: Generated day-based report ($FILE_SIZE bytes)${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Failed to generate day-based report${NC}"
fi
echo ""

# Test 6: Compare reports (if student data exists)
echo -e "${GREEN}Test 6: Comparing report formats...${NC}"
docker compose exec -T backend python tests/test_week_based_reports.py \
    --student-id $STUDENT_ID --compare 2>/dev/null || echo -e "${YELLOW}⚠ Could not compare (may need more student data)${NC}"
echo ""

# Summary
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Generated reports:"
ls -lh "$OUTPUT_DIR" | grep "student_${STUDENT_ID}" || echo "No reports generated"
echo ""

# Count successes
SUCCESS_COUNT=0
if [ -f "$OUTPUT_DIR/student_${STUDENT_ID}_6weeks.pdf" ]; then
    ((SUCCESS_COUNT++))
fi
if [ -f "$OUTPUT_DIR/student_${STUDENT_ID}_4weeks.pdf" ]; then
    ((SUCCESS_COUNT++))
fi
if [ -f "$OUTPUT_DIR/student_${STUDENT_ID}_daybased.pdf" ]; then
    ((SUCCESS_COUNT++))
fi

if [ $SUCCESS_COUNT -ge 2 ]; then
    echo -e "${GREEN}✓ Testing complete! ($SUCCESS_COUNT/3 reports generated)${NC}"
else
    echo -e "${YELLOW}⚠ Testing partially complete ($SUCCESS_COUNT/3 reports generated)${NC}"
fi
echo ""

echo "Next steps:"
echo "1. Open PDFs in: $OUTPUT_DIR"
echo "2. Verify week-based format (should show Week 1-6)"
echo "3. Compare with day-based report (should show Mon-Fri)"
echo "4. Check if data matches expectations"
echo ""
echo "To test another student: ./test_docker.sh <student_id>"
echo "To view backend logs: docker compose logs -f backend"
echo "To enter container: docker compose exec -it backend bash"
echo ""
