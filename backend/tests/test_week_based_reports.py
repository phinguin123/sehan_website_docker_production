"""
Test script for week-based report system.

This script helps test the new week-based report functionality by:
1. Creating sample test data for multiple weeks
2. Generating reports and validating output
3. Comparing week-based vs day-based reports

Usage:
    python test_week_based_reports.py --student-id <ID> --num-weeks <NUM>
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
import pymysql
import pytz

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.db import DBHelper
from utils.utils import (
    get_week_date_range,
    get_all_weeks_date_ranges,
    get_week_number_from_date,
    get_current_week_number,
    SEHAN_START_DATE
)
from dao.report_dao import ReportDAO


class WeekBasedReportTester:
    def __init__(self):
        self.db = DBHelper()
        self.report_dao = ReportDAO(self.db)
        self.seoul_tz = pytz.timezone("Asia/Seoul")
        
    def print_section(self, title):
        """Print a formatted section header."""
        print(f"\n{'=' * 80}")
        print(f"{title:^80}")
        print('=' * 80)
    
    def test_date_utilities(self):
        """Test the date utility functions."""
        self.print_section("Testing Date Utility Functions")
        
        print(f"\n📅 SEHAN_START_DATE: {SEHAN_START_DATE}")
        print(f"📅 Current Week Number: {get_current_week_number()}")
        
        print(f"\n📊 Week Date Ranges (6 weeks):")
        week_ranges = get_all_weeks_date_ranges(6)
        for i, (start, end) in enumerate(week_ranges, 1):
            print(f"   Week {i}: {start} to {end} ({(end - start).days + 1} days)")
        
        # Test week number calculation
        print(f"\n🔍 Testing Week Number Calculation:")
        test_dates = [
            datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d").date(),
            datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d").date() + timedelta(days=7),
            datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d").date() + timedelta(days=14),
        ]
        
        for test_date in test_dates:
            week_num = get_week_number_from_date(test_date)
            print(f"   Date: {test_date} -> Week {week_num}")
    
    def get_student_info(self, student_id):
        """Get student information."""
        query = """
            SELECT s.student_id, s.name, s.grade, s.school
            FROM students s
            WHERE s.student_id = %s
        """
        return self.db.fetch_one(query, (student_id,))
    
    def get_student_subjects(self, student_id):
        """Get subjects for a student."""
        query = """
            SELECT DISTINCT sub.subject_id, sub.subject_name, stc.level_id, l.level_name
            FROM student_classes stc
            JOIN classes c ON stc.class_id = c.class_id
            JOIN subjects sub ON c.subject_id = sub.subject_id
            JOIN levels l ON stc.level_id = l.id
            WHERE stc.student_id = %s
            ORDER BY sub.subject_name
        """
        return self.db.fetch_all(query, (student_id,))
    
    def check_homework_data(self, student_id, num_weeks=6):
        """Check homework data for a student across weeks."""
        self.print_section(f"Homework Data Analysis (Student ID: {student_id})")
        
        student = self.get_student_info(student_id)
        if not student:
            print(f"❌ Student {student_id} not found!")
            return
        
        print(f"\n👤 Student: {student['name']} (Grade: {student['grade']}, School: {student['school']})")
        
        subjects = self.get_student_subjects(student_id)
        if not subjects:
            print("❌ No subjects found for this student!")
            return
        
        print(f"\n📚 Subjects: {', '.join([s['subject_name'] for s in subjects])}")
        
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        
        for subject in subjects:
            subject_id = subject['subject_id']
            subject_name = subject['subject_name']
            
            print(f"\n📖 {subject_name} (ID: {subject_id}):")
            print(f"   {'Week':<10} {'Homework':<12} {'Exams':<12} {'Attendance':<15}")
            print(f"   {'-' * 50}")
            
            for week_num, (start_date, end_date) in enumerate(week_ranges, 1):
                # Check homework
                hw_query = """
                    SELECT COUNT(*) as count
                    FROM homework h
                    JOIN student_homework_submission shs ON h.id = shs.homework_id
                    WHERE shs.student_id = %s
                    AND h.subject_id = %s
                    AND h.type = 'homework'
                    AND h.assignedDate BETWEEN %s AND %s
                """
                hw_result = self.db.fetch_one(hw_query, (student_id, subject_id, start_date, end_date))
                hw_count = hw_result['count'] if hw_result else 0
                
                # Check exams
                exam_query = """
                    SELECT COUNT(*) as count
                    FROM homework h
                    JOIN student_homework_submission shs ON h.id = shs.homework_id
                    WHERE shs.student_id = %s
                    AND h.subject_id = %s
                    AND h.type = 'exam'
                    AND h.assignedDate BETWEEN %s AND %s
                """
                exam_result = self.db.fetch_one(exam_query, (student_id, subject_id, start_date, end_date))
                exam_count = exam_result['count'] if exam_result else 0
                
                # Check attendance
                att_query = """
                    SELECT COUNT(*) as count, status
                    FROM attendance
                    WHERE student_id = %s
                    AND subject_name = %s
                    AND attendance_date BETWEEN %s AND %s
                    GROUP BY status
                """
                att_results = self.db.fetch_all(att_query, (student_id, subject_name, start_date, end_date))
                att_summary = ', '.join([f"{r['status']}: {r['count']}" for r in att_results]) if att_results else "None"
                
                print(f"   Week {week_num:<5} {hw_count:<12} {exam_count:<12} {att_summary:<15}")
    
    def generate_sample_data(self, student_id, grade_id, subject_id, num_weeks=6):
        """Generate sample test data for a student."""
        self.print_section(f"Generating Sample Data (Student ID: {student_id})")
        
        print(f"⚠️  WARNING: This will create test data in your database!")
        response = input("Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Cancelled.")
            return
        
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        
        print(f"\n📝 Creating homework and submissions for {num_weeks} weeks...")
        
        for week_num, (start_date, end_date) in enumerate(week_ranges, 1):
            # Create 2-3 homework assignments per week
            num_homework = 2 if week_num % 2 == 0 else 3
            
            for i in range(num_homework):
                assigned_date = start_date + timedelta(days=i)
                due_date = assigned_date + timedelta(days=7)
                
                # Insert homework
                hw_insert = """
                    INSERT INTO homework (title, description, assignedDate, dueDate, is_over, subject_id, grade_id, level_id, type)
                    VALUES (%s, %s, %s, %s, 1, %s, %s, 3, 'homework')
                """
                hw_id = self.db.execute(
                    hw_insert,
                    (f"Test Homework Week{week_num}-{i+1}", 
                     f"Sample homework for week {week_num}", 
                     assigned_date, due_date, subject_id, grade_id)
                )
                
                # Insert submission
                marks = 5 + (week_num % 3)  # Vary marks
                raw_marks = 60 + (week_num * 5)  # Increasing raw marks
                
                sub_insert = """
                    INSERT INTO student_homework_submission 
                    (student_id, homework_id, submission_date, marks, raw_marks, comment)
                    VALUES (%s, LAST_INSERT_ID(), %s, %s, %s, 'Test submission')
                """
                self.db.execute(sub_insert, (student_id, assigned_date, marks, raw_marks))
            
            print(f"   ✓ Week {week_num}: Created {num_homework} homework assignments")
        
        # Create one exam for week 6
        exam_date = week_ranges[5][0]  # Week 6 start
        exam_insert = """
            INSERT INTO homework (title, description, assignedDate, dueDate, is_over, subject_id, grade_id, level_id, type)
            VALUES (%s, %s, %s, %s, 1, %s, %s, 3, 'exam')
        """
        self.db.execute(
            exam_insert,
            ("Final Exam", "Sample final exam", exam_date, exam_date, subject_id, grade_id)
        )
        
        exam_sub = """
            INSERT INTO student_homework_submission 
            (student_id, homework_id, submission_date, marks, raw_marks, comment)
            VALUES (%s, LAST_INSERT_ID(), %s, 6, 85, 'Exam submission')
        """
        self.db.execute(exam_sub, (student_id, exam_date))
        
        print(f"   ✓ Created final exam for Week 6")
        print(f"\n✅ Sample data generation complete!")
    
    def compare_reports(self, student_id):
        """Generate and compare both day-based and week-based reports."""
        self.print_section(f"Comparing Reports (Student ID: {student_id})")
        
        print(f"\n📄 Generating day-based report...")
        try:
            day_report = self.report_dao.generate_pdf(student_id)
            day_size = len(day_report.data) if hasattr(day_report, 'data') else 0
            print(f"   ✓ Day-based report generated: {day_size} bytes")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            day_size = 0
        
        print(f"\n📄 Generating week-based report (6 weeks)...")
        try:
            week_report = self.report_dao.generate_pdf_weekly(student_id, num_weeks=6)
            week_size = len(week_report.data) if hasattr(week_report, 'data') else 0
            print(f"   ✓ Week-based report generated: {week_size} bytes")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            week_size = 0
        
        if day_size > 0 and week_size > 0:
            print(f"\n📊 Report Comparison:")
            print(f"   Day-based:  {day_size:,} bytes")
            print(f"   Week-based: {week_size:,} bytes")
            print(f"   Difference: {abs(week_size - day_size):,} bytes")


def main():
    parser = argparse.ArgumentParser(description="Test week-based report system")
    parser.add_argument('--student-id', type=int, help='Student ID to test with')
    parser.add_argument('--num-weeks', type=int, default=6, help='Number of weeks (default: 6)')
    parser.add_argument('--test-dates', action='store_true', help='Test date utility functions')
    parser.add_argument('--check-data', action='store_true', help='Check homework data for student')
    parser.add_argument('--generate-data', action='store_true', help='Generate sample test data')
    parser.add_argument('--compare', action='store_true', help='Compare day-based vs week-based reports')
    parser.add_argument('--subject-id', type=int, help='Subject ID for sample data generation')
    parser.add_argument('--grade-id', type=int, help='Grade ID for sample data generation')
    
    args = parser.parse_args()
    
    tester = WeekBasedReportTester()
    
    if args.test_dates or not any([args.check_data, args.generate_data, args.compare]):
        tester.test_date_utilities()
    
    if args.check_data and args.student_id:
        tester.check_homework_data(args.student_id, args.num_weeks)
    
    if args.generate_data and args.student_id and args.subject_id and args.grade_id:
        tester.generate_sample_data(args.student_id, args.grade_id, args.subject_id, args.num_weeks)
    
    if args.compare and args.student_id:
        tester.compare_reports(args.student_id)
    
    print("\n" + "=" * 80)
    print("✅ Testing complete!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
