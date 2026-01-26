from utils.utils import (
    get_current_week_number, 
    get_all_weeks_date_ranges
)
import io
import os
import logging
from flask import Response, make_response
from urllib.parse import quote

# ReportLab imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

TEXT_COLOR = "#1A374D"
TABLE_HEADER_COLOR = "#A7C6ED"
TABLE_BACKGROUND_COLOR = "#E5F0FD"
GENERAL_BACKGROUND_COLOR = "#F0F4F7"
BORDER_COLOR = "#60A3D9"

class ReportDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    # ========================================
    # DATA FETCHING METHODS
    # ========================================

    def _get_student_data(self, student_id):
        # Fetches basic student info (Name, Grade, Subjects)
        sql = """
            SELECT 
                s.student_id, s.name, s.grade, g.grade_id, s.school,
                sub.subject_name, sub.subject_id, l.level_name, stc.level_id
            FROM students s
            JOIN student_classes stc ON s.student_id = stc.student_id
            JOIN classes c ON stc.class_id = c.class_id
            JOIN subjects sub ON c.subject_id = sub.subject_id
            JOIN grades g ON s.grade = g.grade
            JOIN levels l ON stc.level_id = l.id
            WHERE s.student_id = %s
            ORDER BY sub.subject_name;
        """
        raw_data = self.db.fetch_all(sql, (student_id))
        
        if not raw_data:
            return None, [], []

        # Process student basic info
        student_info = {
            "student_id": raw_data[0]["student_id"],
            "name": raw_data[0]["name"],
            "grade": raw_data[0]["grade"],
            "grade_id": raw_data[0]["grade_id"],
            "school": raw_data[0]["school"],
            "subjects": []
        }

        # Deduplicate subjects
        seen_subjects = set()
        for row in raw_data:
            if row["subject_name"] not in seen_subjects:
                student_info["subjects"].append({
                    "subject_name": row["subject_name"],
                    "subject_id": row["subject_id"],
                    "level_id": row["level_id"]
                })
                seen_subjects.add(row["subject_name"])

        # Fetch Comments
        comment_query = """
            SELECT sc.comment_text, sc.subject_name
            FROM student_comments sc
            JOIN (
                SELECT subject_name, MAX(comment_id) as max_id 
                FROM student_comments WHERE student_id = %s GROUP BY subject_name
            ) latest ON sc.comment_id = latest.max_id
        """
        comments = self.db.fetch_all(comment_query, (student_id))

        return student_info, comments

    def _get_weekly_homework_data(self, student_id, subjects, num_weeks=6):
        """
        Fetches homework data for each subject for the last N weeks.
        Returns a structure suitable for the PDF table.
        """
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        data = {}

        for subject in subjects:
            subj_id = subject["subject_id"]
            subj_name = subject["subject_name"]
            
            weekly_scores = []
            total_score_sum = 0
            count_weeks_present = 0

            for (start_date, end_date) in week_ranges:
                # Get Avg Score for this week for this student
                sql = """
                    SELECT AVG(shs.marks) as avg_marks, COUNT(*) as count
                    FROM student_homework_submission shs
                    JOIN homework h ON shs.homework_id = h.id
                    WHERE shs.student_id = %s AND h.subject_id = %s
                    AND h.assignedDate BETWEEN %s AND %s
                    AND h.type = 'homework'
                """
                result = self.db.fetch_one(sql, (student_id, subj_id, start_date, end_date))
                
                if result and result['count'] > 0:
                    score = float(result['avg_marks'])
                    weekly_scores.append(f"{score:.1f}")
                    total_score_sum += score
                    count_weeks_present += 1
                else:
                    # Check if homework was assigned but not submitted? 
                    # For simplicity in this example, we assume "No Data" meant none assigned or done
                    # You can add logic here to distinguish 'Missed' vs 'None Assigned'
                    weekly_scores.append("-")

            # Calculate 6-Week Average
            overall_avg = 0
            if count_weeks_present > 0:
                overall_avg = total_score_sum / count_weeks_present
            
            data[subj_name] = {
                "weekly_scores": weekly_scores,
                "overall_average": f"{overall_avg:.1f}" if count_weeks_present > 0 else "-"
            }
            
        return data

    def _get_weekly_attendance(self, student_id, subjects, num_weeks=6):
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        data = {}

        for subject in subjects:
            subj_name = subject["subject_name"]
            weekly_status = []

            for (start_date, end_date) in week_ranges:
                sql = """
                    SELECT status, COUNT(*) as cnt FROM attendance
                    WHERE student_id = %s AND subject_name = %s 
                    AND attendance_date BETWEEN %s AND %s
                    GROUP BY status
                """
                results = self.db.fetch_all(sql, (student_id, subj_name, start_date, end_date))
                
                # Simple logic: If any absent -> X, else if any late -> T, else O
                status_map = {row['status']: row['cnt'] for row in results}
                if not status_map:
                    display = "-"
                elif status_map.get('absent', 0) > 0:
                    display = "X"
                elif status_map.get('late', 0) > 0:
                    display = "▲"
                else:
                    display = "O"
                
                weekly_status.append(display)
            
            data[subj_name] = weekly_status
        return data

    # ========================================
    # PDF GENERATION
    # ========================================

    def generate_pdf(self, student_id, num_weeks=6):
        # 1. Fetch Data
        student_data, comments = self._get_student_data(student_id)
        if not student_data:
            return None # Or handle error
            
        homework_data = self._get_weekly_homework_data(student_id, student_data["subjects"], num_weeks)
        attendance_data = self._get_weekly_attendance(student_id, student_data["subjects"], num_weeks)

        # 2. Setup PDF
        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(buffer, pagesize=letter, topMargin=30, bottomMargin=20, leftMargin=60)
        elements = []
        
        # Font Registration ( Simplified for robustness )
        self._register_fonts()
        styles = getSampleStyleSheet()
        normal_font = "Pretendard-Regular" if "Pretendard-Regular" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
        bold_font = "Pretendard-Bold" if "Pretendard-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"

        # 3. Header & Student Info
        # (Keeping your existing style logic for consistency)
        header_items = self._create_header(student_data, normal_font, bold_font)
        elements.extend(header_items)
        elements.append(Spacer(1, 20))

        # 4. Attendance Table
        elements.append(Paragraph("Attendance (Weekly)", styles['Heading3']))
        elements.append(Spacer(1, 5))
        
        # Headers: Subject | W1 | W2 | ... | W6
        week_headers = [f"W{i}" for i in range(1, num_weeks + 1)]
        att_table_data = [["Subject"] + week_headers]
        
        for subj_name, statuses in attendance_data.items():
            att_table_data.append([subj_name] + statuses)
            
        t_att = Table(att_table_data, colWidths=[120] + [40]*num_weeks)
        t_att.setStyle(self._get_table_style(len(att_table_data), normal_font, bold_font))
        elements.append(t_att)
        elements.append(Spacer(1, 20))

        # 5. Homework & Scores Table
        elements.append(Paragraph("Homework Performance & Average", styles['Heading3']))
        elements.append(Spacer(1, 5))
        
        # Headers: Subject | W1 | ... | W6 | Total Avg
        score_table_data = [["Subject"] + week_headers + ["6-Week Avg"]]
        
        for subj_name, info in homework_data.items():
            row = [subj_name] + info['weekly_scores'] + [info['overall_average']]
            score_table_data.append(row)
            
        t_scores = Table(score_table_data, colWidths=[120] + [40]*num_weeks + [70])
        t_scores.setStyle(self._get_table_style(len(score_table_data), normal_font, bold_font))
        elements.append(t_scores)
        
        # 6. Comments
        if comments:
            elements.append(Spacer(1, 20))
            elements.append(Paragraph("Comments", styles['Heading3']))
            for c in comments:
                text = f"<b>{c['subject_name']}:</b> {c['comment_text']}"
                elements.append(Paragraph(text, styles['Normal']))
                elements.append(Spacer(1, 5))

        # Build
        pdf.build(elements)
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        # Return Response
        filename = quote(f"{student_data['name']}_WeeklyReport.pdf")
        return {
            "filename": filename,
            "bytes": pdf_bytes
        }

    # Helper methods for cleaner code
    def _register_fonts(self):
        font_paths = [
            "/app/src/fonts/Pretendard-Regular.ttf",
            "../src/fonts/Pretendard-Regular.ttf",
            "src/fonts/Pretendard-Regular.ttf",
            os.path.join(os.path.dirname(__file__), "..", "src", "fonts", "Pretendard-Regular.ttf"),
        ]
        font_found = False
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    pdfmetrics.registerFont(TTFont("Pretendard-Regular", font_path))
                    pdfmetrics.registerFont(TTFont("Pretendard-Bold", font_path.replace("Regular", "Bold")))
                    font_found = True
                    break
                except Exception as e:
                    logger.warning(f"Failed to load font from {font_path}: {e}")
                    continue
        
        if not font_found:
            logger.warning("Pretendard fonts not found, using default fonts.")
        

    def _create_header(self, student_data, normal_font, bold_font):
        """
        Creates the top section of the PDF: 
        1. Blue Title Bar
        2. Logo (Left) + Student Info Table (Right)
        """
        header_elements = []

        # --- 1. Blue Title Bar ---
        title_text = "Sehan Academy IB M&T Assessment Report"
        title_table = Table([[title_text]], colWidths=[520], rowHeights=[30])
        title_table.setStyle(TableStyle([
            ("TEXTCOLOR", (0, 0), (-1, -1), "#FFFFFF"),      # White text
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),           # Center text
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),          # Vertical center
            ("BACKGROUND", (0, 0), (0, -1), "#6AA4DB"),      # Blue header background
            ("FONTNAME", (0, 0), (-1, -1), normal_font),
            ("FONTSIZE", (0, 0), (-1, -1), 16),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        header_elements.append(title_table)
        header_elements.append(Spacer(1, 20))

        # --- 2. Logo Logic ---
        # Try to find the logo in different paths (robustness)
        logo_paths = [
            "/app/src/images/logo.png",
            "src/images/logo.png",
            "../src/images/logo.png",
            os.path.join(os.path.dirname(__file__), "..", "src", "images", "logo.png"),
        ]
        
        sehan_logo = None
        for path in logo_paths:
            if os.path.exists(path):
                try:
                    # Resize logo to fit: 2.2 inch wide, 0.5 inch high
                    sehan_logo = Image(path, width=2.2 * inch, height=0.5 * inch)
                    break
                except Exception as e:
                    logger.warning(f"Logo found at {path} but failed to load: {e}")
                    continue
        
        # Fallback if image fails or doesn't exist
        if sehan_logo is None:
            logo_style = ParagraphStyle("LogoStyle", fontName=bold_font, fontSize=16)
            sehan_logo = Paragraph("<b>Sehan IB</b>", logo_style)

        # --- 3. Student Info Table (Right Side) ---
        # Data: Name, School, Grade
        info_data = [
            ["Name", student_data.get("name", "")],
            ["School", student_data.get("school", "")],
            ["Grade", student_data.get("grade", "")],
        ]
        
        # Create the small table
        info_table = Table(info_data, colWidths=[0.9 * inch, 3 * inch])
        info_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), "#E5F0FD"),      # Light blue label column
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, -1), normal_font),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.black),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
        ]))

        # --- 4. Wrapper Table (Layout) ---
        # Puts Logo in Col 0 (Left) and Info Table in Col 1 (Right)
        wrapper_data = [[sehan_logo, info_table]]
        wrapper_table = Table(wrapper_data, colWidths=[2.7 * inch, 4.3 * inch])
        wrapper_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), # Align vertically
            ("LEFTPADDING", (0,0), (-1,-1), 0),     # Remove extra padding
            ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ]))
        
        header_elements.append(wrapper_table)
        
        return header_elements

    def _get_table_style(self, num_rows, normal_font, bold_font):
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), bold_font),
            ('FONTNAME', (0, 1), (-1, -1), normal_font),
            ('GRID', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('BACKGROUND', (0, 1), (-1, -1), TABLE_BACKGROUND_COLOR),
        ])