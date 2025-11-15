from utils.db import DBHelper
from dao.report_dao import ReportDAO
import csv
import io
from flask import Response
from utils.utils import get_current_day_id

db_helper = DBHelper()


class ReportNotAvailable(Exception):
    pass


class ReportService:
    def __init__(self):
        self.report_dao = ReportDAO(db_helper)

    def get_report_attendance(self, grade_name):
        # Logic to retrieve report attendance data
        # This is a placeholder implementation
        attendance_data = self.report_dao.get_report_attendance(grade_name)
        output = io.StringIO()
        output.write("\ufeff")  # Add BOM for Excel compatibility
        writer = csv.writer(output)
        writer.writerow(["Student Name", "Class", "Date", "Status"])
        for row in attendance_data:
            class_name = f"{row["subject_name"]}({row["start_time"]}~{row["end_time"]})"
            writer.writerow(
                [row["student_name"], class_name, row["attendance_date"], row["status"]]
            )
        output.seek(0)
        filename = f"attendance_{grade_name}.csv"
        response = Response(
            output,
            mimetype="text/csv; charset=utf-8",
        )
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    def get_reference_data(self):
        # Logic to retrieve reference data
        return (
            self.get_report_attendance()
        )  # For now, returning the same data as reference data

    def generate_student_reports(self):
        print("generating report...")
        return self.report_dao.generate_student_reports()

    def generate_one_student_reports(self, student_id):
        return self.report_dao.generate_pdf(student_id)

    def send_reports(self):
        return self.report_dao.send_reports()

    def check_availability(self):
        current_day_id = get_current_day_id()

        report_available_day_ids = [3, 4, 5]  # wed, thur, fri

        # TODO delete after 2025 summer
        if current_day_id not in report_available_day_ids:
            raise ReportNotAvailable("Please check report on Wed, Thur or Fri")
