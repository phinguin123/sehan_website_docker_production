#!/bin/bash
# API Testing Examples for Week-Based Reports
# Usage: ./API_EXAMPLES.sh [student_id]

set -e  # Exit on error

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5000}"
STUDENT_ID="${1:-123}"  # Default to student 123 if not provided
OUTPUT_DIR="./test_reports"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "========================================="
echo "Week-Based Report API Testing"
echo "========================================="
echo ""
echo "Base URL: $BASE_URL"
echo "Student ID: $STUDENT_ID"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Test 1: Generate 6-week report
echo -e "${GREEN}Test 1: Generate 6-week report${NC}"
curl -X GET "$BASE_URL/api/reports/students/$STUDENT_ID/weekly?num_weeks=6" \
     --fail \
     --output "$OUTPUT_DIR/student_${STUDENT_ID}_6weeks.pdf" \
     --silent \
     --show-error
if [ $? -eq 0 ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT_DIR/student_${STUDENT_ID}_6weeks.pdf" 2>/dev/null || stat -c%s "$OUTPUT_DIR/student_${STUDENT_ID}_6weeks.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ Success: Generated 6-week report ($FILE_SIZE bytes)${NC}"
else
    echo -e "${RED}✗ Failed to generate 6-week report${NC}"
fi
echo ""

# Test 2: Generate 4-week report
echo -e "${GREEN}Test 2: Generate 4-week report${NC}"
curl -X GET "$BASE_URL/api/reports/students/$STUDENT_ID/weekly?num_weeks=4" \
     --fail \
     --output "$OUTPUT_DIR/student_${STUDENT_ID}_4weeks.pdf" \
     --silent \
     --show-error
if [ $? -eq 0 ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT_DIR/student_${STUDENT_ID}_4weeks.pdf" 2>/dev/null || stat -c%s "$OUTPUT_DIR/student_${STUDENT_ID}_4weeks.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ Success: Generated 4-week report ($FILE_SIZE bytes)${NC}"
else
    echo -e "${RED}✗ Failed to generate 4-week report${NC}"
fi
echo ""

# Test 3: Generate old day-based report for comparison
echo -e "${GREEN}Test 3: Generate day-based report (legacy)${NC}"
curl -X GET "$BASE_URL/api/reports/students/$STUDENT_ID" \
     --fail \
     --output "$OUTPUT_DIR/student_${STUDENT_ID}_daybased.pdf" \
     --silent \
     --show-error
if [ $? -eq 0 ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT_DIR/student_${STUDENT_ID}_daybased.pdf" 2>/dev/null || stat -c%s "$OUTPUT_DIR/student_${STUDENT_ID}_daybased.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ Success: Generated day-based report ($FILE_SIZE bytes)${NC}"
else
    echo -e "${RED}✗ Failed to generate day-based report${NC}"
fi
echo ""

# Test 4: Test with 8 weeks
echo -e "${GREEN}Test 4: Generate 8-week report${NC}"
curl -X GET "$BASE_URL/api/reports/students/$STUDENT_ID/weekly?num_weeks=8" \
     --fail \
     --output "$OUTPUT_DIR/student_${STUDENT_ID}_8weeks.pdf" \
     --silent \
     --show-error
if [ $? -eq 0 ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT_DIR/student_${STUDENT_ID}_8weeks.pdf" 2>/dev/null || stat -c%s "$OUTPUT_DIR/student_${STUDENT_ID}_8weeks.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ Success: Generated 8-week report ($FILE_SIZE bytes)${NC}"
else
    echo -e "${YELLOW}⚠ Warning: 8-week report generation failed (may not have data)${NC}"
fi
echo ""

# Test 5: Check report availability
echo -e "${GREEN}Test 5: Check report availability${NC}"
AVAILABILITY=$(curl -X GET "$BASE_URL/api/reports/availability" \
     --silent \
     --header "Accept: application/json")
echo "Response: $AVAILABILITY"
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "Generated Reports:"
ls -lh "$OUTPUT_DIR" | grep -E "student_${STUDENT_ID}"
echo ""
echo -e "${GREEN}✓ Testing complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Open the PDFs in: $OUTPUT_DIR"
echo "2. Verify the week-based format"
echo "3. Compare with day-based report"
echo ""
echo "To test another student: ./API_EXAMPLES.sh <student_id>"
echo ""
