# Week-Based Report System Testing

## 🐳 Using Docker? Start Here!

**→ [DOCKER_TESTING_GUIDE.md](./DOCKER_TESTING_GUIDE.md)** ← Docker-specific instructions  
**→ [../DOCKER_QUICK_START.md](../DOCKER_QUICK_START.md)** ← Super quick Docker guide

## 🎯 Quick Links

- **Docker Guide**: [DOCKER_TESTING_GUIDE.md](./DOCKER_TESTING_GUIDE.md) - **For Docker Compose users** 🐳
- **Quick Start**: [QUICK_START_TESTING.md](./QUICK_START_TESTING.md) - For non-Docker setups
- **Full Guide**: [WEEK_BASED_TESTING_GUIDE.md](./WEEK_BASED_TESTING_GUIDE.md)
- **Implementation**: [../WEEK_BASED_REPORTS_IMPLEMENTATION.md](../WEEK_BASED_REPORTS_IMPLEMENTATION.md)

## 📁 Test Files

```
backend/tests/
├── README.md                          ← You are here
├── QUICK_START_TESTING.md             ← 5-minute quick start guide
├── WEEK_BASED_TESTING_GUIDE.md        ← Comprehensive testing guide
├── test_week_based_reports.py         ← Python test script
└── API_EXAMPLES.sh                    ← Shell script for API testing
```

## 🚀 Fastest Way to Test

### If Using Docker (Recommended):

```bash
# 1. Run the Docker test script
cd /home/ubuntu/sehan_ibp_website_production
./test_docker.sh 123

# 2. Check the generated reports
ls -lh ./test_reports/

# 3. Open and verify the PDFs
```

### If NOT Using Docker:

```bash
# 1. Run the shell script
cd /home/ubuntu/sehan_ibp_website_production/backend
./tests/API_EXAMPLES.sh 123

# 2. Check the generated reports
ls -lh ./test_reports/

# 3. Open and verify the PDFs
```

## 📊 What This Testing Suite Provides

### ✅ Test Coverage

| Test Type | File | What It Tests |
|-----------|------|---------------|
| **API Testing** | `API_EXAMPLES.sh` | All API endpoints, response validation |
| **Data Validation** | `test_week_based_reports.py` | Date calculations, data aggregation |
| **Report Comparison** | `test_week_based_reports.py` | Old vs new format consistency |
| **Manual Testing** | Documentation guides | Visual verification, UX testing |

### 🔧 Test Utilities

1. **Date Utility Testing**
   - Verify week number calculations
   - Check date range generation
   - Validate timezone handling

2. **Data Analysis**
   - Check homework data per week
   - Verify exam scores
   - Validate attendance records

3. **Report Generation**
   - Generate week-based reports
   - Generate day-based reports
   - Compare both formats

4. **Sample Data Creation**
   - Create test homework
   - Create test submissions
   - Create test exams

## 📝 Testing Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   TESTING WORKFLOW                           │
└─────────────────────────────────────────────────────────────┘

1. Quick Smoke Test (2 minutes)
   │
   └─> ./tests/API_EXAMPLES.sh 123
       └─> Open generated PDFs
           └─> Visual verification

2. Detailed Testing (10 minutes)
   │
   ├─> python tests/test_week_based_reports.py --test-dates
   ├─> python tests/test_week_based_reports.py --student-id 123 --check-data
   └─> python tests/test_week_based_reports.py --student-id 123 --compare

3. Multiple Students (20 minutes)
   │
   └─> for id in 100 101 102 103 104; do
           ./tests/API_EXAMPLES.sh $id
       done

4. Edge Cases (30 minutes)
   │
   ├─> Students with no homework
   ├─> Students with missing attendance
   ├─> Students with incomplete data
   └─> Different week counts (4, 6, 8, 12)
```

## 🎓 For Different Audiences

### For QA Testers
→ Start with [QUICK_START_TESTING.md](./QUICK_START_TESTING.md)
→ Use `API_EXAMPLES.sh` for automated testing
→ Follow the visual verification checklist

### For Developers
→ Read [WEEK_BASED_TESTING_GUIDE.md](./WEEK_BASED_TESTING_GUIDE.md)
→ Use `test_week_based_reports.py` for debugging
→ Check implementation in [../WEEK_BASED_REPORTS_IMPLEMENTATION.md](../WEEK_BASED_REPORTS_IMPLEMENTATION.md)

### For Product Owners
→ Run `./tests/API_EXAMPLES.sh 123`
→ Open the generated PDFs
→ Verify the reports meet requirements

## 🐛 Troubleshooting

### Common Issues

**Issue**: Script says "student not found"
```bash
# Solution: Check if student exists
python -c "from utils.db import DBHelper; \
db = DBHelper(); \
print(db.fetch_one('SELECT * FROM students WHERE student_id = 123', ()))"
```

**Issue**: Reports show no data
```bash
# Solution: Check data availability
python tests/test_week_based_reports.py --student-id 123 --check-data
```

**Issue**: Week calculations seem wrong
```bash
# Solution: Test date functions
python tests/test_week_based_reports.py --test-dates
```

**Issue**: Can't run shell script
```bash
# Solution: Make it executable
chmod +x tests/API_EXAMPLES.sh
```

## 📊 Test Report Example

After running tests, you should see output like:

```
=========================================
Week-Based Report API Testing
=========================================

Base URL: http://localhost:5000
Student ID: 123
Output Directory: ./test_reports

Test 1: Generate 6-week report
✓ Success: Generated 6-week report (128,945 bytes)

Test 2: Generate 4-week report
✓ Success: Generated 4-week report (98,234 bytes)

Test 3: Generate day-based report (legacy)
✓ Success: Generated day-based report (125,678 bytes)

=========================================
Test Summary
=========================================

Generated Reports:
-rw-r--r-- 1 user group 128K Jan 14 10:30 student_123_6weeks.pdf
-rw-r--r-- 1 user group  98K Jan 14 10:30 student_123_4weeks.pdf
-rw-r--r-- 1 user group 125K Jan 14 10:30 student_123_daybased.pdf

✓ Testing complete!
```

## 🎯 Success Criteria

Your testing is successful when:

- [ ] All API endpoints respond without errors
- [ ] Generated PDFs open correctly
- [ ] Week columns (Week 1-6) are present
- [ ] Data matches database records
- [ ] Korean text displays properly
- [ ] Formatting is consistent
- [ ] Calculations are accurate
- [ ] Old and new formats show same data (different presentation)

## 📞 Getting Help

1. **Check logs**: `tail -f ../logs/app.log`
2. **Review documentation**: Read the testing guides
3. **Run diagnostics**: Use `test_week_based_reports.py --test-dates`
4. **Verify database**: Check MySQL for data issues

## 🔗 Related Documentation

- API Documentation: `/api/docs` (when server is running)
- Database Schema: `../mysql-init-prod/`
- Backend Code: `../backend/`

---

**Happy Testing!** 🚀

If you find any issues, please document them and report to the development team.
