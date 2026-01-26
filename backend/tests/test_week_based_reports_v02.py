import sys
import os

# Add the parent directory to path so imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dao.report_dao import ReportDAO

# 1. Create a Fake Database Class
class MockDBHelper:
    def fetch_all(self, query, params=None):
        # Return fake data based on what query is being asked
        
        # If asking for student data...
        if "FROM students s" in query:
            return [{
                "student_id": 1,
                "name": "Jeeho Test",
                "grade": "11",
                "grade_id": 5,
                "school": "Sehan High",
                "subject_name": "Math AA HL",
                "subject_id": 101,
                "level_name": "HL",
                "level_id": 3
            }, {
                "student_id": 1,
                "name": "Jeeho Test",
                "grade": "11",
                "grade_id": 5,
                "school": "Sehan High",
                "subject_name": "Physics SL",
                "subject_id": 102,
                "level_name": "SL",
                "level_id": 2
            }]
            
        # If asking for comments...
        if "FROM student_comments" in query:
            return [
                {"subject_name": "Math AA HL", "comment_text": "Excellent work on Calculus."},
                {"subject_name": "Physics SL", "comment_text": "Needs to improve on lab reports."}
            ]

        # If asking for attendance (weekly)...
        if "FROM attendance" in query:
            # Simulate perfectly present
            return [{"status": "present", "cnt": 2}]
            
        return []

    def fetch_one(self, query, params=None):
        # If asking for Homework Average...
        if "SELECT AVG(shs.marks)" in query:
            # Return a random-ish score
            return {"avg_marks": 95.5, "count": 1}
            
        return None

# 2. The Test Execution
def run_test():
    print("Initializing Mock DB...")
    mock_db = MockDBHelper()
    
    print("Initializing DAO...")
    dao = ReportDAO(mock_db)
    
    print("Generating PDF...")
    # We pass a fake student_id, doesn't matter because MockDB ignores it
    result = dao.generate_pdf(student_id=123, num_weeks=6)
    
    if result:
        with open("test_output_report.pdf", "wb") as f:
            f.write(result["bytes"])
        print(f"✅ Success! PDF saved to test_output_report.pdf")
    else:
        print("❌ Failed to generate PDF.")

if __name__ == "__main__":
    run_test()