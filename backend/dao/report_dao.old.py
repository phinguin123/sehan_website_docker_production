from utils.utils import (
    get_current_week_number, 
    get_previous_week_dates,
    get_week_date_range,
    get_all_weeks_date_ranges,
    get_week_number_from_date
)
import tempfile
import zipfile
import io
import os
from flask import Response, make_response
from datetime import timedelta, datetime
import logging

# Configure logger for report_dao
logger = logging.getLogger(__name__)


from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.colors import LinearSegmentedColormap
import numpy as np

from urllib.parse import quote


from sehan_kakao_alimtalk import send_report_message


import re

TEXT_COLOR = "#1A374D"
TABLE_HEADER_COLOR = "#A7C6ED"
TABLE_BACKGROUND_COLOR = "#E5F0FD"
GENERAL_BACKGROUND_COLOR = "#F0F4F7"
BORDER_COLOR = "#60A3D9"


class ReportDAO:
    def __init__(self, db_helper):
        self.db = db_helper

    # ========================================
    # WEEK-BASED METHODS (NEW)
    # ========================================
    
    def _get_student_homework_data_by_weeks(self, subject_data, student_id, num_weeks=6):
        """
        Get student homework data aggregated by weeks instead of days.
        
        Args:
            subject_data: List of subjects with subject_id and level_id
            student_id: The student ID
            num_weeks: Number of weeks to fetch (default 6)
        
        Returns:
            List of dictionaries with week-based homework data
        """
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        student_homework_data = []
        
        for subject in subject_data:
            subject_id = subject["subject_id"]
            weekly_data = {}
            
            for week_num, (start_date, end_date) in enumerate(week_ranges, start=1):
                # Query for homework submissions in this week
                sql = """
                    SELECT 
                        shs.marks, 
                        shs.raw_marks, 
                        h.type, 
                        h.assignedDate,
                        COUNT(*) as homework_count
                    FROM 
                        student_homework_submission AS shs
                    JOIN 
                        homework AS h ON shs.homework_id = h.id
                    WHERE 
                        shs.student_id = %s
                        AND h.subject_id = %s
                        AND h.assignedDate BETWEEN %s AND %s
                        AND h.type = 'homework'
                    GROUP BY 
                        h.assignedDate, shs.marks, shs.raw_marks, h.type
                """
                
                results = self.db.fetch_all(
                    sql,
                    (student_id, subject_id, start_date, end_date)
                )
                
                # Aggregate data for this week
                if results:
                    total_marks = sum([row['marks'] or 0 for row in results])
                    total_raw_marks = sum([row['raw_marks'] or 0 for row in results])
                    count = len(results)
                    
                    weekly_data[f"week_{week_num}"] = {
                        "avg_marks": round(total_marks / count, 1) if count > 0 else 0,
                        "avg_raw_marks": round(total_raw_marks / count, 1) if count > 0 else 0,
                        "homework_count": count,
                        "submissions": results
                    }
                else:
                    weekly_data[f"week_{week_num}"] = {
                        "avg_marks": 0,
                        "avg_raw_marks": 0,
                        "homework_count": 0,
                        "submissions": []
                    }
            
            student_homework_data.append({subject_id: weekly_data})
        
        return student_homework_data

    def _get_assigned_homework_data_by_weeks(self, subject_data, grade_id, num_weeks=6):
        """
        Get assigned homework data aggregated by weeks.
        
        Args:
            subject_data: List of subjects with subject_id and level_id
            grade_id: The grade ID
            num_weeks: Number of weeks to fetch (default 6)
        
        Returns:
            List of dictionaries with week-based assigned homework data
        """
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        assigned_homework_data = []
        
        for item in subject_data:
            subject_id = item["subject_id"]
            level_id = item["level_id"]
            weekly_data = {}
            
            for week_num, (start_date, end_date) in enumerate(week_ranges, start=1):
                # SQL query to fetch homework for the specified subject, level, and grade
                query = """
                    SELECT assignedDate, COUNT(*) as homework_count
                    FROM homework
                    WHERE subject_id = %s
                    AND grade_id = %s
                    AND (level_id = %s OR level_id = 3)
                    AND assignedDate BETWEEN %s AND %s
                    GROUP BY assignedDate
                """
                
                results = self.db.fetch_all(
                    query, (subject_id, grade_id, level_id, start_date, end_date)
                )
                
                # Store homework count for this week
                weekly_data[f"week_{week_num}"] = {
                    "homework_count": sum([row['homework_count'] for row in results]),
                    "dates": [result["assignedDate"].strftime("%Y-%m-%d") for result in results]
                }
            
            assigned_homework_data.append({subject_id: weekly_data})
        
        return assigned_homework_data

    def _get_student_exam_scores_by_weeks(self, student_id, subject_data, num_weeks=6):
        """
        Get student exam scores aggregated by weeks.
        
        Args:
            student_id: The student ID
            subject_data: List of subjects with subject_id
            num_weeks: Number of weeks to fetch (default 6)
        
        Returns:
            List of dictionaries with week-based exam scores
        """
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        student_exam_scores = []
        
        for subject in subject_data:
            subject_id = subject["subject_id"]
            weekly_scores = {}
            
            for week_num, (start_date, end_date) in enumerate(week_ranges, start=1):
                # SQL query to fetch exam scores for this week
                query = """
                    SELECT 
                        shs.marks, shs.raw_marks
                    FROM 
                        student_homework_submission shs
                    JOIN 
                        homework h ON shs.homework_id = h.id
                    WHERE 
                        shs.student_id = %s 
                        AND h.subject_id = %s 
                        AND h.type = 'exam'
                        AND h.assignedDate BETWEEN %s AND %s
                    ORDER BY 
                        shs.submission_date DESC
                    LIMIT 1
                """
                
                result = self.db.fetch_one(
                    query, (student_id, subject_id, start_date, end_date)
                )
                
                if result:
                    weekly_scores[f"week_{week_num}"] = f"{result['marks'] or 0}({result['raw_marks'] or 0})"
                else:
                    weekly_scores[f"week_{week_num}"] = ""
            
            student_exam_scores.append({subject_id: weekly_scores})
        
        return student_exam_scores

    def _get_attendance_data_by_weeks(self, student_id, subject_data, num_weeks=6):
        """
        Get attendance data aggregated by weeks.
        
        Args:
            student_id: The student ID
            subject_data: List of subjects with subject_name
            num_weeks: Number of weeks to fetch (default 6)
        
        Returns:
            Dictionary with subject-wise weekly attendance
        """
        week_ranges = get_all_weeks_date_ranges(num_weeks)
        subjects_attendance = {}
        
        for subject in subject_data:
            subject_name = subject["subject_name"]
            weekly_attendance = {}
            
            for week_num, (start_date, end_date) in enumerate(week_ranges, start=1):
                query = """
                    SELECT status, COUNT(*) as count
                    FROM attendance 
                    WHERE student_id = %s 
                    AND subject_name = %s
                    AND attendance_date BETWEEN %s AND %s
                    GROUP BY status
                """
                
                results = self.db.fetch_all(
                    query, (student_id, subject_name, start_date, end_date)
                )
                
                # Calculate attendance summary for the week
                status_counts = {row['status']: row['count'] for row in results}
                total_classes = sum(status_counts.values())
                
                # Determine overall status for the week
                if total_classes == 0:
                    weekly_status = ""
                elif status_counts.get('absent', 0) > 0:
                    weekly_status = f"X ({status_counts.get('absent')})"
                elif status_counts.get('late', 0) > 0:
                    weekly_status = f"▲ ({status_counts.get('late')})"
                elif status_counts.get('present', 0) == total_classes:
                    weekly_status = "O"
                else:
                    weekly_status = f"O ({status_counts.get('present', 0)}/{total_classes})"
                
                weekly_attendance[f"week_{week_num}"] = weekly_status
            
            subjects_attendance[subject_name] = weekly_attendance
        
        return subjects_attendance

    def _create_homework_entries_by_weeks(
        self,
        average_scores,
        assigned_homework_data,
        student_homework_data,
        student_exam_scores,
        subject_list,
        num_weeks=6
    ):
        """
        Create homework entries organized by weeks instead of days.
        
        Returns:
            List of homework entries with weekly data
        """
        homework_entries = []
        
        for subject in subject_list:
            subject_id = subject["subject_id"]
            subject_name = subject["subject_name"]
            
            # Get data for this subject
            assigned_data = next(
                (item[subject_id] for item in assigned_homework_data if subject_id in item),
                {}
            )
            student_data = next(
                (item[subject_id] for item in student_homework_data if subject_id in item),
                {}
            )
            exam_scores = next(
                (item[subject_id] for item in student_exam_scores if subject_id in item),
                {}
            )
            
            # Prepare weekly scores
            weekly_scores = []
            for week_num in range(1, num_weeks + 1):
                week_key = f"week_{week_num}"
                
                assigned_week = assigned_data.get(week_key, {})
                student_week = student_data.get(week_key, {})
                
                if assigned_week.get("homework_count", 0) > 0:
                    if student_week.get("homework_count", 0) > 0:
                        avg_marks = student_week["avg_marks"]
                        avg_raw = student_week["avg_raw_marks"]
                        weekly_scores.append(f"{avg_marks:.1f}({avg_raw:.1f})")
                    else:
                        weekly_scores.append("미제출")
                else:
                    weekly_scores.append("숙제없음")
            
            # Add exam scores (aggregate across all weeks or just specific weeks)
            exam_score_display = exam_scores.get("week_6", "") or "미제출"  # Default to week 6 for final exam
            
            # Get average score for this subject from the exam average
            avg_score_dict = next(
                (item for item in average_scores if subject_id in item),
                {subject_id: 0}
            )
            average_score = list(avg_score_dict.values())[0]
            
            homework_entries.append({
                "subject_name": subject_name,
                "weekly_scores": weekly_scores,
                "student_exam_score": exam_score_display,
                "average_exam_score": average_score,
            })
        
        return homework_entries

    # ========================================
    # ORIGINAL DAY-BASED METHODS (KEPT FOR BACKWARD COMPATIBILITY)
    # ========================================

    def _get_student_exam_score_per_subject(self, student_id, subject_data):
        # start_date, end_date = get_week_dates(0, 6) # 0, 6 = > this week until sunday
        start_date, end_date = get_previous_week_dates()
        end_date = end_date + timedelta(days=3)

        subject_scores = []

        for subject in subject_data:
            subject_id = subject["subject_id"]
            # SQL query to fetch the latest marks and raw marks for exams
            query = """
                SELECT 
                    shs.marks, shs.raw_marks
                FROM 
                    student_homework_submission shs
                JOIN 
                    homework h ON shs.homework_id = h.id
                WHERE 
                    shs.student_id = %s 
                    AND h.subject_id = %s 
                    AND h.type = 'Exam'
                    AND h.assignedDate BETWEEN %s AND %s
                ORDER BY 
                    shs.submission_date DESC
                LIMIT 1
            """
            result = self.db.fetch_one(
                query, (student_id, subject_id, start_date, end_date)
            )

            # Format the result
            if result:
                formatted_score = f"{result['marks'] or 0}({result['raw_marks'] or 0})"
            else:
                formatted_score = ""  # Default for no submission

            subject_scores.append({subject_id: formatted_score})

        return subject_scores

    def _get_student_homework_data(self, subject_data, student_id):
        start_date, end_date = get_previous_week_dates()
        # Extend end_date to include 5 days (Monday to Friday)
        end_date = end_date + timedelta(days=1)

        student_homework_data = []

        for subject in subject_data:
            subject_id = subject["subject_id"]
            sql = """
                SELECT 
                    shs.marks, 
                    shs.raw_marks, 
                    h.type, 
                    h.assignedDate
                FROM 
                    student_homework_submission AS shs
                JOIN 
                    homework AS h ON shs.homework_id = h.id
                JOIN 
                    (
                        SELECT 
                            MAX(shs.id) AS latest_homework_id,
                            h.assignedDate,
                            shs.raw_marks,
                            shs.marks
                        FROM 
                            student_homework_submission AS shs
                        JOIN 
                            homework AS h ON shs.homework_id = h.id
                        WHERE 
                            shs.student_id = %s
                            AND h.subject_id = %s
                            AND h.assignedDate BETWEEN %s AND %s
                        GROUP BY 
                            h.assignedDate
                    ) AS latest_homework 
                    ON shs.id = latest_homework.latest_homework_id
                WHERE 
                    shs.student_id = %s
                    AND h.subject_id = %s
                    AND h.type = "homework";
            """
            results = self.db.fetch_all(
                sql,
                (student_id, subject_id, start_date, end_date, student_id, subject_id),
            )

            formatted_data = {
                subject_id: [
                    {
                        "marks": row["marks"],
                        "raw_marks": row["raw_marks"],
                        "assignedDate": row["assignedDate"].strftime("%Y-%m-%d"),
                    }
                    for row in results
                ]
            }
            student_homework_data.append(formatted_data)

        return student_homework_data

    def _get_assigned_homework_data(self, subject_data, grade_id):
        # Get the start and end dates for the query
        start_date, end_date = get_previous_week_dates()
        # Extend end_date to include 5 days (Monday to Friday)
        end_date = end_date + timedelta(days=1)

        assigned_homework_data = []

        for item in subject_data:
            subject_id = item["subject_id"]
            level_id = item["level_id"]

            # SQL query to fetch homework for the specified subject, level, and grade
            query = """
                SELECT assignedDate
                FROM homework
                WHERE subject_id = %s
                AND grade_id = %s
                AND (level_id = %s OR level_id = 3) -- Either student's level or any level which is 3 SL/HL
                AND assignedDate BETWEEN %s AND %s
            """

            results = self.db.fetch_all(
                query, (subject_id, grade_id, level_id, start_date, end_date)
            )

            # Collect assigned dates for the subject
            subject_data = {
                subject_id: [
                    result["assignedDate"].strftime("%Y-%m-%d") for result in results
                ]
            }
            assigned_homework_data.append(subject_data)

        return assigned_homework_data

    # def get_average_scores(self, subjects):
    #     start_date, end_date = get_previous_week_dates()

    #     average_scores = []

    #     for subject in subjects:
    #         query = """
    #             SELECT
    #                 h.subject,
    #                 AVG(shs.raw_marks) AS average_score
    #             FROM
    #                 student_homework_submission shs
    #             JOIN
    #                 homework h ON shs.homework_id = h.id
    #             WHERE
    #                 h.subject = %s
    #                 AND h.assignedDate BETWEEN %s AND %s
    #                 AND shs.marks IS NOT NULL
    #             GROUP BY
    #                 h.subject;
    #         """

    #         result = self.db.fetch_one(query, (subject, start_date, end_date))

    #         if result:
    #             average_scores.append(
    #                 {result["subject"]: round(float(result["average_score"]), 1)}
    #             )
    #         else:
    #             average_scores.append({subject: 0})

    #     return average_scores

    def _create_homework_entries(
        self,
        average_scores,
        assigned_homework_data,
        student_homework_data,
        dates,
        student_exam_scores,
        subject_list,
    ):
        homework_entries = []
        ###print("dates", dates)

        # Iterate over average_scores and match with student_exam_scores
        for avg_entry, exam_score_entry, subject in zip(
            average_scores, student_exam_scores, subject_list
        ):
            subject_id, average_score = list(avg_entry.items())[0]
            _, exam_score = list(exam_score_entry.items())[0]
            subject_name = subject["subject_name"]

            # Find assigned homework dates and student scores for the subject
            assigned_dates = next(
                (
                    item[subject_id]
                    for item in assigned_homework_data
                    if subject_id in item
                ),
                [],
            )
            student_scores = next(
                (
                    item[subject_id]
                    for item in student_homework_data
                    if subject_id in item
                ),
                [],
            )
            # print("assigned_dates", assigned_dates)
            # print("student scores", student_scores)

            # Prepare 'scores' list based on assigned dates
            scores_list = []
            for date in dates:
                if date in assigned_dates:
                    # Check if there's a student score for the assigned date
                    score_data = next(
                        (
                            score
                            for score in student_scores
                            if score["assignedDate"] == date
                        ),
                        None,
                    )

                    if score_data:
                        scores_list.append(
                            f"{score_data['marks']}({score_data['raw_marks']})"
                        )
                    else:
                        scores_list.append("미제출")  # Assigned date but not submitted
                else:
                    scores_list.append("숙제없음")  # No homework assigned for this date

            # Use the exam score from student_exam_scores
            if not exam_score:
                student_score = "미제출"
            else:
                student_score = exam_score

            # Append structured entry for each subject
            homework_entries.append(
                {
                    "subject_name": subject_name,
                    "scores": scores_list,
                    "student_score": student_score,
                    "average_score": average_score,
                }
            )

        return homework_entries

    def _get_exam_average_scores(self, subject_list, grade_id):
        # start_date, end_date = get_week_dates(0, 6) # 0, 6 = > this week until sunday
        start_date, end_date = get_previous_week_dates()
        end_date = end_date + timedelta(days=3)
        # print("dates",start_date, end_date)

        # Query to get all relevant homework entries for exams
        query = """
        SELECT h.id AS homework_id, h.subject_id, shs.raw_marks
        FROM homework h
        JOIN student_homework_submission shs ON h.id = shs.homework_id
        WHERE h.type = 'Exam' AND h.grade_id = %s
            AND h.assignedDate >= %s AND h.assignedDate <= %s
        """

        # Query parameters
        params = (grade_id, start_date, end_date)

        results = self.db.fetch_all(query, params)

        # Initialize a dictionary to hold total marks and counts for averaging
        scores = {
            subject["subject_id"]: {"total": 0, "count": 0} for subject in subject_list
        }

        # Process the query results
        for row in results:
            subject_id = row["subject_id"]
            raw_marks = row["raw_marks"]

            if subject_id in scores and raw_marks is not None:
                scores[subject_id]["total"] += raw_marks
                scores[subject_id]["count"] += 1

        # Calculate averages and format the result
        average_scores = [
            {
                subject["subject_id"]: (
                    round(
                        scores[subject["subject_id"]]["total"]
                        / scores[subject["subject_id"]]["count"],
                        1,
                    )
                    if scores[subject["subject_id"]]["count"] > 0
                    else 0
                )
            }
            for subject in subject_list
        ]

        return average_scores

    def _create_bar_chart_test(self, subjects_data, scores):
        fig, ax = plt.subplots(figsize=(10, 0.8 * len(subjects_data) + 1))
        ax.set_facecolor("#FFFFFF")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

        subject_names = [subject["subject_name"] for subject in subjects_data]
        y_positions = np.arange(len(subject_names))

        ax.set_yticks(y_positions)
        ax.set_yticklabels([])
        ax.yaxis.set_tick_params(length=0, labelbottom=False)
        ax.set_xlim(0, 100)
        ax.set_xticks([0, 20, 40, 60, 80, 100])
        ax.xaxis.grid(True, linestyle="--", alpha=0.7, zorder=1)

        colors = ["#d7f1ff", "#99cff2", "#77c3f1"]
        custom_cmap = LinearSegmentedColormap.from_list(
            "custom_blue_white", colors, N=256
        )

        for i, (score, subject) in enumerate(zip(scores, subjects_data)):
            bar_height = 0.8
            x = 0
            y = i

            # Create gradient fill using imshow
            print(subject, x, score, y, y + bar_height)
            gradient = np.linspace(0, 1, 256).reshape(1, -1)
            ax.imshow(
                gradient,
                extent=[x, score, y, y + bar_height],
                aspect="auto",
                cmap=custom_cmap,  # Try other colormaps like "coolwarm", "plasma", etc.
                zorder=2,
                alpha=0.7,
            )

            # Add bar border
            rect = patches.Rectangle(
                (x, y),
                score,
                bar_height,
                facecolor="none",
                linewidth=2,
                zorder=3,
            )
            ax.add_patch(rect)

            # Subject label inside the bar
            ax.text(
                x + 2,
                y + bar_height / 2,
                subject["subject_name"],
                ha="left",
                va="center",
                fontsize=15,
                color="black",
                zorder=4,
            )

            # Optional: show score at end of bar
            # ax.text(
            #     score + 1,
            #     y + bar_height / 2,
            #     f"{score}",
            #     ha="left",
            #     va="center",
            #     fontsize=13,
            #     color="#333",
            #     zorder=4,
            # )

        ax.invert_yaxis()  # To match your original layout (top to bottom)

        ax.set_ylim(-0.5, len(subjects_data) + 0.5)

        # Save the plot to a BytesIO object as PNG
        img_stream = io.BytesIO()
        plt.savefig(img_stream, format="png", bbox_inches="tight")
        img_stream.seek(0)
        plt.close(fig)

        return img_stream

    # Function to create the bar chart and save it as an image
    def _create_bar_chart(self, subjects_data, scores):
        # subjects = ['Business', 'Chemistry', 'Physics']
        # scores = [85, 92, 76]
        # Create a figure and axis

        fig, ax = plt.subplots(figsize=(10, len(subjects_data)))
        ax.set_facecolor("#FCF7E3")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

        subject_names = [subject["subject_name"] for subject in subjects_data]

        # Create the bar chart
        bars = ax.barh(
            subject_names,
            scores,
            color="#FFE699",
            edgecolor="#06abf4",
            zorder=3,
            linewidth=2,
        )

        ax.set_yticklabels([])
        ax.yaxis.set_tick_params(length=0, labelbottom=False)

        for bar, subject in zip(bars, subjects_data):
            # Get the width (score) and position of each bar
            width = bar.get_width()
            height = bar.get_height()
            x_pos = 2  # Position text inside the bar (adjust '2' for left padding)
            y_pos = bar.get_y() + height / 2  # Center vertically within the bar

            # Add the subject label inside the bar, aligned to the left
            ax.text(
                x_pos,
                y_pos,
                subject["subject_name"],
                ha="left",
                va="center",
                fontsize=15,
                color="black",
            )

        # Add labels and title
        # ax.set_xlabel('Subject')
        # ax.set_ylabel('Score')

        # Set x-axis limits and ticks
        ax.set_xlim(0, 100)
        ax.set_xticks([0, 20, 40, 60, 80, 100])

        # Add grid for better readability
        ax.xaxis.grid(True, linestyle="--", alpha=0.7, zorder=1)
        ax.invert_yaxis()  # Invert y-axis for better readability (optional)

        # Save the plot to a BytesIO object as PNG
        img_stream = io.BytesIO()
        plt.savefig(img_stream, format="png", bbox_inches="tight")
        img_stream.seek(0)  # Move the pointer to the beginning of the stream
        plt.close(fig)

        return img_stream

    def _extract_score(self, value):
        # If the value is empty, return 0
        if value == "":
            return 0
        # If the value contains a number in parentheses, extract the number inside
        match = re.search(r"\((\d+)\)", value)
        if match:
            return int(match.group(1))
        # Otherwise, return the number as is
        return int(value)

    def _get_student_data(self, student_id):
        start_date, end_date = get_previous_week_dates()
        # Extend end_date to include 5 days (Monday to Friday)
        # get_previous_week_dates() returns Monday to Thursday (4 days), so add 1 day for Friday
        end_date = end_date + timedelta(days=1)

        sql = """
            SELECT 
                s.student_id,
                s.name,
                s.duplicate,
                s.grade,
                g.grade_id,
                s.school,
                sub.subject_name,
                sub.subject_id,
                l.level_name,
                stc.level_id,
                sc.comment_text
            FROM 
                students s
            JOIN 
                student_classes stc ON s.student_id = stc.student_id
            JOIN 
                classes c ON stc.class_id = c.class_id
            JOIN 
                subjects sub ON c.subject_id = sub.subject_id
            JOIN
                grades g ON s.grade = g.grade
            JOIN
                levels l ON stc.level_id = l.id
            LEFT JOIN 
                student_comments sc ON s.student_id = sc.student_id AND sub.subject_name = (SELECT t.subject FROM teachers t WHERE t.id = sc.teacher_id)
            WHERE 
                s.student_id = %s
            ORDER BY 
                s.student_id, sub.subject_name;
        """
        raw_student_data = self.db.fetch_all(sql, (student_id))

        # Dictionary to hold structured student data
        students_dict = {}

        # Iterate over each row in the raw data
        for row in raw_student_data:
            student_id = row["student_id"]

            # Initialize a new entry for each student if not already present
            if student_id not in students_dict:
                students_dict[student_id] = {
                    "student_id": student_id,
                    "name": row["name"],
                    "grade": row["grade"],
                    "grade_id": row["grade_id"],
                    "school": row["school"],
                    "subjects": [],  # Dict to hold subjects and comments
                }

            # Add the subject and comment to the 'subjects' list
            if not any(
                subject["subject_name"] == row["subject_name"]
                for subject in students_dict[student_id]["subjects"]
            ):
                students_dict[student_id]["subjects"].append(
                    {
                        "subject_name": row["subject_name"],
                        "subject_id": row["subject_id"],
                        "level_name": row["level_name"],
                        "level_id": row["level_id"],
                        "comment_text": row["comment_text"],
                    }
                )

        # print("\nfinal student_data", students_dict)
        query = """
            SELECT * 
            FROM attendance 
            WHERE student_id = %s AND attendance_date BETWEEN %s AND %s
            ORDER BY attendance_date, created_at ASC;
        """
        raw_attendance_data = self.db.fetch_all(
            query, (student_id, start_date, end_date)
        )

        query = """
            SELECT hs.marks, hs.raw_marks, h.subject_id, h.type FROM student_homework_submission hs
            JOIN homework h ON hs.homework_id = h.id
            WHERE hs.student_id = %s AND assignedDate BETWEEN %s AND %s
        """
        raw_homework_data = self.db.fetch_all(
            query, ((student_id, start_date, end_date))
        )

        # Fetch comments
        query = """
            SELECT sc.comment_text, sc.subject_name
            FROM student_comments sc
            INNER JOIN (
                SELECT subject_name, MAX(comment_id) AS latest_comment_id
                FROM student_comments
                WHERE student_id = %s
                GROUP BY subject_name
            ) latest_comments
            ON sc.subject_name = latest_comments.subject_name AND sc.comment_id = latest_comments.latest_comment_id
            ORDER BY sc.subject_name;
        """
        comments = self.db.fetch_all(query, (student_id))

        return (
            students_dict.get(student_id),
            raw_attendance_data,
            raw_homework_data,
            comments,
        )

    def generate_pdf_weekly(self, student_id, num_weeks=6, report_type="weekly"):
        """
        Generate a week-based PDF report for a student.
        
        Args:
            student_id: The student ID
            num_weeks: Number of weeks to include in the report (default 6)
            report_type: Type of report - "weekly" or "cumulative"
        
        Returns:
            Response object with the PDF
        """
        # Get basic student data
        student_data, raw_attendance_data, raw_homework_data, comments = (
            self._get_student_data(student_id)
        )
        
        # Register fonts
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
        
        # Current week number for the report title
        current_week_number = get_current_week_number()
        
        # File name
        filename = f"{student_data['name']}_weeks_1-{num_weeks}_report.pdf"
        safe_filename = quote(filename)
        
        # Create PDF document
        response = make_response()
        response.headers["Content-Disposition"] = (
            f"inline; filename*=UTF-8''{safe_filename}"
        )
        response.headers["Content-Type"] = "application/pdf"
        
        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(
            buffer, pagesize=letter, topMargin=30, bottomMargin=20, leftMargin=60
        )
        
        styles = getSampleStyleSheet()
        regular_font = "Pretendard-Regular" if font_found else "Helvetica"
        bold_font = "Pretendard-Bold" if font_found else "Helvetica-Bold"
        
        default_style = ParagraphStyle(
            "KoreanStyle",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=12,
        )
        
        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Title"],
            fontName=regular_font,
            fontSize=16,
            alignment=1,
        )
        
        sub_heading_style = ParagraphStyle(
            "SubHeadingStyle",
            parent=styles["Heading3"],
            fontName=bold_font,
            fontSize=12,
        )
        
        elements = []
        
        # Title
        title_data = [[f"Sehan Academy IB M&T Assessment Report (Weeks 1-{num_weeks})"]]
        title_table = Table(title_data, colWidths=[520], rowHeights=[30])
        title_table.setStyle(
            TableStyle([
                ("TEXTCOLOR", (0, 0), (-1, -1), "#FFFFFF"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (0, -1), "#6AA4DB"),
                ("FONTNAME", (0, 0), (-1, -1), regular_font),
                ("FONTSIZE", (0, 0), (-1, -1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ])
        )
        elements.append(title_table)
        elements.append(Spacer(1, 20))
        
        # Logo and student info (same as original)
        logo_paths = [
            "/app/src/images/logo.png",
            "../src/images/logo.png",
            "src/images/logo.png",
            os.path.join(os.path.dirname(__file__), "..", "src", "images", "logo.png"),
        ]
        sehan_logo = None
        for logo_path in logo_paths:
            if os.path.exists(logo_path):
                try:
                    sehan_logo = Image(logo_path, width=2.2 * inch, height=0.5 * inch)
                    break
                except Exception as e:
                    logger.warning(f"Failed to load logo from {logo_path}: {e}")
                    continue
        
        if sehan_logo is None:
            logo_style = ParagraphStyle(
                "LogoStyle",
                parent=styles["Normal"],
                fontName=bold_font,
                fontSize=16,
                alignment=1,
            )
            sehan_logo = Paragraph("<b>Sehan IB</b>", logo_style)
        
        # Student info table
        student_info_data = [
            ["Name", student_data["name"]],
            ["School", student_data.get("school", "Unknown School")],
            ["Grade", student_data["grade"]],
        ]
        student_info_table = Table(student_info_data, colWidths=[0.9 * inch, 3 * inch])
        student_info_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), TABLE_BACKGROUND_COLOR),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, -1), regular_font),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.black),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
            ])
        )
        student_info_table.hAlign = "RIGHT"
        
        student_info_combined_data = [[sehan_logo, student_info_table]]
        combined_table = Table(student_info_combined_data, colWidths=[2.7 * inch, 4.3 * inch])
        combined_table.setStyle(
            TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")])
        )
        combined_table.hAlign = "LEFT"
        elements.append(combined_table)
        elements.append(Spacer(1, 12))
        
        # Subjects
        elements.append(Paragraph("Subjects", sub_heading_style))
        subjects = ", ".join([subject["subject_name"] for subject in student_data["subjects"]])
        subjects_data = [[subjects]]
        subjects_table = Table(subjects_data, colWidths=[480])
        subjects_table.setStyle(
            TableStyle([
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, -1), regular_font),
                ("FONTSIZE", (0, 0), (-1, -1), 12),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.black),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        subjects_table.hAlign = "LEFT"
        elements.append(subjects_table)
        elements.append(Spacer(1, 2))
        
        # Attendance table (week-based)
        elements.append(Paragraph("Attendance", sub_heading_style))
        week_headers = [f"Week {i}" for i in range(1, num_weeks + 1)]
        attendance_data = [["과목/주차"] + week_headers]
        
        # Get week-based attendance
        subjects_attendance = self._get_attendance_data_by_weeks(
            student_id, student_data["subjects"], num_weeks
        )
        
        sorted_subjects_attendance = dict(sorted(subjects_attendance.items()))
        
        for subject, weekly_attendance in sorted_subjects_attendance.items():
            row_data = [subject]
            for week_num in range(1, num_weeks + 1):
                week_key = f"week_{week_num}"
                row_data.append(weekly_attendance.get(week_key, ""))
            attendance_data.append(row_data)
        
        attendance_table = Table(attendance_data, colWidths=[82.7])
        attendance_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_COLOR),
                ("TEXTCOLOR", (0, 0), (-1, 0), "#FFFFFF"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), bold_font),
                ("BACKGROUND", (0, 1), (0, -1), TABLE_BACKGROUND_COLOR),
                ("GRID", (0, 0), (-1, -1), 1, TABLE_HEADER_COLOR),
                ("TEXTCOLOR", (1, 1), (-1, -1), colors.black),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("FONTNAME", (0, 1), (-1, -1), regular_font),
            ])
        )
        attendance_table.hAlign = "LEFT"
        elements.append(attendance_table)
        elements.append(Spacer(1, 20))
        
        # Homework table (week-based)
        homework_header = [f"Week {i}" for i in range(1, num_weeks + 1)]
        homework_data = [
            ["Homework Status and Scores"] + [""] * (num_weeks - 1) + ["최종평가"],
            ["과목/주차"] + homework_header + ["학생점수", "전체평균"],
        ]
        
        # Get week-based homework data
        subject_list = [
            {"subject_name": s["subject_name"], "subject_id": s["subject_id"]}
            for s in student_data["subjects"]
        ]
        
        average_scores = self._get_exam_average_scores(subject_list, student_data["grade_id"])
        assigned_homework_data = self._get_assigned_homework_data_by_weeks(
            student_data["subjects"], student_data["grade_id"], num_weeks
        )
        student_homework_data = self._get_student_homework_data_by_weeks(
            subject_list, student_id, num_weeks
        )
        student_exam_scores = self._get_student_exam_scores_by_weeks(
            student_id, subject_list, num_weeks
        )
        
        homework_entries = self._create_homework_entries_by_weeks(
            average_scores,
            assigned_homework_data,
            student_homework_data,
            student_exam_scores,
            subject_list,
            num_weeks
        )
        
        for entry in homework_entries:
            subject_name = entry["subject_name"]
            weekly_scores = entry["weekly_scores"]
            student_score = entry["student_exam_score"]
            average_score = entry["average_exam_score"]
            
            homework_data.append(
                [subject_name] + weekly_scores + [student_score, f"{average_score:.1f}"]
            )
        
        homework_table = Table(homework_data)
        homework_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 1), (-1, 1), TABLE_HEADER_COLOR),
                ("TEXTCOLOR", (num_weeks, 0), (1, 0), "#FFFFFF"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 1), bold_font),
                ("TEXTCOLOR", (0, 1), (-1, 1), "#FFFFFF"),
                ("BACKGROUND", (0, 2), (0, -1), TABLE_BACKGROUND_COLOR),
                ("GRID", (0, 1), (-1, -1), 1, TABLE_HEADER_COLOR),
                ("TEXTCOLOR", (1, 2), (-1, -1), colors.black),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("FONTNAME", (0, 2), (-1, -1), regular_font),
                ("BACKGROUND", (0, 0), (num_weeks - 1, 0), None),
                ("SPAN", (0, 0), (num_weeks - 1, 0)),
                ("FONTNAME", (0, 0), (num_weeks - 1, 0), bold_font),
                ("FONTSIZE", (0, 0), (num_weeks - 1, 0), 12),
                ("ALIGN", (0, 0), (num_weeks - 1, 0), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (num_weeks - 1, 0), 5),
                ("LEFTPADDING", (0, 0), (num_weeks - 1, 0), -1),
                ("SPAN", (num_weeks, 0), (num_weeks + 1, 0)),
                ("ALIGN", (num_weeks, 0), (num_weeks + 1, 0), "CENTER"),
                ("FONTNAME", (num_weeks, 0), (num_weeks + 1, 0), bold_font),
                ("FONTSIZE", (num_weeks, 0), (num_weeks + 1, 0), 10),
                ("LINEABOVE", (num_weeks, 0), (num_weeks + 1, 0), 2, "#2408C2"),
                ("LINEBELOW", (num_weeks, -1), (num_weeks + 1, -1), 2, "#2408C2"),
                ("LINEBEFORE", (num_weeks, 0), (num_weeks, -1), 2, "#2408C2"),
                ("LINEAFTER", (num_weeks + 1, 0), (num_weeks + 1, -1), 2, "#2408C2"),
            ])
        )
        homework_table.hAlign = "LEFT"
        elements.append(homework_table)
        elements.append(Spacer(1, 12))
        
        # Comments
        comment_style = ParagraphStyle(
            "custom",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=12,
            leading=16,
            borderColor=TABLE_HEADER_COLOR,
            borderWidth=2,
            leftIndent=10,
            rightIndent=10,
            borderPadding=(10, 10, 10, 10),
            width=100,
        )
        
        custom_sub_heading_style = ParagraphStyle(
            "SubHeadingStyle",
            parent=styles["Heading3"],
            fontName=bold_font,
            fontSize=12,
        )
        
        elements.append(Paragraph(f"<u>Comments:</u>", custom_sub_heading_style))
        elements.append(Spacer(1, 10))
        
        for i, comment in enumerate(comments):
            elements.append(
                Paragraph(
                    f"<font name='{bold_font}'>{comment['subject_name']}:</font> {comment['comment_text'].replace('\n', '<br/>')}",
                    comment_style,
                )
            )
            if i < len(comments) - 1:
                elements.append(Spacer(1, 20))
        
        # Build PDF
        pdf.build(elements)
        
        buffer.seek(0)
        pdf_data = buffer.getvalue()
        buffer.close()
        
        response.data = pdf_data
        return response

    def generate_pdf(self, student_id):
        student_data, raw_attendance_data, raw_homework_data, comments = (
            self._get_student_data(student_id)
        )

        # current_app.logger.info("student data:", student_data)
        ###print("student info for pdf", student_data)
        # Register the Korean font
        # Try multiple possible font paths
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
            logger.warning("Pretendard fonts not found, using default fonts. Korean text may not display correctly.")
            # Use default fonts as fallback
            # The font names will be "Helvetica" or "Times-Roman" which are built-in

        # last week report card
        last_week_number = get_current_week_number() - 1

        # file name
        filename = f"{student_data['name']}_week_{last_week_number}_report.pdf"
        safe_filename = quote(filename)

        # Create PDF document
        response = make_response()
        response.headers["Content-Disposition"] = (
            f"inline; filename*=UTF-8''{safe_filename}"
        )
        response.headers["Content-Type"] = "application/pdf"

        # Create a PDF in memory
        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(
            buffer, pagesize=letter, topMargin=30, bottomMargin=20, leftMargin=60
        )

        # Create elements for the PDF
        styles = getSampleStyleSheet()

        # Use font name based on whether fonts were loaded
        regular_font = "Pretendard-Regular" if font_found else "Helvetica"
        bold_font = "Pretendard-Bold" if font_found else "Helvetica-Bold"

        default_style = ParagraphStyle(
            "KoreanStyle",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=12,
        )

        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Title"],
            fontName=regular_font,
            fontSize=16,
            alignment=1,  # Center alignment
        )

        sub_heading_style = ParagraphStyle(
            "SubHeadingStyle",
            parent=styles["Heading3"],
            fontName=bold_font,
            fontSize=12,
        )

        elements = []

        # Add report title
        title_data = [["Sehan Academy IB M&T Assessment Report"]]

        title_table = Table(title_data, colWidths=[520], rowHeights=[30])
        title_table.setStyle(
            TableStyle(
                [
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, -1),
                        "#FFFFFF",
                    ),  # Set text color to white
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),  # Center alignment
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),  # Vertical alignment
                    ("BACKGROUND", (0, 0), (0, -1), "#6AA4DB"),
                    ("FONTNAME", (0, 0), (-1, -1), regular_font),
                    ("FONTSIZE", (0, 0), (-1, -1), 16),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        elements.append(title_table)
        elements.append(Spacer(1, 20))

        # getting sehan ib logo on the left
        # Try multiple possible logo paths
        logo_paths = [
            "/app/src/images/logo.png",
            "../src/images/logo.png",
            "src/images/logo.png",
            os.path.join(os.path.dirname(__file__), "..", "src", "images", "logo.png"),
        ]
        sehan_logo = None
        for logo_path in logo_paths:
            if os.path.exists(logo_path):
                try:
                    sehan_logo = Image(logo_path, width=2.2 * inch, height=0.5 * inch)
                    break
                except Exception as e:
                    logger.warning(f"Failed to load logo from {logo_path}: {e}")
                    continue
        
        # If logo not found, create a placeholder or skip it
        if sehan_logo is None:
            logger.warning("Logo image not found, using text placeholder")
            # Create a simple text placeholder using Paragraph
            logo_style = ParagraphStyle(
                "LogoStyle",
                parent=styles["Normal"],
                fontName=bold_font,
                fontSize=16,
                alignment=1,  # Center
            )
            sehan_logo = Paragraph("<b>Sehan IB</b>", logo_style)

        # Student Info Table within a bordered box
        student_info_data = [
            ["Name", student_data["name"]],
            ["School", student_data.get("school", "Unknown School")],
            ["Grade", student_data["grade"]],
        ]
        student_info_table = Table(student_info_data, colWidths=[0.9 * inch, 3 * inch])
        student_info_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), TABLE_BACKGROUND_COLOR),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, -1), regular_font),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.black),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
                ]
            )
        )
        student_info_table.hAlign = "RIGHT"

        student_info_combined_data = [
            [
                sehan_logo,
                student_info_table,
            ]  # Image on the left, student info table on the right
        ]

        combined_table = Table(
            student_info_combined_data, colWidths=[2.7 * inch, 4.3 * inch]
        )  # Adjust widths to fit your design
        combined_table.setStyle(
            TableStyle(
                [
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),  # Vertically align content in the middle
                ]
            )
        )
        combined_table.hAlign = "LEFT"
        elements.append(combined_table)
        elements.append(Spacer(1, 12))

        # Subjects box
        elements.append(Paragraph("Subjects", sub_heading_style))
        subjects = ", ".join(
            [subject["subject_name"] for subject in student_data["subjects"]]
        )
        subjects_data = [[subjects]]
        subjects_table = Table(subjects_data, colWidths=[480])
        subjects_table.setStyle(
            TableStyle(
                [
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, -1), regular_font),
                    ("FONTSIZE", (0, 0), (-1, -1), 12),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.black),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        subjects_table.hAlign = "LEFT"
        elements.append(subjects_table)
        elements.append(Spacer(1, 2))

        start_date, end_date = get_previous_week_dates()

        number_of_days_in_one_week = 5

        # Generate the dates for the previous week (Monday to Friday)
        dates = [
            (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            for i in range(number_of_days_in_one_week)
        ]
        # Prepare attendance data with 5 days columns
        attendance_data = [["과목/요일"] + dates]

        # Mapping attendance status
        status_mapping = {
            "present": "O",  # Present becomes 'O'
            "absent": "X",  # Absent becomes 'X'
            "late": "▲",  # Late becomes '▲' (Triangle symbol)
            "excused": "-",  # For etc attendance
            "recorded": "녹화강의",
        }

        # Initialize a dictionary to hold subject-wise attendance
        subjects_attendance = {}
        # print("\nraw attendance data", raw_attendance_data)
        # Iterate through each attendance entry

        for entry in raw_attendance_data:
            subject_name = entry["subject_name"]

            if not any(
                subject_name == subject["subject_name"]
                for subject in student_data["subjects"]
            ):
                continue

            attendance_date = entry["attendance_date"].strftime("%Y-%m-%d")
            status = entry["status"]

            # If the subject is not in the dictionary, initialize it with an empty list for each day
            if subject_name not in subjects_attendance:
                subjects_attendance[subject_name] = {date: None for date in dates}

            # If the attendance date matches one of the dates, update the status
            if attendance_date in dates:
                # print("status", status)
                subjects_attendance[subject_name][attendance_date] = status_mapping.get(
                    status, ""
                )  # Default to empty if no match

        # print("subjects attendance", subjects_attendance)
        sorted_subjects_attendance = dict(sorted(subjects_attendance.items()))

        # Create the final formatted list
        result = []
        for subject, attendance in sorted_subjects_attendance.items():
            formatted_data = [subject] + [
                attendance[date] if attendance[date] else "" for date in dates
            ]
            result.append(formatted_data)

        ###print("\nSubject wise attendance", result)

        for entry in result:
            attendance_data.append(entry)

        # Create table for attendance and marks
        attendance_table = Table(attendance_data, colWidths=[82.7])
        attendance_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_COLOR),
                    ("TEXTCOLOR", (0, 0), (-1, 0), "#FFFFFF"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), bold_font),
                    # ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (0, -1), TABLE_BACKGROUND_COLOR),
                    ("GRID", (0, 0), (-1, -1), 1, TABLE_HEADER_COLOR),
                    (
                        "TEXTCOLOR",
                        (1, 1),
                        (-1, -1),
                        colors.black,
                    ),  # Ensure marks are black for readability
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("FONTNAME", (0, 1), (-1, -1), regular_font),
                ]
            )
        )
        attendance_table.hAlign = "LEFT"
        elements.append(Paragraph("Attendance", sub_heading_style))
        elements.append(
            attendance_table
        )  # Add the attendance table to the PDF elements
        elements.append(Spacer(1, 20))  # Add space after the table

        # Prepare the table with the same structure as the attendance table
        homework_data = [
            ["Homework Status and Scores", "", "", "", "", "", "진단평가"],
            ["과목/요일"] + dates + ["학생점수", "전체평균"],
        ]

        # get average scores for each subject
        subject_list = []
        for subject in student_data["subjects"]:
            subject_list.append(
                {
                    "subject_name": subject["subject_name"],
                    "subject_id": subject["subject_id"],
                }
            )
        ###print("subjects the student take", subject_list)
        ###print("subjects with levels ",student_data['subjects'])
        # average_scores = get_average_scores(subject_list)
        average_scores = self._get_exam_average_scores(
            subject_list, student_data["grade_id"]
        )
        # print("average_scores for each subject", average_scores)

        # get assigned homework data
        assigned_homework_data = self._get_assigned_homework_data(
            student_data["subjects"], student_data["grade_id"]
        )

        ###print("\nassigned homework data", assigned_homework_data)

        # get student marks per homework
        student_homework_data = self._get_student_homework_data(
            subject_list, student_id
        )
        # print("\nstudent homework data", student_homework_data)

        # Example homework data for students (can be dynamically fetched or hardcoded for testing)
        homework_entries = [
            {
                "subject_name": "생물",
                "scores": ["숙제없음", "미제출", "미제출", "숙제없음", "숙제없음"],
                "student_score": "5(68)",
                "average_score": 64.8,
            },
            {
                "subject_name": "수학 AA HL",
                "scores": ["6(73)", "미제출", "미제출", "숙제없음", "숙제없음"],
                "student_score": "3(6)",
                "average_score": 56.8,
            },
            {
                "subject_name": "화학",
                "scores": ["미제출", "1(7)", "4(40)", "숙제없음", "숙제없음"],
                "student_score": "4(50)",
                "average_score": 78.0,
            },
        ]

        # get student's exam scores
        student_exam_scores = self._get_student_exam_score_per_subject(
            student_id, subject_list
        )

        ### print("\nstudent_exam_scores", student_exam_scores)
        # print("assigend hoemwork data", assigned_homework_data)
        # print("student homework data", student_homework_data)

        homework_entries = self._create_homework_entries(
            average_scores,
            assigned_homework_data,
            student_homework_data,
            dates,
            student_exam_scores,
            subject_list,
        )

        for entry in homework_entries:
            subject_name = entry["subject_name"]
            scores = entry["scores"]
            student_score = entry["student_score"]
            average_score = entry["average_score"]

            # Add subject row with scores and student & average scores
            homework_data.append(
                [subject_name] + scores + [student_score, f"{average_score:.1f}"]
            )

        # Create the homework table
        homework_table = Table(homework_data)
        homework_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 1),
                        (-1, 1),
                        TABLE_HEADER_COLOR,
                    ),  # Header row background color
                    ("TEXTCOLOR", (6, 0), (1, 0), "#FFFFFF"),  # Header text color
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),  # Center alignment
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 1),
                        bold_font,
                    ),  # Bold font for the header row
                    ("TEXTCOLOR", (0, 1), (-1, 1), "#FFFFFF"),
                    (
                        "BACKGROUND",
                        (0, 2),
                        (0, -1),
                        TABLE_BACKGROUND_COLOR,
                    ),  # Row background color (light yellow)
                    (
                        "GRID",
                        (0, 1),
                        (-1, -1),
                        1,
                        TABLE_HEADER_COLOR,
                    ),  # Grid around the table
                    (
                        "TEXTCOLOR",
                        (1, 2),
                        (-1, -1),
                        colors.black,
                    ),  # Regular text color for data rows
                    ("FONTSIZE", (0, 0), (-1, -1), 10),  # Font size for the table
                    (
                        "FONTNAME",
                        (0, 2),
                        (-1, -1),
                        regular_font,
                    ),  # Font style for data entries
                    # Section headers in first row
                    ("BACKGROUND", (0, 0), (5, 0), None),
                    ("SPAN", (0, 0), (5, 0)),  # Merge for "Homework status and scores"
                    ("FONTNAME", (0, 0), (5, 0), bold_font),
                    ("FONTSIZE", (0, 0), (5, 0), 12),
                    ("ALIGN", (0, 0), (5, 0), "LEFT"),
                    ("BOTTOMPADDING", (0, 0), (5, 0), 5),
                    ("LEFTPADDING", (0, 0), (5, 0), -1),
                    # 진단평가 styling
                    ("SPAN", (6, 0), (7, 0)),  # ✅ Merge for "진단평가"
                    ("ALIGN", (6, 0), (7, 0), "CENTER"),
                    ("FONTNAME", (6, 0), (7, 0), bold_font),
                    ("FONTSIZE", (6, 0), (7, 0), 10),
                    ("LINEABOVE", (6, 0), (7, 0), 2, "#2408C2"),  # Top edge
                    ("LINEBELOW", (6, -1), (7, -1), 2, "#2408C2"),  # Bottom edge
                    ("LINEBEFORE", (6, 0), (6, -1), 2, "#2408C2"),  # Left edge
                    ("LINEAFTER", (7, 0), (7, -1), 2, "#2408C2"),  # Right edge
                ]
            )
        )
        homework_table.hAlign = "LEFT"
        # Add the homework table to the PDF elements
        elements.append(homework_table)  # Add the homework table to the PDF elements
        elements.append(Spacer(1, 12))  # Add space after the table
        # # Add student name
        # elements.append(Paragraph(f"Report for {student['name']} (Grade: {student['grade']})", default_style))
        # elements.append(Spacer(1, 12))

        # # Prepare attendance and marks data for the table
        # attendance_data = [["Day", "Subject", "Type", "Marks"]]
        # print("homework data", raw_homework_data)
        # for data in raw_homework_data:
        #     attendance_data.append([data['submission_date'].strftime('%A'), data['subject'], data['type'], data['marks']])
        #     print("attendance data", attendance_data)
        # # Create table for attendance and marks
        # table = Table(attendance_data)
        # table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        #                             ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        #                             ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        #                             ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        #                             ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        #                             ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        #                             ('GRID', (0, 0), (-1, -1), 1, colors.black)]))
        # elements.append(table)
        # elements.append(Spacer(1, 12))

        # # Generate marks graph
        # subjects = list(set([data['subject'] for data in homework_data]))
        # homework_marks = [data['marks'] for data in homework_data if data['type'] == 'Homework']
        # exam_marks = [data['marks'] for data in homework_data if data['type'] == 'Exam']

        # x = np.arange(len(subjects))  # the label locations
        # width = 0.35  # the width of the bars

        # print("x shape:", len(x))
        # print("homework_marks shape:", len(homework_marks))
        # plt.bar(x - width/2, homework_marks, width, label='Homework')
        # plt.bar(x + width/2, exam_marks, width, label='Exam')

        # plt.xlabel('Subjects')
        # plt.ylabel('Marks')
        # plt.title('Homework and Exam Marks')
        # plt.xticks(x, subjects)
        # plt.legend()

        # # Save graph to a file
        # plt.savefig('marks_graph.png')
        # plt.close()

        # Add graph to PDF
        # elements.append(Paragraph("Marks Graph:", style={'fontSize': 16}))
        # elements.append(Spacer(1, 12))
        # elements.append(Image('marks_graph.png', width=400, height=200))  # Adjust size as necessary
        # elements.append(Spacer(1, 12))

        scores = [
            self._extract_score(list(item.values())[0]) for item in student_exam_scores
        ]

        img_stream = self._create_bar_chart_test(subject_list, scores)
        # Add the bar chart as an image
        # height 200 = 5
        # height = number of subject * 40
        new_height = 70 + (len(student_data["subjects"]) * 30)
        img = Image(img_stream, width=500, height=new_height)
        img.hAlign = "LEFT"
        elements.append(img)  # Add the image to the elements list
        elements.append(Spacer(1, 12))  # Add space after the image

        custom_sub_heading_style = ParagraphStyle(
            "SubHeadingStyle",
            parent=styles["Heading3"],
            fontName=bold_font,
            fontSize=12,
        )

        comment_style = ParagraphStyle(
            "custom",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=12,
            leading=16,
            borderColor=TABLE_HEADER_COLOR,
            borderWidth=2,
            leftIndent=10,
            rightIndent=10,
            borderPadding=(10, 10, 10, 10),
            width=100,
        )

        # Add comments
        elements.append(Paragraph(f"<u>Comments:</u>", custom_sub_heading_style))
        elements.append(Spacer(1, 10))  # Add space after the image
        # print("comment values", comments)

        for i, comment in enumerate(comments):
            elements.append(
                Paragraph(
                    f"<font name='{bold_font}'>{comment['subject_name']}:</font> {comment['comment_text'].replace('\n', '<br/>')}",
                    comment_style,
                )
            )
            if i < len(comments) - 1:
                elements.append(Spacer(1, 20))

        # Build PDF
        pdf.build(elements)

        buffer.seek(0)
        # Get the PDF data as bytes before closing the buffer
        pdf_data = buffer.getvalue()
        buffer.close()
        
        # Set the response data
        response.data = pdf_data

        # Create a response object
        # response = Response(pdf_data, mimetype='application/pdf')
        # response.headers['Content-Disposition'] = 'inline; filename="report.pdf"'
        return response

    def get_report_attendance(self, grade_name):
        query = """
            SELECT
                a.*,
                s.name AS student_name,
                ts.start_time,
                ts.end_time
            FROM
                students s
                JOIN attendance a ON s.student_id = a.student_id
                JOIN timetable t ON a.timetable_id = t.timetable_id
                JOIN classes c ON t.class_id = c.class_id
                JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
                -- Join with subquery to get only the latest record per group
                JOIN (
                    SELECT
                        student_id,
                        timetable_id,
                        MAX(attendance_id) AS latest_attendance_id
                    FROM
                        attendance
                    GROUP BY
                        student_id,
                        timetable_id,
                        attendance_date
                ) latest
                ON a.student_id = latest.student_id
                AND a.timetable_id = latest.timetable_id
                AND a.attendance_id = latest.latest_attendance_id
            WHERE
                s.grade = %s
            ORDER BY
                a.attendance_date, ts.start_time
        """

        return self.db.fetch_all(query, (grade_name))

    def generate_student_reports(self, output_path=None):
        """
        Generate student reports and return as Response (for synchronous use).
        If output_path is provided, save to file instead (for async Celery tasks).
        
        Args:
            output_path: Optional path to save the ZIP file. If None, returns Response.
        
        Returns:
            Response object if output_path is None, otherwise dict with file info.
        """
        last_week_number = get_current_week_number() - 1

        # Create a temporary file path
        temp_zip_file = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
        temp_zip_path = temp_zip_file.name
        temp_zip_file.close()  # Close the file handle immediately, we'll use the path

        try:
            # Create ZIP file using the path directly
            with zipfile.ZipFile(temp_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:

                sql = """
                    SELECT student_id, name, school from students WHERE grade is not null;
                """
                result = self.db.fetch_all(sql)

                # print("result for zip pdf", result)

                for row in result:
                    student_id = row["student_id"]
                    student_name = row["name"]
                    school = row["school"]

                    # just for testing
                    # if student_id > 333:
                    #     continue

                    try:
                        pdf_response = self.generate_pdf(student_id)
                        # Get PDF content - handle both Response objects and bytes
                        if hasattr(pdf_response, 'data'):
                            pdf_content = pdf_response.data
                        elif isinstance(pdf_response, bytes):
                            pdf_content = pdf_response
                        else:
                            # If it's a Response object, try to get data safely
                            pdf_content = getattr(pdf_response, 'data', None)
                            if pdf_content is None:
                                raise ValueError(f"Unable to extract PDF content from response: {type(pdf_response)}")

                        # print("pdf content length", len(pdf_content))

                        pdf_filename = f"{student_name}_{school}_week_{last_week_number}_report.pdf"
                        logger.info(f"Generating {pdf_filename}")

                        # Write PDF content to ZIP in memory
                        if isinstance(pdf_content, bytes):
                            zipf.writestr(pdf_filename, pdf_content)
                        else:
                            logger.warning(
                                f"PDF content is not in bytes format for {student_name}, skipping"
                            )
                    except Exception as e:
                        logger.error(
                            f"Error generating PDF for student_id={student_id}, name={student_name}: {e}",
                            exc_info=True
                        )
                        # Continue with next student instead of failing completely
                        continue

            # ZIP file is now closed and flushed
            # Verify the ZIP file is valid before proceeding
            try:
                with zipfile.ZipFile(temp_zip_path, 'r') as test_zip:
                    test_zip.testzip()  # This checks for corrupt contents
            except zipfile.BadZipFile as e:
                logger.error(f"Generated ZIP file is corrupt: {e}")
                raise Exception(f"Failed to create valid ZIP file: {e}")

            # If output_path is provided, save to file (for async tasks)
            if output_path:
                # Ensure directory exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                # Copy temp file to output path
                import shutil
                shutil.copy2(temp_zip_path, output_path)
                
                # Verify the copied file is valid
                try:
                    with zipfile.ZipFile(output_path, 'r') as verify_zip:
                        verify_zip.testzip()
                except zipfile.BadZipFile as e:
                    logger.error(f"Copied ZIP file is corrupt: {e}")
                    raise Exception(f"Failed to create valid ZIP file at {output_path}: {e}")
                
                # Clean up temp file
                os.remove(temp_zip_path)
                
                file_size = os.path.getsize(output_path)
                return {
                    "status": "success",
                    "file_path": output_path,
                    "filename": f"week_{last_week_number}_all_reports.zip",
                    "file_size": file_size,
                    "week_number": last_week_number
                }
            else:
                # Original synchronous behavior - return Response
                zip_buffer = io.BytesIO()
                with open(temp_zip_path, "rb") as f:
                    zip_buffer.write(f.read())

                # Clean up the temporary ZIP file from disk
                os.remove(temp_zip_path)

                zip_buffer.seek(0)  # Reset buffer position to the beginning
                zip_buffer_len = len(zip_buffer.getvalue())
                # print(f"ZIP content length: {zip_buffer_len}")

                return Response(
                    zip_buffer.getvalue(),
                    mimetype="application/zip",
                    headers={
                        "Content-Disposition": f'attachment; filename="week_{last_week_number}_all_reports.zip"',
                        "Content-Length": str(len(zip_buffer.getvalue())),
                    },
                )
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_zip_path):
                try:
                    os.remove(temp_zip_path)
                except:
                    pass
            print(e)
            logger.exception("exception in report generation")
            print("exception.......")
            raise e

    def send_reports(self):
        previous_week_number = get_current_week_number() - 1
        query = """
            SELECT p.phone_number, s.name FROM parents as p
            JOIN parents_students as ps ON
            p.parent_id = ps.parent_id
            JOIN students as s ON
            s.student_id = ps.student_id
        """
        result = self.db.fetch_all(query)

        for row in result:
            phone_number = row["phone_number"]
            student_name = row["name"]

            send_report_message(student_name, previous_week_number, phone_number)
