# dotenv
from dotenv import load_dotenv
import os

# load all credential details before anything!!!!
# Try to load from backend/.env first, then fallback to .env in current directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)  # Load from backend/.env
load_dotenv()  # Also try current directory as fallback

from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory,
    make_response,
    redirect,
    Response,
    abort,
)
from flask_cors import CORS, cross_origin

# import requests

import base64
from kakao_rest_api_config import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
from zoom_api_config import ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
from controller import Oauth
from time import sleep
from model import UserData
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
import random
import schedule
import threading
import time
import requests
import sys

import pymysql
from pymysql.cursors import DictCursor
from secret_db_config import db_config
from datetime import datetime
from datetime import timedelta
from datetime import time as dt_time
import os

# Import custom JSON encoder
from utils.utils import DecimalEncoder
import pytz
from pytz import timezone


# for generating pdf report
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
import numpy as np
import io
import zipfile
import tempfile

import re

from sehan_kakao_alimtalk import send_attendance_message, send_report_message

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.exceptions import HTTPException

from urllib.parse import quote, unquote

# Import blueprints instead of the old API
from blueprints.student_management import student_management_bp

import logging
from auth.jwt import register_jwt_callbacks
from jwt.exceptions import ExpiredSignatureError
from utils.agent_log import agent_log

from utils.utils import storeZoomVideo

# celery async processing
from celery_tasks import process_recording


SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")
SEHAN_END_DATE = os.environ.get("SEHAN_END_DATE")
ZOOM_WEBHOOK_SECRET_TOKEN = os.environ.get("ZOOM_WEBHOOK_SECRET_TOKEN")

# Configure logging - ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)

# Remove any existing handlers
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# File handler for persistent logs
file_handler = logging.FileHandler("logs/server.log", mode="a", encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
file_handler.setFormatter(file_formatter)
root_logger.addHandler(file_handler)

# Console handler for Gunicorn (stdout/stderr)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
console_handler.setFormatter(console_formatter)
root_logger.addHandler(console_handler)

# Set specific loggers to WARNING
logging.getLogger("matplotlib").setLevel(logging.WARNING)
logging.getLogger("PIL").setLevel(logging.WARNING)

app = Flask(__name__)
app.json_encoder = DecimalEncoder
app.config["CORS_ALLOW_HEADERS"] = ["Content-Type", "Authorization"]
app.config["CORS_SUPPORTS_CREDENTIALS"] = True
app.config["JWT_SECRET_KEY"] = "***REMOVED-JWT-SECRET***"
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_COOKIE_PATH"] = "/"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)  # short-lived access token
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
app.config["JWT_SESSION_COOKIE"] = False
app.config["JWT_CSRF_CHECK_FORM"] = True
app.config["UPLOAD_FOLDER"] = "/home/ubuntu/sehan_website/homework"
# app.config['TEACHER_UPLOAD_FOLDER'] = '/home/ubuntu/sehan_website/teacher_homework'
app.config["PREFERRED_URL_SCHEME"] = "https"
app.config["PROPAGATE_EXCEPTIONS"] = True  # Critical for Flask-RESTful/RESTX

app.url_map.strict_slashes = False  # doesn't care whether / was added at the end or not

# jwt = JWTManager(app) instead of this do the below
register_jwt_callbacks(app)

# Register blueprints instead of initializing old API
app.register_blueprint(student_management_bp)


# @app.errorhandler(HTTPException)
# def handle_http_exception(e):
#     response = e.get_response()
#     response.data = jsonify({"message": e.description, "code": e.code}).data
#     response.content_type = "application/json"
#     return response


from flask_jwt_extended.exceptions import NoAuthorizationError
from jwt.exceptions import ExpiredSignatureError

IGNORED_EXCEPTIONS = (
    NoAuthorizationError,
    ExpiredSignatureError,
)


# Error handlers are now managed by individual blueprints
# Global error handler for the Flask app
@app.errorhandler(Exception)
def handle_global_error(error):
    if not isinstance(error, IGNORED_EXCEPTIONS) and "Missing cookie" in str(error):
        app.logger.error(
            "Unhandled exception: %s", error, exc_info=True
        )
    
    return {"message": str(error)}, getattr(error, "code", 500)


cors = CORS(app, supports_credentials=True)

CORS(
    app,
    expose_headers=["Authorization", "Content-Disposition"],
    supports_credentials=True,
    resources={
        r"/*": {
            "origins": [
                "https://dev.sehanibp.kr",
                "https://sehanibp.kr",
                "https://www.sehanibp.kr",
            ],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "Content-Disposition"],
        }
    },
)

# @app.route('/kakao/logout')
# @jwt_required()
# def kakao_logout():
#     url = "https://kauth.kakao.com/oauth/logout"
#     headers = {
#         "Authorization": f"Bearer {kakao_access_token}"
#     }
#     response = requests.post(url, headers=headers)
#     return response.status_code


@app.route("/logout")
@jwt_required()
def logout():
    # kakao_access_token = get_jwt()['kakao_access_token']

    # print("kakao access token ", kakao_access_token)

    # if kakao_access_token:
    #     print("revoking kkao token")
    #     revoke_kakao_token(kakao_access_token)

    response = make_response(jsonify({"message": "Logged out"}))
    response.set_cookie("access_token_cookie", "", expires=0, path="/")
    response.set_cookie("refresh_token_cookie", "", expires=0, path="/")
    return response


@app.route("/.well-known/pki-verification/<path:filename>")
def https_validate():
    return send_from_directory(".well-known/pki-validation", filename)


def get_week_dates(previous_days, until_days):
    # Define the Asia/Seoul timezone
    seoul_tz = pytz.timezone("Asia/Seoul")

    # Get the current date and time in the Seoul timezone
    today = datetime.now(seoul_tz)

    # Find the previous week's Monday (start of the previous week)
    days_since_monday = (
        today.weekday() + previous_days
    )  # Monday is 0, so we add 7 days to get to the previous Monday
    start_of_last_week = today - timedelta(days=days_since_monday)

    # Find the previous week's Friday (end of the previous week)
    end_of_last_week = start_of_last_week + timedelta(
        days=until_days
    )  # Friday is 4 days after Monday

    # Return the date range as strings in the format YYYY-MM-DD
    return start_of_last_week.date(), end_of_last_week.date()


def get_previous_week_dates():
    # Define the Asia/Seoul timezone
    seoul_tz = pytz.timezone("Asia/Seoul")

    # Get the current date and time in the Seoul timezone
    today = datetime.now(seoul_tz)

    # Find the previous week's Monday (start of the previous week)
    days_since_monday = (
        today.weekday() + 7
    )  # Monday is 0, so we add 7 days to get to the previous Monday
    start_of_last_week = today - timedelta(days=days_since_monday)

    # Find the previous week's Friday (end of the previous week)
    end_of_last_week = start_of_last_week + timedelta(
        days=4
    )  # Friday is 4 days after Monday

    # Return the date range as strings in the format YYYY-MM-DD
    return start_of_last_week.date(), end_of_last_week.date()


def get_student_data(student_id):
    start_date, end_date = get_previous_week_dates()

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    s.student_id,
                    s.name,
                    s.duplicate,
                    s.grade,
                    s.school,
                    sub.subject_name,
                    ss.level,
                    sc.comment_text
                FROM 
                    students s
                JOIN 
                    student_subjects ss ON s.student_id = ss.student_id
                JOIN 
                    subjects sub ON ss.subject_id = sub.subject_id
                LEFT JOIN 
                    student_comments sc ON s.student_id = sc.student_id AND sub.subject_name = (SELECT t.subject FROM teachers t WHERE t.id = sc.teacher_id)
                WHERE 
                    s.student_id = %s
                ORDER BY 
                    s.student_id, sub.subject_name;
            """
            cursor.execute(sql, (student_id,))
            raw_student_data = cursor.fetchall()
            ###print("\nstudent raw data", raw_student_data)

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
                        "school": row["school"],
                        "subjects": [],  # List to hold subjects and comments
                    }

                # Add the subject and comment to the 'subjects' list
                if not any(
                    subject["subject_name"] == row["subject_name"]
                    for subject in students_dict[student_id]["subjects"]
                ):
                    students_dict[student_id]["subjects"].append(
                        {
                            "subject_name": row["subject_name"],
                            "level": row["level"],
                            "comment_text": row["comment_text"],
                        }
                    )

            # print("\nfinal student_data", students_dict)
            sql = """
                SELECT * 
                FROM attendance 
                WHERE student_id = %s AND attendance_date BETWEEN %s AND %s
                ORDER BY attendance_date;
            """
            cursor.execute(sql, (student_id, start_date, end_date))
            raw_attendance_data = cursor.fetchall()

            cursor.execute(
                """
                SELECT hs.marks, hs.raw_marks, h.subject, h.type FROM student_homework_submission hs
                JOIN homework h ON hs.homework_id = h.id
                WHERE hs.student_id = %s AND assignedDate BETWEEN %s AND %s
            """,
                (student_id, start_date, end_date),
            )
            raw_homework_data = cursor.fetchall()

            # Fetch comments
            cursor.execute(
                """
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
            """,
                (student_id,),
            )
            comments = cursor.fetchall()
            return (
                students_dict.get(student_id),
                raw_attendance_data,
                raw_homework_data,
                comments,
            )

    finally:
        connection.close()


def get_student_homework_data(subjects, student_id):
    start_date, end_date = get_previous_week_dates()

    connection = get_db_connection()

    student_homework_data = []

    try:
        with connection.cursor() as cursor:
            for subject in subjects:
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
                                AND h.subject = %s
                                AND h.assignedDate BETWEEN %s AND %s
                            GROUP BY 
                                h.assignedDate
                        ) AS latest_homework 
                        ON shs.id = latest_homework.latest_homework_id
                    WHERE 
                        shs.student_id = %s
                        AND h.subject = %s
                        AND h.type = "homework";
                """
                cursor.execute(
                    sql,
                    (student_id, subject, start_date, end_date, student_id, subject),
                )
                results = cursor.fetchall()

                formatted_data = {
                    subject: [
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

    finally:
        connection.close()


# def get_assigned_homework_data(subjects_with_levels, student_id):
#     start_date, end_date = get_previous_week_dates()

#     connection = get_db_connection()

#     assigned_homework_data = []

#     try:
#         with connection.cursor() as cursor:
#             for subject in subjects:
#                 sql = """
#                     SELECT subject, assignedDate FROM homework
#                     WHERE subject = %s AND assignedDate BETWEEN %s AND %s;
#                 """
#                 cursor.execute(sql, (subject, start_date, end_date))
#                 results = cursor.fetchall()

#                 # Collect assigned dates for the subject
#                 subject_data = {subject: [result['assignedDate'].strftime('%Y-%m-%d') for result in results]}
#                 assigned_homework_data.append(subject_data)

#             return assigned_homework_data

#     finally:
#         connection.close()


def get_assigned_homework_data(subjects_with_levels, student_id):
    # Get the start and end dates for the query
    start_date, end_date = get_previous_week_dates()

    connection = get_db_connection()
    assigned_homework_data = []

    try:
        with connection.cursor() as cursor:
            # Fetch the student's grade
            cursor.execute(
                "SELECT grade FROM students WHERE student_id = %s", (student_id,)
            )
            student_grade = cursor.fetchone()["grade"]

            for item in subjects_with_levels:
                subject = item["subject_name"]
                level = item["level"]

                # SQL query to fetch homework for the specified subject, level, and grade
                sql = """
                    SELECT assignedDate
                    FROM homework
                    WHERE subject = %s
                      AND FIND_IN_SET(%s, grades) > 0  -- Match grade
                      AND FIND_IN_SET(%s, levels) > 0  -- Match level
                      AND assignedDate BETWEEN %s AND %s
                """
                cursor.execute(
                    sql, (subject, student_grade, level, start_date, end_date)
                )
                results = cursor.fetchall()

                # Collect assigned dates for the subject
                subject_data = {
                    subject: [
                        result["assignedDate"].strftime("%Y-%m-%d")
                        for result in results
                    ]
                }
                assigned_homework_data.append(subject_data)

            return assigned_homework_data

    finally:
        connection.close()


def get_average_scores(subjects):
    start_date, end_date = get_previous_week_dates()

    connection = get_db_connection()

    average_scores = []

    try:
        with connection.cursor() as cursor:
            for subject in subjects:
                sql = """
                    SELECT 
                        h.subject, 
                        AVG(shs.raw_marks) AS average_score
                    FROM 
                        student_homework_submission shs
                    JOIN 
                        homework h ON shs.homework_id = h.id
                    WHERE 
                        h.subject = %s
                        AND h.assignedDate BETWEEN %s AND %s
                        AND shs.marks IS NOT NULL
                    GROUP BY 
                        h.subject;
                """
                cursor.execute(sql, (subject, start_date, end_date))
                result = cursor.fetchone()

                print("average score result", result)

                if result:
                    average_scores.append(
                        {result["subject"]: round(float(result["average_score"]), 1)}
                    )
                else:
                    average_scores.append({subject: 0})

            return average_scores

    finally:
        connection.close()


def create_homework_entries(
    average_scores,
    assigned_homework_data,
    student_homework_data,
    dates,
    student_exam_scores,
):
    homework_entries = []
    ###print("dates", dates)

    # Iterate over average_scores and match with student_exam_scores
    for avg_entry, exam_score_entry in zip(average_scores, student_exam_scores):
        subject_name, average_score = list(avg_entry.items())[0]
        _, exam_score = list(exam_score_entry.items())[0]

        # Find assigned homework dates and student scores for the subject
        assigned_dates = next(
            (
                item[subject_name]
                for item in assigned_homework_data
                if subject_name in item
            ),
            [],
        )
        student_scores = next(
            (
                item[subject_name]
                for item in student_homework_data
                if subject_name in item
            ),
            [],
        )
        ###print("assigned_dates", assigned_dates)

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


# Function to create the bar chart and save it as an image
def create_bar_chart(subjects, scores):
    # subjects = ['Business', 'Chemistry', 'Physics']
    # scores = [85, 92, 76]
    # Create a figure and axis

    fig, ax = plt.subplots(figsize=(10, len(subjects)))
    ax.set_facecolor("#FCF7E3")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    # Create the bar chart
    bars = ax.barh(
        subjects, scores, color="#FFE699", edgecolor="#06abf4", zorder=3, linewidth=2
    )

    ax.set_yticklabels([])
    ax.yaxis.set_tick_params(length=0, labelbottom=False)

    for bar, subject in zip(bars, subjects):
        # Get the width (score) and position of each bar
        width = bar.get_width()
        height = bar.get_height()
        x_pos = 2  # Position text inside the bar (adjust '2' for left padding)
        y_pos = bar.get_y() + height / 2  # Center vertically within the bar

        # Add the subject label inside the bar, aligned to the left
        ax.text(
            x_pos, y_pos, subject, ha="left", va="center", fontsize=15, color="black"
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


def get_exam_average_scores(
    subject_list,
    grade,
):
    # start_date, end_date = get_week_dates(0, 6) # 0, 6 = > this week until sunday
    start_date, end_date = get_previous_week_dates()
    end_date = end_date + timedelta(days=3)
    # print("dates",start_date, end_date)

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            # Query to get all relevant homework entries for exams
            query = """
            SELECT h.id AS homework_id, h.subject, s.raw_marks
            FROM homework h
            JOIN student_homework_submission s ON h.id = s.homework_id
            WHERE h.type = 'Exam' AND FIND_IN_SET(%s, h.grades)
                AND h.assignedDate >= %s AND h.assignedDate <= %s
            """

            # Query parameters
            params = (grade, start_date, end_date)

            cursor.execute(query, params)
            results = cursor.fetchall()

        # Initialize a dictionary to hold total marks and counts for averaging
        scores = {subject: {"total": 0, "count": 0} for subject in subject_list}

        # Process the query results
        for row in results:
            subject = row["subject"]
            raw_marks = row["raw_marks"]

            if subject in scores and raw_marks is not None:
                scores[subject]["total"] += raw_marks
                scores[subject]["count"] += 1

        # Calculate averages and format the result
        average_scores = [
            {
                subject: (
                    round(scores[subject]["total"] / scores[subject]["count"], 1)
                    if scores[subject]["count"] > 0
                    else 0
                )
            }
            for subject in subject_list
        ]

        return average_scores

    finally:
        connection.close()


def get_student_exam_score_per_subject(student_id, subjects):
    # start_date, end_date = get_week_dates(0, 6) # 0, 6 = > this week until sunday
    start_date, end_date = get_previous_week_dates()
    end_date = end_date + timedelta(days=3)

    connection = get_db_connection()

    subject_scores = []

    try:
        with connection.cursor() as cursor:
            for subject in subjects:
                # SQL query to fetch the latest marks and raw marks for exams
                sql = """
                    SELECT 
                        shs.marks, shs.raw_marks
                    FROM 
                        student_homework_submission shs
                    JOIN 
                        homework h ON shs.homework_id = h.id
                    WHERE 
                        shs.student_id = %s 
                        AND h.subject = %s 
                        AND h.type = 'Exam'
                        AND h.assignedDate BETWEEN %s AND %s
                    ORDER BY 
                        shs.submission_date DESC
                    LIMIT 1
                """
                cursor.execute(sql, (student_id, subject, start_date, end_date))
                result = cursor.fetchone()

                # Format the result
                if result:
                    formatted_score = (
                        f"{result['marks'] or 0}({result['raw_marks'] or 0})"
                    )
                else:
                    formatted_score = ""  # Default for no submission

                subject_scores.append({subject: formatted_score})

        return subject_scores

    finally:
        connection.close()


@app.route("/generate_pdf/<int:student_id>", methods=["GET"])
def generate_pdf(student_id):
    student_data, raw_attendance_data, raw_homework_data, comments = get_student_data(
        student_id
    )
    ###print("student info for pdf", student_data)
    # Register the Korean font
    pdfmetrics.registerFont(
        TTFont("Pretendard-Regular", "../src/fonts/Pretendard-Regular.ttf")
    )
    pdfmetrics.registerFont(
        TTFont("Pretendard-Bold", "../src/fonts/Pretendard-Bold.ttf")
    )

    # last week report card
    last_week_number = get_week_number() - 1

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

    default_style = ParagraphStyle(
        "KoreanStyle",
        parent=styles["Normal"],
        fontName="Pretendard-Regular",
        fontSize=12,
    )

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Title"],
        fontName="Pretendard-Regular",
        fontSize=16,
        alignment=1,  # Center alignment
    )

    sub_heading_style = ParagraphStyle(
        "SubHeadingStyle",
        parent=styles["Heading3"],
        fontName="Pretendard-Bold",
        fontSize=12,
    )

    elements = []

    # Add report title
    title_data = [["Sehan Academy IB M&T Assessment Report"]]

    title_table = Table(title_data, colWidths=[520], rowHeights=[30])
    title_table.setStyle(
        TableStyle(
            [
                ("TEXTCOLOR", (0, 0), (-1, -1), "#FFFFFF"),  # Set text color to white
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),  # Center alignment
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),  # Vertical alignment
                ("BACKGROUND", (0, 0), (0, -1), "#6AA4DB"),
                ("FONTNAME", (0, 0), (-1, -1), "Pretendard-Regular"),
                ("FONTSIZE", (0, 0), (-1, -1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    elements.append(title_table)
    elements.append(Spacer(1, 20))

    # getting sehan ib logo on the left
    sehan_logo_path = "../src/images/logo.png"
    sehan_logo = Image(sehan_logo_path, width=2.2 * inch, height=0.5 * inch)

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
                ("BACKGROUND", (0, 0), (0, -1), "#FFF2CC"),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, -1), "Pretendard-Regular"),
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
                ("FONTNAME", (0, 0), (-1, -1), "Pretendard-Regular"),
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

    # Generate the dates for the previous week (Monday to Friday)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(5)]
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
                ("BACKGROUND", (0, 0), (-1, 0), "#FFE699"),
                ("TEXTCOLOR", (0, 0), (-1, 0), "#404040"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Pretendard-Bold"),
                # ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (0, -1), "#FFF7E1"),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                (
                    "TEXTCOLOR",
                    (1, 1),
                    (-1, -1),
                    colors.black,
                ),  # Ensure marks are black for readability
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("FONTNAME", (0, 1), (-1, -1), "Pretendard-Regular"),
            ]
        )
    )
    attendance_table.hAlign = "LEFT"
    elements.append(Paragraph("Attendance", sub_heading_style))
    elements.append(attendance_table)  # Add the attendance table to the PDF elements
    elements.append(Spacer(1, 20))  # Add space after the table

    # Prepare the table with the same structure as the attendance table
    homework_data = [
        ["Homework Status and Scores", "", "", "", "", "", "진단평가"],
        ["과목/요일"] + dates + ["학생점수", "전체평균"],
    ]

    # get average scores for each subject
    subject_list = []
    for subject in student_data["subjects"]:
        subject_list.append(subject["subject_name"])
    ###print("subjects the student take", subject_list)
    ###print("subjects with levels ",student_data['subjects'])
    # average_scores = get_average_scores(subject_list)
    average_scores = get_exam_average_scores(subject_list, student_data["grade"])
    # print("average_scores for each subject", average_scores)

    # get assigned homework data
    assigned_homework_data = get_assigned_homework_data(
        student_data["subjects"], student_id
    )

    ###print("\nassigned homework data", assigned_homework_data)

    # get student marks per homework
    student_homework_data = get_student_homework_data(subject_list, student_id)
    ###print("\nstudent homework data", student_homework_data)

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
    student_exam_scores = get_student_exam_score_per_subject(student_id, subject_list)

    ### print("\nstudent_exam_scores", student_exam_scores)

    homework_entries = create_homework_entries(
        average_scores,
        assigned_homework_data,
        student_homework_data,
        dates,
        student_exam_scores,
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
                    "#FFE699",
                ),  # Header row background color
                ("TEXTCOLOR", (6, 0), (-1, 0), "#404040"),  # Header text color
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),  # Center alignment
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 1),
                    "Pretendard-Bold",
                ),  # Bold font for the header row
                ("TEXTCOLOR", (0, 1), (-1, 1), "#404040"),
                (
                    "BACKGROUND",
                    (0, 2),
                    (0, -1),
                    "#FFF7E1",
                ),  # Row background color (light yellow)
                ("GRID", (0, 1), (-1, -1), 1, colors.black),  # Grid around the table
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
                    "Pretendard-Regular",
                ),  # Font style for data entries
                ("BACKGROUND", (0, 0), (5, 0), None),
                ("SPAN", (0, 0), (5, 0)),  # Merge the first 6 cells in the first row
                ("FONTNAME", (0, 0), (5, 0), "Pretendard-Bold"),
                ("FONTSIZE", (0, 0), (5, 0), 12),
                ("ALIGN", (0, 0), (5, 0), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (5, 0), 5),
                ("LEFTPADDING", (0, 0), (5, 0), -1),
                ("SPAN", (6, 0), (-1, 0)),  # Merge all cells in the first row
                ("GRID", (6, 0), (-1, -1), 2, "#595959"),  # Grid around the table
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

    scores = [extract_score(list(item.values())[0]) for item in student_exam_scores]

    img_stream = create_bar_chart(subject_list, scores)
    # Add the bar chart as an image
    # height 200 = 5
    # height = number of subject * 40
    new_height = len(student_data["subjects"]) * 50
    img = Image(img_stream, width=500, height=new_height)
    img.hAlign = "LEFT"
    elements.append(img)  # Add the image to the elements list
    elements.append(Spacer(1, 12))  # Add space after the image

    custom_sub_heading_style = ParagraphStyle(
        "SubHeadingStyle",
        parent=styles["Heading3"],
        fontName="Pretendard-Bold",
        fontSize=12,
    )

    comment_style = ParagraphStyle(
        "custom",
        parent=styles["Normal"],
        fontName="Pretendard-Regular",
        fontSize=12,
        leading=16,
    )

    # Add comments
    elements.append(Paragraph(f"<u>Comments:</u>", custom_sub_heading_style))
    elements.append(Spacer(1, 10))  # Add space after the image
    # print("comment values", comments)

    for i, comment in enumerate(comments):
        elements.append(
            Paragraph(
                f"<font name='Pretendard-Bold'>{comment['subject_name']}:</font> {comment['comment_text']}",
                comment_style,
            )
        )
        if i < len(comments) - 1:
            elements.append(Spacer(1, 14))

    # Build PDF
    pdf.build(elements)

    buffer.seek(0)
    response.data = buffer.getvalue()
    buffer.close()

    # Create a response object
    # response = Response(pdf_data, mimetype='application/pdf')
    # response.headers['Content-Disposition'] = 'inline; filename="report.pdf"'
    return response
    # return send_file(buffer, as_attachment=True, download_name='student_report.pdf', mimetype='application/pdf')


@app.route("/get-all-report", methods=["GET"])
@jwt_required()
def get_all_student_report():
    connection = get_db_connection()

    # last week report card
    last_week_number = get_week_number() - 1

    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_zip:
        try:
            temp_zip_path = temp_zip.name

            with zipfile.ZipFile(temp_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
                with connection.cursor() as cursor:
                    sql = """
                        SELECT student_id, name, school from students WHERE grade is not null;
                    """
                    cursor.execute(sql)
                    result = cursor.fetchall()

                    print("result for zip pdf", result)

                    for row in result:
                        student_id = row["student_id"]
                        student_name = row["name"]
                        school = row["school"]

                        pdf_content = generate_pdf(student_id).data

                        # print("pdf content length", len(pdf_content))

                        pdf_filename = f"{student_name}_{school}_week_{last_week_number}_report.pdf"

                        # Write PDF content to ZIP in memory
                        if isinstance(pdf_content, bytes):
                            zipf.writestr(pdf_filename, pdf_content)
                        else:
                            print(
                                f"PDF content is not in bytes format for {student_name}"
                            )

            zip_buffer = io.BytesIO()
            with open(temp_zip_path, "rb") as f:
                zip_buffer.write(f.read())

            # Clean up the temporary ZIP file from disk
            os.remove(temp_zip_path)

            zip_buffer.seek(0)  # Reset buffer position to the beginning
            # try:
            #     with zipfile.ZipFile(zip_buffer, 'r') as test_zip:
            #         test_zip.testzip()  # This checks for corrupt contents
            # except zipfile.BadZipFile:
            #     return Response("Generated ZIP file is corrupt.", status=500)

            zip_buffer_len = len(zip_buffer.getvalue())
            print(f"ZIP content length: {zip_buffer_len}")

            return Response(
                zip_buffer.getvalue(),
                mimetype="application/zip",
                headers={
                    "Content-Disposition": f'attachment; filename="week_{last_week_number}_all_reports.zip"',
                    "Content-Length": str(len(zip_buffer.getvalue())),
                },
            )
        finally:
            connection.close()


def extract_score(value):
    # If the value is empty, return 0
    if value == "":
        return 0
    # If the value contains a number in parentheses, extract the number inside
    match = re.search(r"\((\d+)\)", value)
    if match:
        return int(match.group(1))
    # Otherwise, return the number as is
    return int(value)


attendance_code = "9999"


def timedelta_to_string(td):
    total_seconds = int(td.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}"


def get_db_connection():
    return pymysql.connect(**db_config, cursorclass=DictCursor)


# @app.route('/homework', methods=['GET'])
# def get_homework():
#     subject = request.args.get('subject')

#     conn = get_db_connection()
#     cursor = conn.cursor()

#     try:
#         if subject:
#             query = "SELECT * FROM homework WHERE subject = %s"
#             cursor.execute(query, (subject,))
#         else:
#             query = "SELECT * FROM homework"
#             cursor.execute(query)

#         homework_data = cursor.fetchall()

#         # Get current date to check if homework is overdue
#         current_date = datetime.now().date()

#         # Update 'is_over' field based on due date
#         for homework in homework_data:
#             due_date = homework['due_date']
#             if due_date < current_date:
#                 homework['is_over'] = True
#             else:
#                 homework['is_over'] = False

#         return jsonify(homework_data)

#     except Exception as e:
#         return jsonify({"error": str(e)})

#     finally:
#         cursor.close()
#         conn.close()


@app.route("/test")
def test_page():
    return "test"


def generateRandomNumber():
    # just for english b testing, make it all same number
    attendance_code = str(random.randint(1111, 9999))

    app.logger.info(f"new attendance_code {attendance_code} - Generated 5 minutes before class")

    # current_time = datetime.now(seoul_tz).time()

    # if current_time > time(9, 0) and current_time < time(10, 0):
    #     attendance_code = "7777"

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE attendance_code SET code = %s WHERE id = 1", (attendance_code,)
            )
            # If no rows are updated, insert the code (for first-time setup)
            # comment out for testing
            if cursor.rowcount == 0:
                cursor.execute(
                    "INSERT INTO attendance_code (id, code) VALUES (1, %s)",
                    (attendance_code,),
                )
        connection.commit()
    finally:
        connection.close()


@app.route("/api/attendanceCode", methods=["GET"])
@cross_origin()
def getAttendanceCode():
    connection = pymysql.connect(**db_config, cursorclass=DictCursor)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT code FROM attendance_code WHERE id = 1")
            result = cursor.fetchone()
            if result:
                attendance_code = result["code"]
            else:
                attendance_code = None  # Handle case where code is not set
    finally:
        connection.close()

    return (
        jsonify(
            {
                "attendanceCode": attendance_code,
            }
        ),
        200,
    )


# @app.route('/homework-submission-info', methods=['GET'])
# @jwt_required()
# def getHomeworkSubmissionInfo():
#     connection = get_db_connection()
#     try:
#         with connection.cursor() as cursor:
#             sql = """

#             """
#             cursor.execute(sql)
#             result = cursor.fetchall()

#     finally:
#         connection.close()

#     return jsonify(result), 200


@app.route("/api/attendance/info", methods=["GET"])
@jwt_required()
def getAttendanceInfo():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    status, 
                    COUNT(*) AS count
                FROM (
                    SELECT 
                        a.student_id, 
                        a.subject_name, 
                        a.attendance_date, 
                        a.status
                    FROM attendance a
                    INNER JOIN (
                        -- Subquery to get the latest attendance for each student per subject per day
                        SELECT 
                            student_id, 
                            subject_name, 
                            attendance_date, 
                            MAX(created_at) AS latest_created_at
                        FROM attendance
                        GROUP BY student_id, subject_name, attendance_date
                    ) latest_attendance 
                    ON a.student_id = latest_attendance.student_id
                    AND a.subject_name = latest_attendance.subject_name
                    AND a.attendance_date = latest_attendance.attendance_date
                    AND a.created_at = latest_attendance.latest_created_at
                ) latest_statuses
                GROUP BY status
                ORDER BY status;
            """
            cursor.execute(sql)
            result = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(result), 200


@app.route("/api/homework/average", methods=["GET"])
@cross_origin()
def getHomeworkAveragePerSubject():
    grade_id = request.args.get("gradeID")

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT sub.subject_name, 
                    IFNULL(AVG(shs.raw_marks), 0) AS average_marks
                FROM homework h
                JOIN 
                    subjects sub ON h.subject_id = sub.subject_id
                LEFT JOIN student_homework_submission shs 
                    ON h.id = shs.homework_id 
                    AND shs.submission_date = (
                        SELECT MAX(submission_date)
                        FROM student_homework_submission
                        WHERE homework_id = h.id
                        AND student_id = shs.student_id
                    )
                WHERE h.type = 'Homework'
                AND h.grade_id = %s
                GROUP BY sub.subject_name
                ORDER BY sub.subject_name
            """
            cursor.execute(sql, grade_id)
            result = cursor.fetchall()

            homework_average_marks = []

            for row in result:
                average_mark = row["average_marks"]
                homework_average_marks.append(average_mark)
    finally:
        connection.close()

    return (
        jsonify(
            {
                "homeworkAverageMarks": homework_average_marks,
            }
        ),
        200,
    )


@app.route("/api/exam/average", methods=["GET"])
@cross_origin()
def getExamAveragePerSubject():
    grade_id = request.args.get("gradeID")

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT sub.subject_name, 
                    IFNULL(AVG(shs.raw_marks), 0) AS average_marks
                FROM homework h
                JOIN subjects sub ON h.subject_id = sub.subject_id
                LEFT JOIN student_homework_submission shs 
                    ON h.id = shs.homework_id 
                    AND shs.submission_date = (
                        SELECT MAX(submission_date)
                        FROM student_homework_submission
                        WHERE homework_id = h.id
                        AND student_id = shs.student_id
                    )
                WHERE h.type = 'Exam'
                AND h.grade_id = %s
                GROUP BY sub.subject_name
                ORDER BY sub.subject_name
            """
            cursor.execute(sql, grade_id)
            result = cursor.fetchall()

            exam_average_marks = []

            for row in result:
                average_mark = row["average_marks"]
                exam_average_marks.append(average_mark)
    finally:
        connection.close()

    return (
        jsonify(
            {
                "examAverageMarks": exam_average_marks,
            }
        ),
        200,
    )


def get_student_grade(student_id):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            # SQL query to check if user exists by their KakaoTalk user_id
            sql_query = "SELECT grade FROM students WHERE kakao_user_id = %s"
            cursor.execute(sql_query, (student_id))
            result = cursor.fetchone()  # Fetch the first row (if any)

            # Check if a result was found
            if result:
                return result["grade"]  # User exists, return True with student_id
            else:
                return None  # User doesn't exist, return False
    finally:
        connection.close()  # Close the DB connection


def check_user_exists(kakao_user_id):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            # SQL query to check if user exists by their KakaoTalk user_id
            sql_query = (
                "SELECT student_id, name, grade FROM students WHERE kakao_user_id = %s"
            )
            cursor.execute(sql_query, (kakao_user_id,))
            result = cursor.fetchone()  # Fetch the first row (if any)
            # print("result fetched from db", result)
            # Check if a result was found
            if result:
                return (
                    result["name"],
                    result["student_id"],
                    result["grade"],
                )  # User exists, return True with student_id
            else:
                return None, None, None  # User doesn't exist, return False
    finally:
        connection.close()  # Close the DB connection


def insert_new_user(
    kakao_user_id, kakao_thumbnail_url, kakao_access_token, kakao_refresh_token
):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO students (kakao_user_id, kakao_thumbnail_url, kakao_access_token, kakao_refresh_token) VALUES (%s, %s, %s, %s)"
            cursor.execute(
                sql,
                (
                    kakao_user_id,
                    kakao_thumbnail_url,
                    kakao_access_token,
                    kakao_refresh_token,
                ),
            )
            connection.commit()
            return cursor.lastrowid  # Returns the newly inserted student_id
    finally:
        connection.close()


def get_parent_by_email(email):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT parent_name, parent_id, password from parents where email=%s"
            cursor.execute(sql, (email))
            data = cursor.fetchone()

    finally:
        connection.close()

    if data:
        return data
    else:
        return False


def get_student_by_email(email):
    connection = pymysql.connect(**db_config, cursorclass=DictCursor)

    try:
        with connection.cursor() as cursor:
            sql = (
                "SELECT name, student_id, grade, password from students where email=%s"
            )
            cursor.execute(sql, (email,))
            data = cursor.fetchone()

    finally:
        connection.close()

    if data:
        return data
    else:
        return False


def get_teacher_by_username(username):
    connection = pymysql.connect(**db_config, cursorclass=DictCursor)

    try:
        with connection.cursor() as cursor:
            sql = "SELECT * from teachers where username=%s"
            cursor.execute(sql, (username,))
            data = cursor.fetchone()

    finally:
        connection.close()

    if data:
        return data
    else:
        return False


def build_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


@app.route("/api/files/", methods=["GET"])
def get_file_query():
    """Serve files using query parameter (avoids nginx URL decoding issues with spaces)"""
    filename = request.args.get("file", "")
    if not filename:
        return jsonify({"error": "Filename parameter is required"}), 400
    
    return _serve_file(filename)

@app.route("/api/files/<path:filename>", methods=["GET"])
def get_file(filename):
    """Serve files using path parameter (for backward compatibility)
    Note: nginx may decode URL-encoded characters before passing to Flask,
    so the filename might already be decoded (e.g., %20 becomes space)"""
    return _serve_file(filename)

def _serve_file(filename):
    """Helper function to serve a file from the upload folder"""
    # Explicitly decode URL-encoded filenames to handle spaces and special characters
    try:
        # Decode the filename to handle URL-encoded characters like %20 (space)
        decoded_filename = unquote(filename, encoding='utf-8')
        app.logger.info(f"Serving file: original={filename}, decoded={decoded_filename}, folder={app.config['UPLOAD_FOLDER']}")
        
        import os
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], decoded_filename)
        app.logger.info(f"Full file path: {file_path}, exists: {os.path.exists(file_path)}")
        
        if not os.path.exists(file_path):
            app.logger.error(f"File not found: {file_path}")
            return jsonify({"error": "File not found"}), 404
        
        # Use send_file for better control over headers and file serving
        from flask import send_file
        # Determine MIME type based on file extension
        mimetype = None
        if file_path.lower().endswith('.pdf'):
            mimetype = 'application/pdf'
        elif file_path.lower().endswith(('.jpg', '.jpeg')):
            mimetype = 'image/jpeg'
        elif file_path.lower().endswith('.png'):
            mimetype = 'image/png'
        
        return send_file(file_path, as_attachment=False, mimetype=mimetype)
    except FileNotFoundError as e:
        app.logger.error(f"File not found: {filename} (decoded: {decoded_filename if 'decoded_filename' in locals() else 'N/A'})")
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        app.logger.error(f"Error serving file {filename}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# homework edit by student
@app.route("/api/homework/edit", methods=["POST"])
@jwt_required()
def homework_edit():
    file = request.files.get("file")
    filename = None

    if file:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)
    else:
        # when editing, if file already exists
        filename = request.form.get("fileName")

    homework_id = request.form.get("homework_id")
    text_attachment = request.form.get("textAttachment")

    # print("text attachment received", text_attachment)
    student_id = get_jwt_identity()

    student_name = get_jwt()["name"]
    # print("student anme and id in upload", student_name, student_id)

    # Here, save the file path and metadata (subject, date) to the database if needed
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO student_homework_submission (student_id, homework_id, student_name, file_name, text_attachment) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(
                sql, (student_id, homework_id, student_name, filename, text_attachment)
            )
            connection.commit()
    finally:
        connection.close()

    return jsonify({"message": "File uploaded successfully", "filename": filename}), 200


@app.route("/api/homework/submit", methods=["POST"])
@cross_origin()
@jwt_required()
def upload_homework():
    if "file" in request.files:
        file = request.files["file"]
    else:
        file = None
        filename = None
    homework_id = request.form.get("homework_id")
    text_attachment = request.form.get("textAttachment")

    if text_attachment == "undefined":
        text_attachment = ""

    # print("text attachment received", text_attachment)
    student_id = get_jwt_identity()

    student_name = get_jwt()["name"]
    # print("student anme and id in upload", student_name, student_id)

    if file and file.filename == "":
        return jsonify({"error": "No file name"}), 400

    if file:
        # Save file in a predefined directory
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)
    else:
        file_path = ""

    is_submitted = True

    # Here, save the file path and metadata (subject, date) to the database if needed
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO student_homework_submission (student_id, homework_id, student_name, file_name, text_attachment) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(
                sql, (student_id, homework_id, student_name, filename, text_attachment)
            )
            connection.commit()
    finally:
        connection.close()

    return (
        jsonify({"message": "File uploaded successfully", "file_path": file_path}),
        200,
    )


@app.route("/api/delete-homework", methods=["DELETE"])
@jwt_required()
def delete_homework():
    connection = get_db_connection()

    data = request.json
    homework_id = data.get("homework_id")
    # print("received homework id", homework_id)

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM homework WHERE id = %s", (homework_id))
            connection.commit()
    finally:
        connection.close()

    return jsonify({"msg": "Homework deleted successfully"}), 200


@app.route("/api/edit-homework", methods=["PUT"])
@jwt_required()
def edit_homework():
    file = request.files.get("file")
    filename = None

    if file:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)
    else:
        # when editing, if file already exists
        filename = request.form.get("fileName")

    new_homework = request.form
    # print("new_homework data", new_homework)
    title = new_homework.get("title")
    subject_id = new_homework.get("subject_id")
    assignedDate = new_homework.get("assignedDate")
    dueDate = new_homework.get("dueDate")
    grade_id = new_homework.get("grade_id")  # Assuming grades is a list
    level_id = new_homework.get("level_id")  # Assuming levels is a list
    description = new_homework.get("description")
    homework_type = new_homework.get("type")
    homework_id = new_homework.get("homework_id")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            # Check if assignedDate already exists
            # query = "DELETE FROM homework WHERE id = %s"
            # cursor.execute(query, (homework_id))

            # if result['COUNT(*)'] > 0:
            #     return jsonify({
            #         "error": "Homework for the selected assigned date already exists. Please choose a different date."
            #     }), 400

            sql = """
            UPDATE homework set 
            title = %s, 
            subject_id = %s, 
            assignedDate = %s, 
            dueDate = %s, 
            grade_id = %s, 
            level_id = %s, 
            description = %s, 
            type = %s, 
            file_name = %s
            WHERE id = %s
            """
            cursor.execute(
                sql,
                (
                    title,
                    subject_id,
                    assignedDate,
                    dueDate,
                    grade_id,
                    level_id,
                    description,
                    homework_type,
                    filename,
                    homework_id,
                ),
            )
            connection.commit()
    finally:
        connection.close()

    return jsonify({"message": "Homework edited successfully"}), 200


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/api/create-homework", methods=["POST"])
@cross_origin()
@jwt_required()
def create_homework():
    if "file" in request.files:
        file = request.files["file"]
    else:
        file = None
        filename = None

    if file:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

    new_homework = request.form
    # print("new_homework data", new_homework)
    title = new_homework.get("title")
    subject = new_homework.get("subject")
    assignedDate = new_homework.get("assignedDate")
    dueDate = new_homework.get("dueDate")
    grades = new_homework.get("grades")  # Assuming grades is a list
    levels = new_homework.get("levels")  # Assuming levels is a list
    description = new_homework.get("description")
    homework_type = new_homework.get("type")

    # print("subject name for created hoemwork", subject)

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            # Check if assignedDate already exists
            query = (
                "SELECT COUNT(*) FROM homework WHERE assignedDate = %s AND subject = %s"
            )
            cursor.execute(query, (assignedDate, subject))
            result = cursor.fetchone()

            # print("inside create homework", result)

            # if result['COUNT(*)'] > 0:
            #     return jsonify({
            #         "error": "Homework for the selected assigned date already exists. Please choose a different date."
            #     }), 400

            sql = """
            INSERT INTO homework (title, subject, assignedDate, dueDate, grades, levels, description, type, file_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                sql,
                (
                    title,
                    subject,
                    assignedDate,
                    dueDate,
                    grades,
                    levels,
                    description,
                    homework_type,
                    filename,
                ),
            )
            connection.commit()
    finally:
        connection.close()

    return jsonify({"message": "Homework created successfully"}), 200


# OLD ROUTE REMOVED - This was returning all homework without filtering
# The new route below handles subject filtering properly
# @app.route("/api/get-homework", methods=["GET"])
# @cross_origin()
# @jwt_required()
# def get_homework():
#     connection = get_db_connection()
#     try:
#         with connection.cursor() as cursor:
#             sql = "SELECT * from homework"
#             cursor.execute(sql)
#             data = cursor.fetchall()
#     finally:
#         connection.close()
#     return jsonify(data)


# teacher viewing homework
@app.route("/api/get-submitted-homework", methods=["GET"])
@cross_origin()
@jwt_required()
def get_submitted_homework():
    graded_status = request.args.get("graded_status")
    subject_id = request.args.get("subject_id", None)
    grade_id = request.args.get("grade_id", None)
    level_id = request.args.get("level_id", None)
    type = request.args.get("type", "")
    gradedBy = request.args.get("gradedBy", "")
    searchQuery = request.args.get("searchQuery", "").lower()
    sortBy = request.args.get("sortBy", "dueDate")  # Default sort by 'dueDate'
    if sortBy == "submittedDate":
        sortBy = "submission_date"
    sortOrder = request.args.get("sortOrder", "asc")  # Default to ascending order
    page = int(request.args.get("page", 1))  # Default to page 1
    itemsPerPage = int(
        request.args.get("itemsPerPage", 10)
    )  # Default to 10 items per page

    # Calculate offset for pagination
    offset = (page - 1) * itemsPerPage

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    shs.submission_date, 
                    shs.marks, 
                    shs.comment, 
                    shs.student_name,
                    shs.file_name, 
                    shs.teacher_comment_file_name,
                    shs.graded_by,
                    shs.id,
                    shs.text_attachment,
                    shs.raw_score,
                    shs.total_score,
                    h.level_id, 
                    h.grade_id, 
                    h.dueDate,
                    h.assignedDate,
                    h.type, 
                    h.subject_id, 
                    h.title,
                    l.level_name,
                    g.grade as grade_name,
                    sub.subject_name
                FROM 
                    student_homework_submission shs
                JOIN 
                    homework h ON shs.homework_id = h.id
                JOIN
                    subjects sub ON h.subject_id = sub.subject_id
                JOIN
                    levels l ON h.level_id = l.id
                JOIN
                    grades g ON h.grade_id = g.grade_id
                JOIN 
                    students s ON shs.student_id = s.student_id
                WHERE 
                    (%s = '' OR h.subject_id = %s) AND
                    (%s = '' OR h.grade_id = %s) AND
                    (%s = '' OR h.level_id = %s) AND
                    (%s = '' OR h.type = %s) AND
                    (%s = '' OR shs.graded_by LIKE %s) AND
                    (%s = '' OR shs.student_name LIKE %s OR shs.graded_by LIKE %s)
            """

            if graded_status == "graded":
                sql += " AND graded_by IS NOT NULL "
            elif graded_status == "pending":
                sql += " AND graded_by IS NULL "

            sql += "ORDER BY {} {} LIMIT %s OFFSET %s".format(sortBy, sortOrder)

            # Execute query with parameters
            cursor.execute(
                sql,
                (
                    subject_id,
                    subject_id,
                    grade_id,
                    grade_id,
                    level_id,
                    level_id,
                    type,
                    type,
                    gradedBy,
                    f"%{gradedBy}%",
                    searchQuery,
                    f"%{searchQuery}%",
                    f"%{searchQuery}%",
                    itemsPerPage,
                    offset,
                ),
            )

            data = cursor.fetchall()

            # print("fetching data homework", data)

            # Get total count of matching records
            sql = """
                SELECT COUNT(*) 
                FROM student_homework_submission shs
                JOIN homework h ON shs.homework_id = h.id
                JOIN students s ON shs.student_id = s.student_id
                WHERE 
                    (%s = '' OR h.subject_id LIKE %s) AND
                    (%s = '' OR h.grade_id LIKE %s) AND
                    (%s = '' OR h.level_id LIKE %s) AND
                    (%s = '' OR h.type LIKE %s) AND
                    (%s = '' OR shs.graded_by LIKE %s) AND
                    (%s = '' OR shs.student_name LIKE %s OR shs.graded_by LIKE %s)
            """

            if graded_status == "graded":
                sql += " AND graded_by IS NOT NULL "
            elif graded_status == "pending":
                sql += " AND graded_by IS NULL "

            cursor.execute(
                sql,
                (
                    subject_id,
                    subject_id,
                    grade_id,
                    grade_id,
                    level_id,
                    level_id,
                    type,
                    type,
                    gradedBy,
                    f"%{gradedBy}%",
                    searchQuery,
                    f"%{searchQuery}%",
                    f"%{searchQuery}%",
                ),
            )
            total_count = cursor.fetchone()["COUNT(*)"]
            total_pages = (total_count + itemsPerPage - 1) // itemsPerPage

    finally:
        connection.close()

    return jsonify(
        {
            "data": data,
            "totalCount": total_count,
            "totalPages": total_pages,
        }
    )


# student viewing homework
@app.route("/api/get-homework", methods=["GET"])  # Query parameter route (preferred for spaces)
@app.route("/api/get-homework/<path:subject>", methods=["GET"])  # Path parameter route (backward compatibility)
@cross_origin()
@jwt_required()
def get_homework_subject(subject=None):
    # Support both query parameter (preferred) and path parameter (backward compatibility)
    if subject is None:
        subject = request.args.get("subject")
        if not subject:
            return jsonify({"error": "Subject parameter is required"}), 400
    
    # URL decode the subject parameter to handle spaces and special characters
    from urllib.parse import unquote
    if subject:
        subject = unquote(subject)
    
    grade = get_jwt()["grade"]
    student_id = get_jwt_identity()
    connection = get_db_connection()

    print(f"[DEBUG] get_homework_subject called with subject: {subject}, student_id: {student_id}, grade: {grade}")

    if not grade:
        print(f"[DEBUG] Grade not set for student {student_id}")
        return jsonify({"error": "Grade not set for student"}), 400

    try:
        with connection.cursor() as cursor:
            # Get all homework for the subject with latest submission info
            # Note: homework table uses subject_id, grade_id, level_id (int) not subject, grades, levels (varchar)
            sql = """
                SELECT 
                    h.id AS homework_id,
                    h.title,
                    h.assignedDate,
                    h.dueDate,
                    h.description,
                    h.file_name AS homework_file_name,
                    s.subject_name AS subject,
                    filtered_shs.id AS submission_id,
                    filtered_shs.comment,
                    filtered_shs.marks,
                    filtered_shs.submission_date,
                    filtered_shs.text_attachment,
                    filtered_shs.raw_score,
                    filtered_shs.total_score,
                    filtered_shs.file_name AS student_file_name,
                    filtered_shs.teacher_comment_file_name
                FROM homework AS h
                JOIN subjects AS s 
                    ON h.subject_id = s.subject_id
                JOIN levels AS l
                    ON h.level_id = l.id
                JOIN grades AS g
                    ON h.grade_id = g.grade_id
                LEFT JOIN (
                    SELECT shs.*
                    FROM student_homework_submission AS shs
                    INNER JOIN (
                        SELECT homework_id, MAX(submission_date) AS latest_submission_date
                        FROM student_homework_submission
                        WHERE student_id = %s
                        GROUP BY homework_id
                    ) AS latest_shs
                    ON shs.homework_id = latest_shs.homework_id
                    AND shs.submission_date = latest_shs.latest_submission_date
                    AND shs.student_id = %s
                ) AS filtered_shs
                    ON h.id = filtered_shs.homework_id
                WHERE LOWER(s.subject_name) = LOWER(%s) 
                    AND (
                        h.level_id = (
                            SELECT sc.level_id
                            FROM student_classes sc
                            JOIN classes c ON sc.class_id = c.class_id
                            JOIN subjects sub ON c.subject_id = sub.subject_id AND sub.subject_id = s.subject_id
                            WHERE sc.student_id = %s
                            LIMIT 1
                        )
                        OR h.level_id = 3  -- SL/HL homework (id=3) is visible to all students (both SL and HL)
                    )
                    AND g.grade = %s
                ORDER BY h.assignedDate DESC;
            """
            print(f"[DEBUG] Executing SQL with params: student_id={student_id}, subject={subject}, grade={grade}")
            # First, let's check if the subject exists and if student is registered
            check_subject_sql = """
                SELECT s.subject_id, s.subject_name, ss.level
                FROM subjects s
                LEFT JOIN student_subjects ss ON s.subject_id = ss.subject_id AND ss.student_id = %s
                WHERE LOWER(s.subject_name) = LOWER(%s)
            """
            cursor.execute(check_subject_sql, (student_id, subject))
            subject_info = cursor.fetchone()
            print(f"[DEBUG] Subject info: {subject_info}")
            
            # Execute main query: student_id (for submissions), student_id (for submissions), subject, student_id (for level check), grade
            cursor.execute(sql, (student_id, student_id, subject, student_id, grade))
            homework_list = cursor.fetchall()
            print(f"[DEBUG] Found {len(homework_list)} homework items for subject {subject}")

            # Helper function to format dates consistently
            def format_date(date_value):
                if date_value is None:
                    return None
                if isinstance(date_value, str):
                    return date_value
                # Handle datetime/date objects
                try:
                    return date_value.strftime("%Y-%m-%d")
                except AttributeError:
                    return str(date_value)

            # Format the response with consistent snake_case field names
            homework_status = [
                {
                    "homework_id": hw["homework_id"],
                    "submission_id": hw["submission_id"] if hw["submission_id"] else None,
                    "title": hw["title"],
                    "assignedDate": format_date(hw["assignedDate"]),
                    "dueDate": format_date(hw["dueDate"]),
                    "description": hw["description"] if hw["description"] else "",
                    "homework_file_name": hw["homework_file_name"] if hw["homework_file_name"] else None,
                    "submitted": hw["submission_id"] is not None,
                    "submission_date": format_date(hw["submission_date"]),
                    "marks": hw["marks"] if hw["marks"] is not None else None,
                    "comment": hw["comment"] if hw["comment"] else None,
                    "text_attachment": hw["text_attachment"] if hw["text_attachment"] else None,
                    "student_file_name": hw["student_file_name"] if hw["student_file_name"] else None,
                    "raw_score": hw["raw_score"] if hw["raw_score"] is not None else None,
                    "total_score": hw["total_score"] if hw["total_score"] is not None else None,
                    "teacher_comment_file_name": hw["teacher_comment_file_name"] if hw["teacher_comment_file_name"] else None,
                }
                for hw in homework_list
            ]
            print(f"[DEBUG] Returning {len(homework_status)} formatted homework items")
    except Exception as e:
        print(f"[ERROR] Error fetching homework: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to fetch homework data", "details": str(e)}), 500
    finally:
        connection.close()
    
    return jsonify(homework_status), 200


@app.route("/api/grade-homework", methods=["POST"])
@cross_origin()
@jwt_required()
def grade_homework():
    data = request.get_json()
    teacher_name = get_jwt()["name"]
    submitted_homework_id = data.get("submitted_homework_id")
    raw_score = int(data.get("raw_score"))
    total_score = int(data.get("total_score"))
    marks = int(data.get("calculated_score"))
    comment = data.get("comment")

    # convert raw score out of 100
    raw_marks = int((raw_score / total_score) * 100)

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "UPDATE student_homework_submission SET raw_marks = %s, raw_score = %s, total_score = %s, marks = %s, comment = %s, graded_by = %s WHERE id = %s"
            cursor.execute(
                sql,
                (
                    raw_marks,
                    raw_score,
                    total_score,
                    marks,
                    comment,
                    teacher_name,
                    submitted_homework_id,
                ),
            )
            connection.commit()
    finally:
        connection.close()

    return jsonify({"message": "submitted homework updated successfully"}), 200


# matches parents and students TODO finished need to add jwt_required()
# replaced with parent-student-matches
@app.route("/api/parent-student-link", methods=["POST"])
@jwt_required()
def submit_parent_name():
    data = request.json()
    student_id = data["student_id"]
    parent_id = data["parent_id"]

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            sql = "INSERT INTO parents_students (parent_id, student_id) VALUES (%s, %s)"
            cursor.execute(sql, (parent_id, student_id))

            connection.commit()

    finally:
        connection.close()

    return jsonify({"message": "Parent Student linked successfully"}), 200


@app.route("/api/submit-name", methods=["POST"])
@cross_origin()
@jwt_required()
def submit_name():
    if request.method == "OPTIONS":
        print("option ")
        return build_preflight_response()
    elif request.method == "POST":
        data = request.get_json()
        student_name = data["name"]
        student_id = get_jwt_identity()

        connection = get_db_connection()

        try:
            with connection.cursor() as cursor:
                check_sql = "SELECT COUNT(*) as cnt FROM students WHERE name = %s AND student_id != %s"
                cursor.execute(check_sql, (student_name, student_id))
                duplicate_count = cursor.fetchone()["cnt"]
                print("duplicate count", duplicate_count)

                if duplicate_count > 0:
                    duplicate_suffix = duplicate_count + 1
                else:
                    duplicate_suffix = None

                sql = "UPDATE students SET name = %s, duplicate = %s WHERE student_id = %s"
                cursor.execute(sql, (student_name, duplicate_suffix, student_id))
                connection.commit()
        finally:
            connection.close()

        return jsonify({"message": "Name updated successfully"}), 200


@app.route("/api/token/reissue", methods=["GET"])
@jwt_required(refresh=True)
def reissue_token():
    user_id = get_jwt_identity()
    current_jwt = get_jwt()

    role = current_jwt["role"]
    name = current_jwt["name"]

    if role == "student":
        # print("current jwt :",current_jwt)
        kakao_access_token = current_jwt.get("kakao_access_token")
        kakao_refresh_token = current_jwt.get("kakao_refresh_token")

        grade = current_jwt["grade"]

        # if grade not present because admin didnt' set grade yet
        if not grade:
            grade = get_student_grade(user_id)

        additional_claims = {
            "role": "student",
            "name": name,
            "grade": grade,
        }

        if kakao_access_token and kakao_refresh_token:
            additional_claims = {
                "kakao_access_token": kakao_access_token,
                "kakao_refresh_token": kakao_refresh_token,
                "role": "student",
                "name": name,
                "grade": grade,
            }

        try:
            # Generate new JWT tokens with updated Kakao tokens
            response = jsonify({"msg": "Tokens refreshed"})
            set_access_cookies(
                response,
                create_access_token(
                    identity=user_id, additional_claims=additional_claims
                ),
            )
            set_refresh_cookies(
                response,
                create_refresh_token(
                    identity=user_id, additional_claims=additional_claims
                ),
            )

            return response, 200
        except Exception as e:
            return jsonify({"msg": "Reauthentication required", "error": str(e)}), 401
    elif role == "parent":
        additional_claims = {
            "name": current_jwt["name"],
            "role": "parent",
        }

        try:
            # Generate new JWT tokens with updated Kakao tokens
            response = jsonify({"msg": "Parent Tokens refreshed"})
            set_access_cookies(
                response,
                create_access_token(
                    identity=user_id, additional_claims=additional_claims
                ),
            )
            set_refresh_cookies(
                response,
                create_refresh_token(
                    identity=user_id, additional_claims=additional_claims
                ),
            )

            return response, 200
        except Exception as e:
            return jsonify({"msg": "Reauthentication required", "error": str(e)}), 401

    elif role == "admin":
        additional_claims = {
            "name": current_jwt["name"],
            "role": "admin",
        }

        try:
            # Generate new JWT tokens with updated Kakao tokens
            response = jsonify({"msg": "Admin Tokens refreshed"})
            set_access_cookies(
                response,
                create_access_token(
                    identity=user_id, additional_claims=additional_claims
                ),
            )
            set_refresh_cookies(
                response,
                create_refresh_token(
                    identity=user_id, additional_claims=additional_claims
                ),
            )

            return response, 200
        except Exception as e:
            return jsonify({"msg": "Reauthentication required", "error": str(e)}), 401


# verify user for login
@app.route("/api/verify-token", methods=["GET"])
@jwt_required()  # Automatically checks the token's validity
def verify_token():
    jwt_claims = get_jwt()

    try:
        role = jwt_claims.get("role")
        print("role and role", role, request.args.get("role"))
        if role != request.args.get("role"):
            print("wrong role")
            response = make_response(
                jsonify(
                    {
                        "authenticated": False,
                        "msg": "Unknown role",
                        "code": "UNKNOWN_ROLE",
                    }
                )
            )
            response.set_cookie("access_token_cookie", "", expires=0, path="/")
            response.set_cookie("refresh_token_cookie", "", expires=0, path="/")
            return response, 401
        if role == "admin":
            return jsonify({"authenticated": True, "role": "admin"}), 200
        elif role == "student":
            # if the student didnt set name, make him login again
            student_name = jwt_claims.get("name")
            if student_name:
                return jsonify({"authenticated": True, "role": "student"}), 200
            else:
                return jsonify({"authenticated": False, "role": "student"}), 401
        elif role == "parent":
            return jsonify({"authenticated": True, "role": "parent"}), 200
        else:
            return jsonify({
                "authenticated": False,
                "msg": "Unknown role",
                "code": "UNKNOWN_ROLE",
            }), 401
    except Exception as e:
        print(f"Error in verify_token: {str(e)}")
        return jsonify({
            "authenticated": False,
            "msg": "Token verification failed",
            "code": "UNKNOWN_ROLE",
            "error": str(e)
        }), 401


# get timetable
@app.route("/api/get-timetables", methods=["GET"])
def get_timetables():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            # 1) fetch time slots
            cursor.execute(
                "SELECT time_slot_id, start_time, end_time, grade_id FROM time_slots ORDER BY grade_id, time_slot_id"
            )
            time_slots = cursor.fetchall()

            # Create a time slots list
            time_slots_per_grades = {}
            time_slot = {}
            for ts in time_slots:
                time_slot_id = ts["time_slot_id"]
                start_time = timedelta_to_string(ts["start_time"])
                end_time = timedelta_to_string(ts["end_time"])
                grade_id = str(ts["grade_id"])

                time_slot = {
                    "time_slot_id": time_slot_id,
                    "start_time": start_time,
                    "end_time": end_time,
                }

                if grade_id not in time_slots_per_grades:
                    time_slots_per_grades[grade_id] = []
                time_slots_per_grades[grade_id].append(time_slot)

            # Fetch timetable data
            timetable_query = """
                SELECT t.timetable_id, d.day_name, t.time_slot_id, s.subject_name, t.level, tea.id, g.grade_id
                FROM timetable t
                JOIN subjects s ON t.subject_id = s.subject_id
                JOIN days d ON t.day_id = d.day_id
                JOIN grades g ON t.grade_id = g.grade_id
                JOIN teachers tea on t.teacher_id = tea.id
                ORDER BY g.grade_id, d.day_id, t.time_slot_id
            """
            cursor.execute(timetable_query)
            timetables_data = cursor.fetchall()

            # Organize data into the desired format
            timetables = {}
            timetables_per_grades = {}

            for row in timetables_data:
                grade_id = str(row["grade_id"])
                timetable_id = row["timetable_id"]
                day_name = row["day_name"]
                time_slot_id = str(
                    row["time_slot_id"]
                )  # Convert to string for consistency
                subject_name = row["subject_name"]
                level = row["level"]
                teacher_id = row["id"]

                if grade_id not in timetables_per_grades:
                    timetables_per_grades[grade_id] = {}
                if day_name not in timetables_per_grades[grade_id]:
                    timetables_per_grades[grade_id][day_name] = {}
                if time_slot_id not in timetables_per_grades[grade_id][day_name]:
                    timetables_per_grades[grade_id][day_name][time_slot_id] = {}

                # Add the subject information to the appropriate timetable entry
                timetables_per_grades[grade_id][day_name][time_slot_id][
                    timetable_id
                ] = {
                    "subject_name": subject_name,
                    "level": level,
                    "teacher_id": teacher_id,
                }

            # Return the structured response
            # three grades 1,2,3 need to work TODO fine for now
            timetables_with_grades = {}
            for grade in range(1, 4):
                grade_str = str(grade)
                if grade_str in timetables_per_grades:
                    timetables_with_grades[grade_str] = {
                        "timeSlots": time_slots_per_grades[grade_str],
                        "timetables": timetables_per_grades[grade_str],
                    }
                else:
                    timetables_with_grades[grade_str] = {
                        "timeSlots": [],
                        "timetables": {},
                    }
            return jsonify(timetables_with_grades)

    except Exception as e:
        print(f"Error fetching timetable: {e}")
        return jsonify({"error": "Failed to fetch timetable data"}), 500
    finally:
        connection.close()

    return jsonify(data)


# save timetable
@app.route("/api/save-timetables", methods=["POST"])
@jwt_required()
def save_timetables():
    global should_reschedule

    # Set the flag to indicate the background thread should reschedule
    # re running the schedule
    should_reschedule = True

    data = request.json
    grade_id = data["activeGrade"]
    print("homework data is ", data)

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            # delete everything before
            cursor.execute("DELETE FROM timetable where grade_id = %s", (grade_id))
            cursor.execute("DELETE FROM time_slots where grade_id = %s", (grade_id))
            cursor.execute(
                "DELETE FROM teacher_time_slots where grade_id = %s", (grade_id)
            )

            print("deleted everything")

            # Insert time slots into the 'time_slots' table
            for time_slot in data["timeSlots"]:
                time_slot_id = (
                    int(data["activeGrade"]) * 1000 + time_slot["time_slot_id"]
                )
                print(
                    "adding time slot",
                    time_slot["start_time"],
                    time_slot["end_time"],
                    grade_id,
                )
                sql = """
                    INSERT INTO time_slots (time_slot_id, start_time, end_time, grade_id)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(
                    sql,
                    (
                        time_slot_id,
                        time_slot["start_time"],
                        time_slot["end_time"],
                        grade_id,
                    ),
                )
            connection.commit()

            cursor.execute(
                "SELECT time_slot_id FROM time_slots where grade_id = %s", (grade_id)
            )
            time_slot_id_list = cursor.fetchall()
            print("time slot id list", time_slot_id_list)

            # Insert timetable entries into the 'timetable' table
            for day_name, time_slots in data["timetables"].items():
                idx = 0
                for time_slot_id, class_slot in time_slots.items():
                    time_slot_id = int(data["activeGrade"]) * 1000 + int(time_slot_id)
                    for timetable_id, class_info in class_slot.items():
                        sql = """
                            INSERT INTO timetable (grade_id, day_id, time_slot_id, subject_id, level, teacher_id)
                            VALUES (
                                    %s,
                                    (SELECT day_id FROM days WHERE day_name = %s), 
                                    %s, 
                                    (SELECT subject_id FROM subjects WHERE subject_name = %s), 
                                    %s,
                                    %s)
                        """
                        # ON DUPLICATE KEY UPDATE
                        #     day_id = VALUES(day_id),
                        #     time_slot_id = VALUES(time_slot_id),
                        #     subject_id = VALUES(subject_id),
                        #     level = VALUES(level);
                        cursor.execute(
                            sql,
                            (
                                grade_id,
                                day_name,
                                time_slot_id,
                                class_info["subject_name"],
                                class_info["level"],
                                class_info["teacher_id"],
                            ),
                        )

                        # insert into teacher_time_slots for zoom recording naming
                        sql = """
                            INSERT INTO teacher_time_slots (day_id, teacher_id, grade_id, subject_id, start_time)
                            VALUES (
                                (SELECT day_id FROM days WHERE day_name = %s),
                                %s,
                                %s,
                                (SELECT subject_id FROM subjects WHERE subject_name = %s),
                                (SELECT start_time FROM time_slots WHERE time_slot_id = %s)
                            )
                        """
                        cursor.execute(
                            sql,
                            (
                                day_name,
                                class_info["teacher_id"],
                                grade_id,
                                class_info["subject_name"],
                                time_slot_id,
                            ),
                        )
                    idx += 1

        # Commit the transaction
        connection.commit()

    except pymysql.MySQLError as e:
        print(f"Error: {e}")
        connection.rollback()
        return jsonify({"msg": "error in saving timetable"}), 500
    finally:
        connection.close()

    return jsonify({"msg": "timetable added succesfully"}), 200
    # new_homework = request.json
    # title = new_homework['title']
    # subject = new_homework['subject'].lower().replace(' ','_')
    # assignedDate = new_homework['assignedDate']
    # dueDate = new_homework['dueDate']
    # grades = ','.join(new_homework['grades'])  # Assuming grades is a list
    # levels = ','.join(new_homework['levels'])  # Assuming levels is a list
    # description = new_homework['description']
    # homework_type = new_homework['type']

    # connection = get_db_connection()

    # try:
    #     with connection.cursor() as cursor:
    #         sql = """
    #         INSERT INTO homework (title, subject, assignedDate, dueDate, grades, levels, description, type)
    #         VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    #         """
    #         cursor.execute(sql, (title, subject, assignedDate, dueDate, grades, levels, description, homework_type))
    #         connection.commit()
    # finally:
    #     connection.close()

    # return jsonify({'message': 'Homework created successfully'}), 200


@app.route("/api/student/submit-attendance", methods=["POST"])
@jwt_required()
def submit_attendance():
    # Get data from request
    data = request.json
    student_id = data.get("student_id")

    # no student_id passed means request sent by the student -> get_jwt_identity()
    if not student_id:
        student_id = get_jwt_identity()

    subject_name = data.get("subject_name")
    attendance_date = data.get("attendance_date")  # Optional if you want to specify
    status = data.get("status")
    timetable_id = data.get("timetable_id")

    # Validate the input data
    if not all([student_id, subject_name, status]):
        return jsonify({"error": "Missing required fields"}), 400

    # Set current date if attendance_date is not provided
    if not attendance_date:
        attendance_date = datetime.datetime.now().date()

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Get class context from timetable_id if available
            class_context = None
            if timetable_id:
                sql_context = """
                    SELECT 
                        t.class_id,
                        t.day_id,
                        t.time_slot_id,
                        t.teacher_id,
                        c.subject_id,
                        c.level_id,
                        c.mode_id,
                        c.grade_id,
                        ts.start_time,
                        ts.end_time
                    FROM timetable t
                    JOIN classes c ON t.class_id = c.class_id
                    JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
                    WHERE t.timetable_id = %s
                """
                cursor.execute(sql_context, (timetable_id,))
                class_context = cursor.fetchone()

            # Insert attendance record with denormalized fields
            if class_context:
                sql = """
                    INSERT INTO attendance (
                        student_id, subject_name, attendance_date, status, timetable_id,
                        class_id, subject_id, level_id, mode_id, grade_id,
                        day_id, time_slot_id, start_time, end_time, teacher_id
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(
                    sql,
                    (
                        student_id,
                        subject_name,
                        attendance_date,
                        status,
                        timetable_id,
                        class_context["class_id"],
                        class_context["subject_id"],
                        class_context["level_id"],
                        class_context["mode_id"],
                        class_context["grade_id"],
                        class_context["day_id"],
                        class_context["time_slot_id"],
                        class_context["start_time"],
                        class_context["end_time"],
                        class_context["teacher_id"],
                    ),
                )
            else:
                # Fallback: insert without denormalized fields
                sql = """
                    INSERT INTO attendance (student_id, subject_name, attendance_date, status, timetable_id)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(
                    sql, (student_id, subject_name, attendance_date, status, timetable_id)
                )
            connection.commit()

        return jsonify({"msg": "Attendance record added successfully"}), 200

    except pymysql.MySQLError as e:
        print(f"Error: {e}")
        return jsonify({"error": "Database error"}), 500

    finally:
        connection.close()


# get attendance for all student
@app.route("/api/get-attendance", methods=["GET"])
@jwt_required()
def get_attendance():
    attendance_date = request.args.get("attendance_date")
    print("attendance date", attendance_date)
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT * from attendance where attendance_date = %s"
            cursor.execute(sql, (attendance_date))
            data = cursor.fetchall()

    finally:
        connection.close()
    print("result of attendance", data)
    return jsonify(data)


# get attendance for all student
@app.route("/api/student/grade", methods=["GET"])
@jwt_required()
def get_student_grade():
    student_id = get_jwt_identity()

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT grade from students WHERE student_id = %s"
            cursor.execute(sql, (student_id))
            data = cursor.fetchone()

    finally:
        connection.close()

    return jsonify(data)


# get list of subjects
@app.route("/api/get-current-class", methods=["GET"])
@jwt_required()
def get_current_class():
    student_id = get_jwt_identity()

    seoul_tz = pytz.timezone("Asia/Seoul")
    current_time = datetime.now(seoul_tz).time()
    current_day = datetime.now(seoul_tz).strftime("%A")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT grade FROM students WHERE student_id = %s
            """
            cursor.execute(sql, (student_id,))
            current_slot = cursor.fetchone()

            grade_id = 1
            if current_slot["grade"] == "11":
                grade_id = 1
            elif current_slot["grade"] == "12":
                grade_id = 2
            elif current_slot["grade"] == "pre-IB":
                grade_id = 3
            elif current_slot["grade"] == "MYP":
                grade_id = 4
            else:
                grade_id = 3

            # Query to find the current time slot
            sql_time_slot = """
                SELECT time_slot_id, start_time, end_time
                FROM time_slots
                WHERE %s BETWEEN DATE_SUB(start_time, INTERVAL 5 MINUTE) AND end_time
                AND grade_id = %s
            """
            cursor.execute(sql_time_slot, (current_time, grade_id))
            current_slot = cursor.fetchone()

            print("current time slo", current_slot)

            if not current_slot:
                return jsonify({"message": "No current class found."}), 404

            # Get the time_slot_id
            time_slot_id = current_slot["time_slot_id"]

            # Query to get the current day_id
            sql_day_id = """
                SELECT day_id
                FROM days
                WHERE day_name = %s
            """
            cursor.execute(sql_day_id, (current_day,))
            day_info = cursor.fetchone()

            if not day_info:
                return jsonify({"message": "Current day not found."}), 404

            day_id = day_info["day_id"]

            # Query to get the subjects for the given student_id
            sql_student_subjects = """
                SELECT subject_id, level
                FROM student_subjects
                WHERE student_id = %s
            """
            cursor.execute(sql_student_subjects, (student_id,))
            student_subjects = cursor.fetchall()

            print("student_subjects", student_subjects)

            if not student_subjects:
                return jsonify({"message": "No subjects found for the student."}), 404

            # Prepare a list to hold the current classes
            class_info = {}

            # Iterate over each subject of the student to find current classes
            for value in student_subjects:
                subject_id = value["subject_id"]
                level = value["level"]
                # Query to find classes in the current time slot for each subject
                sql_current_class = """
                    SELECT t.subject_id, ts.start_time, ts.end_time
                    FROM timetable t
                    JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
                    WHERE t.time_slot_id = %s AND t.subject_id = %s AND t.day_id = %s AND (t.level = %s OR t.level = 'SL,HL')
                """
                cursor.execute(
                    sql_current_class, (time_slot_id, subject_id, day_id, level)
                )
                current_class = cursor.fetchall()

                # Add class info to the list

                if current_class:
                    subject_id = current_class[0]["subject_id"]
                    start_time = current_class[0]["start_time"]
                    end_time = current_class[0]["end_time"]

                    cursor.execute(
                        "SELECT subject_name from subjects WHERE subject_id = %s;",
                        (subject_id),
                    )
                    subject_name = cursor.fetchone()["subject_name"]

                    sql = """
                        SELECT status FROM attendance 
                        WHERE student_id = %s 
                        AND attendance_date = CURDATE()
                        AND subject_name = %s
                    """
                    cursor.execute(sql, (student_id, subject_name))
                    list_of_status = cursor.fetchall()

                    print("list of status", list_of_status)

                    if list_of_status and list_of_status[-1]["status"] == "recorded":
                        continue

                    print("subject name", subject_name)
                    class_info["subject_name"] = subject_name
                    class_info["level"] = level
                    class_info["start_time"] = str(start_time)
                    class_info["end_time"] = str(end_time)

            return jsonify(class_info)

    finally:
        connection.close()


# get list of all subjects
@app.route("/api/get-grade-subjects", methods=["GET"])
@jwt_required()
def get_subject_list_per_grade():
    grade_id = request.args.get("gradeID")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            query = """
                SELECT 
                    sub.subject_name 
                FROM 
                    homework h 
                JOIN
                    subjects sub ON h.subject_id = sub.subject_id 
                WHERE 
                    h.grade_id = %s 
                GROUP BY 
                    sub.subject_name
                """
            cursor.execute(query, grade_id)
            data = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(data)


# get list of all subjects
@app.route("/api/get-subjects", methods=["GET"])
@jwt_required()
def get_subject_list():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT subject_name from subjects ORDER BY subject_name"
            cursor.execute(sql)
            data = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(data)


def get_current_day_id():
    # Define Asia/Seoul timezone
    seoul_tz = pytz.timezone("Asia/Seoul")

    # Get current date and time in Seoul timezone
    now_seoul = datetime.now(seoul_tz)

    # Get the weekday (0=Monday, ..., 6=Sunday)
    weekday = now_seoul.weekday()

    # Map weekday to day_id (1=Monday, ..., 7=Sunday)
    day_id = weekday + 1
    return day_id


# get timetable. List of subjects the student take
@app.route("/api/student/timetable", methods=["GET"])
@jwt_required()
def get_student_timetable_list():
    student_id = get_jwt_identity()
    grade = get_jwt()["grade"]
    if grade == "11":
        grade_id = "1"
    elif grade == "12":
        grade_id = "2"
    elif grade == "pre-IB":
        grade_id = "3"
    elif grade == "MYP":
        grade_id = "4"
    else:
        grade_id = "3"

    current_day_id = get_current_day_id()

    print("grade id value", grade_id)

    connection = get_db_connection()

    student_subjects = []
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT s.subject_name, ss.level
                FROM student_subjects ss
                JOIN subjects s ON ss.subject_id = s.subject_id
                WHERE ss.student_id = %s;
            """
            cursor.execute(sql, (student_id))
            student_subjects = cursor.fetchall()
    finally:
        connection.close()

    if not student_subjects:
        return jsonify({"error": "No subjects provided for the student"}), 400

    # Build SQL query
    query = """
        SELECT 
            t.timetable_id,
            t.day_id,
            t.time_slot_id,
            s.subject_name,
            t.level,
            t.grade_id,
            s.fg_color,
            s.bg_color,
            s.gradient,
            tea.name,
            ts.start_time,
            ts.end_time
        FROM 
            timetable t
        JOIN 
            subjects s ON t.subject_id = s.subject_id
        JOIN
            teachers tea ON t.teacher_id = tea.id
        JOIN
            time_slots ts ON t.time_slot_id = ts.time_slot_id
        WHERE 
            (s.subject_name, t.level) IN (
    """

    # Dynamic filtering based on student's subjects and levels
    conditions = []
    for subject in student_subjects:
        if subject["level"] == "SL":
            # Allow both 'SL' and 'SL/HL' levels for 'SL' students
            conditions.append(f"('{subject['subject_name']}', 'SL')")
            conditions.append(f"('{subject['subject_name']}', 'SL,HL')")
        elif subject["level"] == "HL":
            # Allow both 'HL' and 'SL/HL' levels for 'HL' students
            conditions.append(f"('{subject['subject_name']}', 'HL')")
            conditions.append(f"('{subject['subject_name']}', 'SL,HL')")

    print("conditions for timetable", conditions)

    # Join conditions in SQL query
    query += (
        ", ".join(conditions)
        + ") AND t.day_id = %s AND tea.teacher_type = 'teacher' AND t.grade_id = %s ORDER BY t.day_id, t.time_slot_id;"
    )

    try:
        # Execute query
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(query, (current_day_id, grade_id))
            results = cursor.fetchall()
            print("result for timetable", results)

            for class_slot in results:
                class_slot["start_time"] = timedelta_to_string(class_slot["start_time"])
                class_slot["end_time"] = timedelta_to_string(class_slot["end_time"])

        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        connection.close()


# get student's attendance rate
@app.route("/api/student/attendanceRate", methods=["GET"])
@jwt_required()
def get_student_attendance_rate():
    role = get_jwt()["role"]

    student_id = None

    if role == "student":
        student_id = get_jwt_identity()

    elif role == "parent":
        student_id = request.args.get("student_id")

    else:
        return jsonify({"error": "You should be either parent or student"}), 400

    seoul_tz = pytz.timezone("Asia/Seoul")
    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
    current_date = get_current_time_kst()

    number_of_days = (current_date - start_date).days + 1

    print("number of days passed", number_of_days)

    if number_of_days <= 0:
        number_of_days = 1

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT * FROM student_classes WHERE student_id = %s;
            """
            cursor.execute(sql, (student_id,))
            subject_count = cursor.fetchall() or []

            sql = """
                SELECT DISTINCT day_id from timetable
            """
            cursor.execute(sql)
            distinct_days = len(cursor.fetchall())

            # minus one because on the 7th day sunday, it is still 0th week
            week_number = (number_of_days - 1) // 7

            # total_rate= len(subject_count) * (
            #     number_of_days - ((todays_week) * (7 - distinct_days))
            # )

            # number of subject *  (week number * dinstict days + (number of days - (week number * 7)) - 1)

            total_days_passed_in_current_week = number_of_days % 7
            valid_days_passed_in_current_week = 0
            if total_days_passed_in_current_week == 0:
                valid_days_passed_in_current_week = distinct_days
            elif total_days_passed_in_current_week > distinct_days:
                valid_days_passed_in_current_week = distinct_days
            else:
                valid_days_passed_in_current_week = total_days_passed_in_current_week

            app.logger.info(
                f"week_number: {week_number}, distinct_days: {distinct_days}, number_of_days: {number_of_days}, valid_days_passed_in_current_week: {valid_days_passed_in_current_week}"
            )

            rate_excluding_today = len(subject_count) * (
                week_number * distinct_days + (valid_days_passed_in_current_week - 1)
            )

            sql = """
                SELECT COUNT(DISTINCT c.class_id) AS classes_passed
                FROM student_classes sc
                JOIN classes c ON sc.class_id = c.class_id
                JOIN timetable t ON t.class_id = c.class_id
                JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
                WHERE sc.student_id = %s
                AND t.day_id = (DAYOFWEEK(CURDATE())-1)
                AND ts.start_time < CURTIME()
            """

            cursor.execute(sql, (student_id,))

            rate_today_row = cursor.fetchone()
            if isinstance(rate_today_row, dict):
                rate_today = rate_today_row.get("classes_passed", 0) or 0
            elif rate_today_row:
                rate_today = rate_today_row[0]
            else:
                rate_today = 0

            total_rate = rate_excluding_today + rate_today

            sql = """
                SELECT attendance_date, subject_name, COUNT(*) as count
                FROM attendance
                WHERE student_id = %s
                AND attendance_date between %s and CURDATE()
                AND status != "absent" AND status != "reset"
                GROUP BY attendance_date, subject_name
            """
            cursor.execute(sql, (student_id, SEHAN_START_DATE))
            number_of_attendance = len(cursor.fetchall())

            app.logger.info(
                f"Attendance rate for student_id:{student_id}, number_of_attendance: {number_of_attendance}, total_rate: {total_rate}, rate_today: {rate_today}, rate_excluding_today: {rate_excluding_today}"
            )

            if total_rate <= 0:
                total_rate = number_of_attendance + 1

            print(
                "number of attendance and total rate", number_of_attendance, total_rate
            )

            attendance_rate = int((number_of_attendance / total_rate) * 100)

            if attendance_rate > 100:
                attendance_rate = 100

            # subject_names = [subject['subject_name'] for subject in subjects]

    finally:
        connection.close()

    return jsonify(attendance_rate)


# get student's homework submission rate
@app.route("/api/student/homeworkRate", methods=["GET"])
@jwt_required()
def get_student_homework_rate():
    role = get_jwt()["role"]

    student_id = None
    grade = None

    if role == "student":
        student_id = get_jwt_identity()
        grade = get_jwt()["grade"]
    elif role == "parent":
        student_id = request.args.get("student_id")
        print("student_id in homeworkrate", student_id)
        connection = get_db_connection()
        try:
            with connection.cursor() as cursor:
                sql = "SELECT grade FROM students WHERE student_id = %s"
                cursor.execute(sql, (student_id,))
                grade_row = cursor.fetchone()
                if isinstance(grade_row, dict):
                    grade = grade_row.get("grade")
                elif grade_row:
                    grade = grade_row[0]
                else:
                    grade = None
        finally:
            connection.close()
    else:
        return jsonify({"error": "You should be either parent or student"}), 400

    if not student_id or not grade:
        return jsonify({"error": "Missing student_id or student_grade"}), 400

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            # get homework total count
            homework_query = """
                SELECT COUNT(DISTINCT h.id) AS total_homework
                FROM homework h
                JOIN classes c
                    ON h.subject_id = c.subject_id
                    AND h.level_id = c.level_id
                    AND h.grade_id = c.grade_id
                JOIN student_classes sc
                    ON sc.class_id = c.class_id
                WHERE sc.student_id = %s AND h.assignedDate <= CURDATE()
            """
            cursor.execute(homework_query, (student_id,))
            applicable_homework = cursor.fetchone() or {}
            if isinstance(applicable_homework, dict):
                total_homework_count = applicable_homework.get("total_homework", 0) or 0
            else:
                total_homework_count = applicable_homework[0] if applicable_homework else 0

            print("\ntotal homework count", total_homework_count)

            # get homework submission count
            submission_query = """
            SELECT COUNT(DISTINCT shs.homework_id) AS submitted_homework
                FROM student_homework_submission shs
                JOIN homework h ON shs.homework_id = h.id
                JOIN classes c
                    ON h.subject_id = c.subject_id
                    AND h.level_id = c.level_id
                    AND h.grade_id = c.grade_id
                JOIN student_classes sc
                    ON sc.class_id = c.class_id
                WHERE sc.student_id = %s
                AND shs.student_id = %s
            """
            cursor.execute(submission_query, (student_id, student_id))
            submitted_row = cursor.fetchone() or {}
            if isinstance(submitted_row, dict):
                submitted_count = submitted_row.get("submitted_homework", 0) or 0
            else:
                submitted_count = submitted_row[0] if submitted_row else 0

        # Calculate the submission rate
        submission_rate = (
            int((submitted_count / total_homework_count) * 100)
            if total_homework_count > 0
            else 0
        )

        if submission_rate > 100:
            submission_rate = 100

        print("submission rate is ", submission_rate)
        return jsonify(submission_rate)

    finally:
        connection.close()

    return jsonify(combined_data)


def fetch_student_subject_homework_average(student_id, subjects):

    if not subjects:
        raise ValueError("The subjects list cannot be empty")

    connection = get_db_connection()

    start_date, end_date = get_week_dates(1, 6)

    print("\nstart and end for subject homework average", start_date, end_date)

    try:
        with connection.cursor() as cursor:
            # Query to fetch the average marks for the given student and subjects
            sql = f"""
                SELECT h.subject, 
                       IFNULL(AVG(shs.raw_marks), 0) AS average_marks
                FROM homework h
                LEFT JOIN student_homework_submission shs 
                    ON h.id = shs.homework_id 
                    AND shs.student_id = %s
                    AND shs.submission_date = (
                        SELECT MAX(submission_date)
                        FROM student_homework_submission
                        WHERE homework_id = h.id
                        AND student_id = %s
                    )
                WHERE h.type = 'Homework'
                  AND h.subject IN ({', '.join(['%s'] * len(subjects))})
                  AND h.assignedDate BETWEEN %s AND %s
                GROUP BY h.subject
            """

            # Execute query
            cursor.execute(
                sql, [student_id] + [student_id] + subjects + [start_date, end_date]
            )
            results = cursor.fetchall()

            # Transform results to match desired output format
            averages = {row["subject"]: row["average_marks"] for row in results}
            # Ensure all provided subjects are included in the output
            output = [{subject: averages.get(subject, 0)} for subject in subjects]

    finally:
        connection.close()

    return output


def fetch_student_subject_exam_average(student_id, subjects):
    pass


# get average of subjects of student for homework
@app.route("/api/student/subjects/average", methods=["GET"])
@jwt_required()
def get_student_subject_average_list():

    custom_param = request.args.get("param")

    # when parent gives specific student id
    if custom_param:
        student_id = custom_param

    else:  # when student calls by himself
        student_id = get_jwt_identity()

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT s.subject_name
                FROM student_subjects ss
                JOIN subjects s ON ss.subject_id = s.subject_id
                WHERE ss.student_id = %s;
            """
            cursor.execute(sql, (student_id))
            subjects = cursor.fetchall()

            subject_names = [subject["subject_name"] for subject in subjects]

            average_scores = fetch_student_subject_homework_average(
                student_id, subject_names
            )
            print("average scores", average_scores)
            sql = """
                SELECT s.subject_name, s.fg_color, s.bg_color, s.gradient
                FROM student_subjects ss
                JOIN subjects s ON ss.subject_id = s.subject_id
                WHERE ss.student_id = %s;
            """
            cursor.execute(sql, (student_id))
            subjects_colors = cursor.fetchall()

            print("subjects_colors", subjects_colors)

            combined_data = []
            for subject in subjects_colors:
                subject_name = subject["subject_name"]

                # Find the average score for this subject
                score_dict = next(
                    (item for item in average_scores if subject_name in item), None
                )
                percent = (
                    score_dict[subject_name] if score_dict else 0
                )  # default to 0 if not found

                # Create the combined dictionary
                combined_data.append(
                    {
                        "percent": percent,
                        "name": subject_name,
                        "fgColor": subject["fg_color"],
                        "bgColor": subject["bg_color"],
                        "gradient": subject["gradient"],
                    }
                )

    finally:
        connection.close()

    return jsonify(combined_data)


# get list of pending homewokr
@app.route("/api/student/pending-homework", methods=["GET"])
@jwt_required()
def get_pending_homework_list():
    role = get_jwt()["role"]

    student_id = None
    grade = None

    if role == "student":
        student_id = get_jwt_identity()
        grade = get_jwt()["grade"]
    elif role == "parent":
        student_id = request.args.get("student_id")
        print("student_id in homeworkrate", student_id)
        connection = get_db_connection()
        try:
            with connection.cursor() as cursor:
                sql = "SELECT grade FROM students WHERE student_id = %s"
                cursor.execute(sql, (student_id))
                grade = cursor.fetchone()["grade"]
        finally:
            connection.close()
    else:
        return jsonify({"error": "You should be either parent or student"}), 400

    print("getting pending homework for", grade, student_id)

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT h.id, h.title, h.assignedDate, h.dueDate, s.subject_name AS subject, s.fg_color
                FROM homework h
                LEFT JOIN student_homework_submission shs
                    ON h.id = shs.homework_id AND shs.student_id = %s
                JOIN subjects s 
                    ON h.subject_id = s.subject_id
                JOIN levels l
                    ON h.level_id = l.id
                JOIN grades g
                    ON h.grade_id = g.grade_id
                JOIN student_subjects ss
                    ON ss.student_id = %s AND ss.subject_id = s.subject_id
                WHERE shs.homework_id IS NULL
                AND (
                    h.level_id = (
                        SELECT l2.id 
                        FROM student_subjects ss2
                        JOIN levels l2 ON ss2.level = l2.level_name
                        WHERE ss2.student_id = %s 
                        AND ss2.subject_id = s.subject_id
                        LIMIT 1
                    )
                    OR h.level_id = 3  -- SL/HL homework (id=3) is visible to all students (both SL and HL)
                )
                AND g.grade = %s
                AND h.dueDate >= CURDATE();
            """
            cursor.execute(sql, (student_id, student_id, student_id, grade))
            data = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(data)


# get list of subjects (maybe get level for subject as well?)
@app.route("/api/student/get-subjects", methods=["GET"])
@jwt_required()
def get_student_subject_list():
    student_id = get_jwt_identity()
    print(f"[DEBUG] get_student_subject_list called with student_id: {student_id}")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT s.subject_name, ss.level
                FROM student_subjects ss
                JOIN subjects s ON ss.subject_id = s.subject_id
                WHERE ss.student_id = %s;
            """
            print(f"[DEBUG] Executing SQL: {sql} with student_id: {student_id}")
            cursor.execute(sql, (student_id))
            data = cursor.fetchall()
            print(f"[DEBUG] Found {len(data)} subjects for student {student_id}: {data}")

    except Exception as e:
        print(f"[ERROR] Error in get_student_subject_list: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to fetch subjects", "details": str(e)}), 500
    finally:
        connection.close()

    return jsonify(data)


# get student list TODO need to add jwt required (in parent setup name, show student - school list) - not required anymore
@app.route("/api/student/for-parent", methods=["GET"])
def get_student_data_for_parent():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT student_id, name, school FROM students;
            """
            cursor.execute(sql)
            results = cursor.fetchall()

            return jsonify(results)

    finally:
        connection.close()


# get manual student list
@app.route("/api/student/manual/getList", methods=["GET"])
@jwt_required()
def get_student_manual_list():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT student_id, name, email, password FROM students
                WHERE email is not null;
            """
            cursor.execute(sql)
            results = cursor.fetchall()

            return jsonify(results), 200

    finally:
        connection.close()


# get student list
@app.route("/api/student/getList", methods=["GET"])
@jwt_required()
def get_student_list():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    s.student_id,
                    s.name,
                    s.duplicate,
                    s.grade,
                    s.school,
                    sub.subject_name,
                    ss.level,
                    sc.comment_text
                FROM 
                    students s
                JOIN 
                    student_subjects ss ON s.student_id = ss.student_id
                JOIN 
                    subjects sub ON ss.subject_id = sub.subject_id
                LEFT JOIN 
                    student_comments sc ON s.student_id = sc.student_id AND find_in_set(sub.subject_name, (SELECT t.subject FROM teachers t WHERE t.id = sc.teacher_id)) > 0
                    AND sub.subject_name = sc.subject_name
                ORDER BY 
                    s.name, sub.subject_name;
            """
            cursor.execute(sql)
            results = cursor.fetchall()

        students_dict = {}
        for row in results:
            student_id = row["student_id"]
            if student_id not in students_dict:
                students_dict[student_id] = {
                    "student_id": student_id,
                    "name": row["name"],
                    "school": row["school"],
                    "duplicate": row["duplicate"],
                    "grade": row["grade"],
                    "subjects": [],
                }
            students_dict[student_id]["subjects"].append(
                {
                    "subject_name": row["subject_name"],
                    "level": row["level"],
                    "comment_text": row["comment_text"] if row["comment_text"] else "",
                }
            )

        # Convert the dictionary to a list of dictionaries
        students_list = list(students_dict.values())
        return jsonify(students_list), 200

    finally:
        connection.close()


# get name of a single student
@app.route("/student/getName", methods=["GET"])
@jwt_required()
def get_student_name():
    student_id = get_jwt_identity()

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT name from students WHERE student_id = %s"
            cursor.execute(sql, (student_id))
            result = cursor.fetchone()

    finally:
        connection.close()

    return jsonify(result), 200


# get list of all student names
@app.route("/api/student/getNames", methods=["GET"])
@jwt_required()
def get_student_names():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT student_id, name, duplicate, grade from students"
            cursor.execute(sql)
            students = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(students)


# get list of student names who didn't register
@app.route("/api/student/getAllNames", methods=["GET"])
@jwt_required()
def get_all_student_names():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT student_id, name, duplicate from students WHERE grade IS NOT NULL"
            cursor.execute(sql)
            students = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(students)


# get student comments
@app.route("/api/student/comments", methods=["GET"])
@jwt_required()
def get_student_comments():
    student_id = request.args.get("student_id")

    connection = get_db_connection()
    comments = {}
    try:
        with connection.cursor() as cursor:
            # sql = """
            #     SELECT
            #         s.subject_name,
            #         sc.comment_text
            #     FROM
            #         student_subjects AS ss
            #     JOIN
            #         subjects AS s ON ss.subject_id = s.subject_id
            #     JOIN
            #         teachers AS t ON s.subject_name = t.subject
            #     JOIN
            #         student_comments AS sc ON sc.teacher_id = t.id
            #     WHERE
            #         ss.student_id = %s;
            # """
            sql = """
                SELECT
                    s.subject_name, 
                    sc.comment_text 
                FROM 
                    student_classes AS stc
                JOIN
                    classes AS c ON stc.class_id = c.class_id
                JOIN 
                    subjects AS s ON c.subject_id = s.subject_id
                LEFT JOIN 
                    student_comments AS sc 
                ON 
                    sc.student_id = stc.student_id
		            AND s.subject_name = sc.subject_name
                WHERE 
                    stc.student_id = %s;
            """
            cursor.execute(sql, (student_id,))
            results = cursor.fetchall()

            # Transform the results into the desired format
            for row in results:
                subject_name = row["subject_name"]
                comment_text = row["comment_text"]
                comments[subject_name] = comment_text if comment_text else ""

    finally:
        connection.close()

    return jsonify(comments)


# submit comment
@app.route("/api/student/submit-comment", methods=["POST"])
@jwt_required()
def submit_student_comment():
    teacher_id = get_jwt_identity()
    data = request.json

    student_id = data.get("student_id")
    subject_name = data.get("subject_name")
    comment_text = data.get("comment_text")[subject_name]

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Check if the teacher is associated with the given subject
            sql_check_subject = """
                SELECT 
                    COUNT(*) 
                FROM 
                    teachers_subjects ts
                JOIN
                    subjects sub ON ts.subject_id = sub.subject_id
                WHERE 
                    ts.teacher_id = %s AND 
                    sub.subject_name = %s;
            """
            cursor.execute(sql_check_subject, (teacher_id, subject_name))
            subject_exists = cursor.fetchone()  # [0] > 0

            if (
                subject_exists["COUNT(*)"] == 0
                and teacher_id != 16
                and teacher_id != 29
            ):
                return (
                    jsonify(
                        {
                            "error": "Teacher is not associated with the specified subject"
                        }
                    ),
                    400,
                )

            # check if comment already exists
            sql = """
                SELECT COUNT(*) FROM student_comments WHERE student_id = %s AND teacher_id = %s AND subject_name = %s;
            """
            cursor.execute(sql, (student_id, teacher_id, subject_name))
            comment_exists = cursor.fetchone()

            app.logger.info(
                f"comment_exists: {comment_exists}, student_id: {student_id}, teacher_id: {teacher_id}, subject_name: {subject_name}"
            )

            if (
                comment_exists["COUNT(*)"] == 0
            ):  # id 16, 29 is god account eco teacher and manager
                sql = """
                    INSERT INTO student_comments (comment_text, student_id, teacher_id, subject_name) VALUES (%s, %s, %s, %s);
                """
            else:
                sql = """
                    UPDATE student_comments SET comment_text = %s WHERE student_id = %s AND teacher_id = %s AND subject_name = %s;
                """

            # sql = """
            #     UPDATE student_comments SET comment_text = %s WHERE student_id = %s AND teacher_id = %s;
            # """
            cursor.execute(sql, (comment_text, student_id, teacher_id, subject_name))
            connection.commit()

        return jsonify({"msg": "Student comment added/edited successfully"}), 200

    except pymysql.MySQLError as e:
        print(f"Error: {e}")
        return jsonify({"error": "Database error"}), 500

    finally:
        connection.close()


# get student marks
@app.route("/api/student/marks", methods=["GET"])
@jwt_required()
def get_student_marks():
    student_id = request.args.get("student_id")

    connection = get_db_connection()
    marks_by_subject = {}

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT sub.subject_name, h.assignedDate, s.marks
                FROM student_homework_submission s
                JOIN homework h ON s.homework_id = h.id
                JOIN subjects sub ON h.subject_id = sub.subject_id
                WHERE s.student_id = %s
                AND h.assignedDate >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                AND h.assignedDate < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY);
            """
            cursor.execute(sql, (student_id))
            results = cursor.fetchall()
            print("result in student marks", results)

            for result in results:
                subject = result["subject_name"]
                assigned_date = result["assignedDate"]
                marks = result["marks"]
                print("assigned date value", assigned_date)

                day_name = assigned_date.strftime(
                    "%A"
                )  # e.g., 'Monday', 'Tuesday', etc.

                # Initialize the subject dictionary if not already present
                if subject not in marks_by_subject:
                    marks_by_subject[subject] = {}

                # Set the marks for the corresponding day
                marks_by_subject[subject][day_name] = marks

    finally:
        connection.close()

    return jsonify(marks_by_subject)


# admin delete
@app.route("/api/student/delete", methods=["DELETE"])
@jwt_required()
def student_delete():
    data = request.json
    student_id = data.get("student_id")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            # Check for existing parent-student links to prevent orphans
            cursor.execute(
                "SELECT COUNT(*) AS cnt FROM parents_students WHERE student_id = %s",
                (student_id,),
            )
            link_cnt = cursor.fetchone()["cnt"]
            agent_log(
                {
                    "location": "app.py:student_delete",
                    "message": "pre-delete link check",
                    "data": {"student_id": student_id, "link_count": link_cnt},
                    "sessionId": "debug-session",
                    "runId": "delete-run1",
                }
            )
            if link_cnt > 0:
                return (
                    jsonify(
                        {
                            "msg": "Cannot delete student: remove parent-student matches first",
                            "code": "STUDENT_LINKED",
                            "link_count": link_cnt,
                        }
                    ),
                    400,
                )

            # Disable foreign key checks temporarily to handle cascading deletes
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # Delete related records first (student_homework_submission doesn't have CASCADE)
            cursor.execute("DELETE FROM student_homework_submission WHERE student_id = %s", (student_id,))
            
            # Delete student (will cascade to student_classes, attendance, etc. due to ON DELETE CASCADE)
            sql = "DELETE FROM students WHERE student_id = %s"
            cursor.execute(sql, (student_id,))
            
            # Re-enable foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            connection.commit()

            if cursor.rowcount == 0:
                return jsonify({"msg": "Student with the specified ID not found"}), 404
    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()

    return jsonify({"msg": "student delete success"}), 200


# register students
@app.route("/api/student/register/manual", methods=["POST"])
@jwt_required()
def student_register_manual():
    name = request.json.get("name")
    email = request.json.get("email")
    password = request.json.get("password")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO students (name, email, password) VALUES (%s, %s, %s)"
            cursor.execute(sql, (name, email, password))
            connection.commit()
    finally:
        connection.close()

    return jsonify({"msg": "student manual register success"}), 200


# register students
@app.route("/api/student/register", methods=["POST"])
@jwt_required()
def student_register():
    data = request.json
    student_id = data.get("student_id")
    subjects = data.get("subjects")  # List of dictionaries with subject name and level
    grade = data.get("grade")
    school = data.get("school")

    if not student_id or not subjects:
        return jsonify({"error": "Student name and subjects are required"}), 400
    print("have all data ")
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # update the grade first
            cursor.execute(
                "UPDATE students set grade = %s, school = %s WHERE student_id = %s",
                (grade, school, student_id),
            )

            # delete all records with student id
            cursor.execute(
                "DELETE from student_subjects WHERE student_id = %s", (student_id)
            )

            # Prepare a list for the bulk insert operation
            insert_values = []
            for subject in subjects:
                print("subject value", subject)
                subject_name = subject.get("subject_name")
                level = subject.get("level")

                # Directly retrieve the subject_id for the existing subject
                cursor.execute(
                    "SELECT subject_id FROM subjects WHERE subject_name = %s",
                    (subject_name,),
                )
                subject_row = cursor.fetchone()

                if subject_row:
                    subject_id = subject_row["subject_id"]
                    print("subject_id", subject_id)
                    insert_values.append((student_id, subject_id, level))

            # Create a bulk insert query
            if insert_values:
                insert_query = """
                    INSERT INTO student_subjects (student_id, subject_id, level)
                    VALUES (%s, %s, %s)
                """
                # Execute the insert for all subjects in a single transaction
                cursor.executemany(insert_query, insert_values)

            connection.commit()

            # update student time slot table
        student_per_time_slot(student_id)

        return jsonify({"msg": "Student subjects added/edited successfully"}), 201

    except pymysql.MySQLError as e:
        print(f"Error: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        connection.close()


from utils.utils import get_grade_id_by_student_id


@app.route("/get_percentiles", methods=["GET"])
@jwt_required()
def get_percentiles():
    try:
        # Extract student_id from query parameters
        student_id = get_jwt_identity()
        if not student_id:
            return jsonify({"error": "student_id is required"}), 400

        grade_id = get_grade_id_by_student_id(student_id)["grade_id"]

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Step 1: Calculate total score per subject for the given student
            cursor.execute(
                """
                SELECT h.subject_id, sub.subject_name, AVG(COALESCE(s.raw_marks, 0)) AS student_total_score
                FROM student_homework_submission s
                JOIN homework h ON s.homework_id = h.id
                JOIN subjects sub ON h.subject_id = sub.subject_id
                WHERE s.student_id = %s
                AND s.graded_by IS NOT NULL
                GROUP BY h.subject_id
                """,
                (student_id,),
            )
            student_subject_scores = cursor.fetchall()

            if not student_subject_scores:
                return (
                    jsonify({"error": "No homework data found for the given student"}),
                    404,
                )

            percentiles = []

            cursor.execute(
                """
                SELECT sub.subject_id FROM student_classes AS sc
                JOIN 
                    classes c ON sc.class_id = c.class_id
                JOIN 
                    subjects sub ON c.subject_id = sub.subject_id
                WHERE sc.student_id = %s;
                """,
                (student_id,),
            )
            student_subjects = [row["subject_id"] for row in cursor.fetchall()]

            # Step 2: For each subject, calculate the percentile
            for record in student_subject_scores:
                subject_id = record["subject_id"]
                subject_name = record["subject_name"]

                if subject_id not in student_subjects:
                    continue

                student_total_score = record["student_total_score"]

                # Fetch total scores of all students for the same subject
                cursor.execute(
                    """
                    SELECT AVG(COALESCE(s.raw_marks,0)) AS total_score
                    FROM student_homework_submission s
                    JOIN homework h ON s.homework_id = h.id
                    WHERE h.subject_id = %s AND h.grade_id = %s
                    GROUP BY s.student_id
                    ORDER BY total_score DESC
                    """,
                    (subject_id, grade_id),
                )
                all_scores = [row["total_score"] for row in cursor.fetchall()]

                if not all_scores:
                    continue

                # Calculate percentile
                # rank = all_scores.index(student_total_score) + 1
                # total_students = len(all_scores)
                # percentile = ((total_students - rank) / total_students) * 100

                all_scores.sort()
                total_students = len(all_scores)

                # Count how many scored less and equal
                count_less = sum(
                    1 for score in all_scores if score < student_total_score
                )
                count_equal = sum(
                    1 for score in all_scores if score == student_total_score
                )

                # Percentile rank using midpoint rank for ties
                percentile = 100 * (count_less + 0.5 * count_equal) / total_students

                percentiles.append(
                    {"subject_name": subject_name, "percentile": round(percentile)}
                )

            return jsonify(percentiles)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()


# insert student id per time slot
def student_per_time_slot(student_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Step 1: Get the student's grade
            cursor.execute(
                "SELECT grade FROM students WHERE student_id = %s;", (student_id,)
            )
            student = cursor.fetchone()
            if not student:
                raise ValueError("Student not found")
            student_grade = student["grade"]

            if student_grade == "11":
                student_grade = 1
            elif student_grade == "12":
                student_grade = 2
            elif student_grade == "pre-IB":
                student_grade = 3
            elif student_grade == "MYP":
                student_grade = 4
            else:
                student_grade = 3

            # Step 2: Find subjects the student takes (assuming a `student_subjects` table exists)
            cursor.execute(
                """
                SELECT subject_id 
                FROM student_subjects 
                WHERE student_id = %s;
            """,
                (student_id,),
            )
            subjects = cursor.fetchall()
            subject_ids = [subject["subject_id"] for subject in subjects]

            print("\nsubject ids", subject_ids)

            if not subject_ids:
                raise ValueError("No subjects found for the student")

            # Step 3: Find time_slot_ids for these subjects and the student’s grade
            cursor.execute(
                """
                SELECT DISTINCT time_slot_id 
                FROM timetable 
                WHERE subject_id IN %s AND grade_id = %s;
            """,
                (tuple(subject_ids), student_grade),
            )
            time_slots = cursor.fetchall()
            time_slot_ids = [ts["time_slot_id"] for ts in time_slots]

            print("\ntime slot ids", time_slot_ids)

            if not time_slot_ids:
                raise ValueError(
                    "No time slots found for the student's subjects and grade"
                )

            # Step 3.5: Delete all records of student id in student_time_slot (in case the time has changed)
            cursor.execute(
                """
                    DELETE FROM student_time_slot WHERE student_id = %s
                """,
                (student_id),
            )

            # Step 4: Insert student and time_slot_id into student_time_slot
            for time_slot_id in time_slot_ids:
                cursor.execute(
                    """
                    INSERT INTO student_time_slot (student_id, time_slot_id)
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE time_slot_id = time_slot_id; -- Prevent duplicate entries
                """,
                    (student_id, time_slot_id),
                )

            # Commit the transaction
            connection.commit()

            return
    finally:
        connection.close()




# get list of children for a parent
@app.route("/api/parent/getChildList", methods=["GET"])
@jwt_required()
def get_parent_child_list():
    parent_id = get_jwt_identity()

    # current_day_id = get_current_day_id()

    # app.logger.info(f"current_day_id {current_day_id}")

    # report_available_day_ids = [3,4,5] # wed, thur, fri

    # # TODO delete after 2025 summer
    # if current_day_id not in report_available_day_ids:
    #     abort(400, description="Please check report on Wed, Thur or Fri")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT ps.student_id, s.name from parents_students as ps JOIN students as s ON ps.student_id = s.student_id WHERE parent_id = %s"
            cursor.execute(sql, (parent_id))
            parents = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(parents)


# get list of parents
@app.route("/api/parent/getList", methods=["GET"])
@jwt_required()
def get_parent_list():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT parent_id, parent_name, email, password, phone_number as phone from parents ORDER BY parent_name"
            cursor.execute(sql)
            parents = cursor.fetchall()

    finally:
        connection.close()

    return jsonify(parents)


# get list of teachers
@app.route("/api/admin/getList", methods=["GET"])
@jwt_required()
def get_admin_list():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "SELECT id, name, subject, username, teacher_type from teachers ORDER BY name"
            cursor.execute(sql)
            teachers = cursor.fetchall()

    finally:
        connection.close()

    for teacher in teachers:
        teacher["password"] = ""

    return jsonify(teachers)


# parent register only for those without kakao
@app.route("/api/parent/register", methods=["POST"])
@jwt_required()
def parent_register():
    parent_name = request.json.get("parent_name")
    email = request.json.get("email")
    password = request.json.get("password")
    phone = request.json.get("phone")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO parents (parent_name, email, password, phone_number) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (parent_name, email, password, phone))
            connection.commit()
    finally:
        connection.close()

    return jsonify({"msg": "parent register success"}), 200


# admin register
@app.route("/api/admin/register", methods=["POST"])
@jwt_required()
def admin_register():
    name = request.json.get("name")
    username = request.json.get("username")
    password = request.json.get("password")
    subject = request.json.get("subject")
    teacher_type = request.json.get("teacher_type")

    hashed_password = generate_password_hash(password)

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO teachers (name, username, password, subject, teacher_type) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(
                sql, (name, username, hashed_password, subject, teacher_type)
            )
            connection.commit()
    finally:
        connection.close()

    return jsonify({"msg": "admin register success"}), 200


# parent edit
@app.route("/api/parent/edit", methods=["PUT"])
@jwt_required()
def parent_edit():
    parent_id = request.json.get("parent_id")
    parent_name = request.json.get("parent_name")
    email = request.json.get("email")
    password = request.json.get("password")
    phone = request.json.get("phone")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "UPDATE parents SET parent_name = %s, email = %s, password = %s, phone_number = %s WHERE parent_id = %s"
            cursor.execute(sql, (parent_name, email, password, phone, parent_id))
            connection.commit()

            if cursor.rowcount == 0:
                return jsonify({"msg": "Parent with the specified ID not found"}), 404
    finally:
        connection.close()

    return jsonify({"msg": "parent edit success"}), 200


# admin edit
@app.route("/api/admin/edit", methods=["PUT"])
@jwt_required()
def admin_edit():
    admin_id = request.json.get("id")
    name = request.json.get("name")
    username = request.json.get("username")
    password = request.json.get("password")
    subject = request.json.get("subject")
    teacher_type = request.json.get("teacher_type")

    hashed_password = generate_password_hash(password)

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "UPDATE teachers SET name = %s, username = %s, password = %s, subject = %s, teacher_type = %s WHERE id = %s"
            cursor.execute(
                sql, (name, username, hashed_password, subject, teacher_type, admin_id)
            )
            connection.commit()

            if cursor.rowcount == 0:
                return jsonify({"msg": "Teacher with the specified ID not found"}), 404
    finally:
        connection.close()

    return jsonify({"msg": "admin edit success"}), 200


# student homework submission delete
@app.route("/api/homework-submission/delete", methods=["DELETE"])
@cross_origin()
@jwt_required()
def homework_submission_delete():
    if not request.json:
        return jsonify({"msg": "Request body is required"}), 400
    
    submission_id = request.json.get("submission_id")
    if not submission_id:
        return jsonify({"msg": "submission_id is required"}), 400

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM student_homework_submission WHERE id = %s"
            cursor.execute(sql, (submission_id))
            connection.commit()

            if cursor.rowcount == 0:
                return (
                    jsonify({"msg": "Submission with the specified ID not found"}),
                    404,
                )
    finally:
        connection.close()

    return jsonify({"msg": "submission delete success"}), 200


# parent delete
@app.route("/api/parent/delete", methods=["DELETE"])
@jwt_required()
def parent_delete():
    parent_id = request.json.get("parent_id")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM parents WHERE parent_id = %s"
            cursor.execute(sql, (parent_id))
            connection.commit()

            if cursor.rowcount == 0:
                return jsonify({"msg": "Parent with the specified ID not found"}), 404
    finally:
        connection.close()

    return jsonify({"msg": "parent delete success"}), 200


# admin delete
@app.route("/api/admin/delete", methods=["DELETE"])
@jwt_required()
def admin_delete():
    print("request for admin delete")
    admin_id = request.json.get("id")

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM teachers WHERE id = %s"
            cursor.execute(sql, (admin_id))
            connection.commit()

            if cursor.rowcount == 0:
                return jsonify({"msg": "Teacher with the specified ID not found"}), 404
    finally:
        connection.close()

    return jsonify({"msg": "admin delete success"}), 200


# manual student login
@app.route("/api/student-login", methods=["POST"])
def student_login():
    email = request.json.get("email")
    password = request.json.get("password")

    # check if student already exists
    student = get_student_by_email(email)

    default_password = "2550"

    # Validate parent and password
    if not student or password != default_password:
        return (
            jsonify(
                {"msg": "Invalid username or password", "code": "INVALID_CREDENTIALS"}
            ),
            401,
        )

    # Ensure name is not None (verify-token requires it for students)
    student_name = student["name"] if student.get("name") else ""
    
    additional_claims = {
        "name": student_name,
        "role": "student",
        "grade": student["grade"],
    }

    jwt_access_token = create_access_token(
        identity=student["student_id"], additional_claims=additional_claims
    )
    jwt_refresh_token = create_refresh_token(
        identity=student["student_id"], additional_claims=additional_claims
    )

    response = jsonify({"msg": "Created jwt token"})

    set_access_cookies(response, jwt_access_token)
    set_refresh_cookies(response, jwt_refresh_token)

    return response, 200


# parent login
@app.route("/api/parent-login", methods=["POST"])
def parent_login():
    email = request.json.get("email")
    password = request.json.get("password")

    # check if teacher already exists
    parent = get_parent_by_email(email)

    print("parent value", parent)
    # Validate parent and password
    if not parent or parent["password"] != password:
        return (
            jsonify(
                {"msg": "Invalid username or password", "code": "INVALID_CREDENTIALS"}
            ),
            401,
        )

    additional_claims = {
        "name": parent["parent_name"],
        "role": "parent",
    }

    jwt_access_token = create_access_token(
        identity=parent["parent_id"], additional_claims=additional_claims
    )
    jwt_refresh_token = create_refresh_token(
        identity=parent["parent_id"], additional_claims=additional_claims
    )

    response = jsonify({"msg": "Created jwt token"})

    set_access_cookies(response, jwt_access_token)
    set_refresh_cookies(response, jwt_refresh_token)

    return response, 200


# admin login
@app.route("/api/admin-login", methods=["POST"])
def admin_login():
    username = request.json.get("username")
    password = request.json.get("password")

    agent_log(
        {
            "location": "app.py:admin_login",
            "message": "admin_login called",
            "data": {"username": username},
            "sessionId": "debug-session",
            "runId": "login-run1",
        }
    )

    # check if teacher already exists
    teacher = get_teacher_by_username(username)

    print("teacher value:", teacher)
    agent_log(
        {
            "location": "app.py:admin_login",
            "message": "teacher lookup",
            "data": {"username": username, "found": bool(teacher)},
            "sessionId": "debug-session",
            "runId": "login-run1",
        }
    )

    # Validate teacher and password
    if not teacher or teacher["password"] != password:
        agent_log(
            {
                "location": "app.py:admin_login",
                "message": "invalid credentials",
                "data": {
                    "username": username,
                    "found": bool(teacher),
                    "stored_password_sample": teacher.get("password") if teacher else None,
                },
                "sessionId": "debug-session",
                "runId": "login-run1",
            }
        )
        return (
            jsonify(
                {"msg": "Invalid username or password", "code": "INVALID_CREDENTIALS"}
            ),
            401,
        )

    additional_claims = {
        "name": teacher["name"],
        "role": "admin",
    }

    jwt_access_token = create_access_token(
        identity=teacher["id"], additional_claims=additional_claims
    )
    jwt_refresh_token = create_refresh_token(
        identity=teacher["id"], additional_claims=additional_claims
    )

    agent_log(
        {
            "location": "app.py:admin_login",
            "message": "admin login success",
            "data": {"username": username, "teacher_id": teacher["id"]},
            "sessionId": "debug-session",
            "runId": "login-run1",
        }
    )

    response = jsonify({"msg": "Created jwt token"})

    set_access_cookies(response, jwt_access_token)
    set_refresh_cookies(response, jwt_refresh_token)

    return response, 200


# kakaotalk oauth login
@app.route("/oauth/kakao", methods=["POST"])
@cross_origin()
def kakao_auth():
    data = request.json
    code = data.get("code")

    print("inside oauth kakao")
    # sleep(10)
    oauth = Oauth()
    kakao_token_info, kakao_token_status_code = oauth.auth(code)  # Get Kakao Token Info
    # print("kakao token info",kakao_token_info)

    if kakao_token_status_code != 200:
        return jsonify({"error": kakao_token_info}), kakao_token_status_code
    print("Access token value:", kakao_token_info["access_token"])

    # Get Kakao User Info
    user, user_status_code = oauth.userinfo(
        f"Bearer {kakao_token_info['access_token']}"
    )
    if user_status_code != 200:
        return jsonify({"error": user}), user_status_code

    student_name, student_id, grade = check_user_exists(user["id"])
    # print("user info", user)

    # if new user
    if student_id is None:
        student_id = insert_new_user(
            user["id"],
            user["kakao_account"]["profile"]["thumbnail_image_url"],
            kakao_token_info["access_token"],
            kakao_token_info["refresh_token"],
        )

    user = UserData(user)  # create userdata object

    # create jwt access/refresh token
    additional_claims = {
        "kakao_access_token": kakao_token_info["access_token"],
        "kakao_refresh_token": kakao_token_info["refresh_token"],
        "name": student_name,
        "role": "student",
        "grade": grade,
    }

    jwt_access_token = create_access_token(
        identity=student_id, additional_claims=additional_claims
    )
    jwt_refresh_token = create_refresh_token(
        identity=student_id, additional_claims=additional_claims
    )

    # user_info = oauth.userinfo()
    # Return the token data or handle it as needed
    # return jsonify(kakao_token_info)
    response = jsonify(
        {
            "jwt_access_token": jwt_access_token,
            "jwt_refresh_token": jwt_refresh_token,
            "name": student_name,
        }
    )
    set_access_cookies(response, jwt_access_token)
    set_refresh_cookies(response, jwt_refresh_token)

    return response, 200


# zoom oauth login
@app.route("/zoom/oauth/url")
def oauth_url_api():
    print("inside ouath zoom")
    # return redirect(
    #     f"https://zoom.us/oauth/authorize?response_type=code&client_id=h_ImvzruQ8OTrntkG3gYQA&redirect_uri=https://dev.sehanib.kr/oauth/zoom"
    # )

    return redirect(
        f"https://zoom.us/oauth/authorize?response_type=code&client_id=zmBmqzTWi3hfm77oblxA&redirect_uri=https://dev.sehanibp.kr/oauth/zoom"
    )


def update_teacher_zoom_token(
    zoom_access_token, zoom_refresh_token, zoom_expires_in, teacher_id
):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = "UPDATE teachers SET zoom_access_token = %s, zoom_refresh_token = %s, zoom_expires_in = %s WHERE id = %s"
            cursor.execute(
                sql,
                (zoom_access_token, zoom_refresh_token, zoom_expires_in, teacher_id),
            )
            connection.commit()

            if cursor.rowcount == 0:
                return False
    finally:
        connection.close()

    return True


def refresh_zoom_access_token(teacher_id, zoom_refresh_token):
    """Refresh the Zoom access token using the refresh token."""

    print("currently refreshing for", teacher_id)
    credentials = f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")

    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {
        "grant_type": "refresh_token",
        "refresh_token": zoom_refresh_token,
    }

    response = requests.post("https://zoom.us/oauth/token", headers=headers, data=data)

    if response.status_code == 200:
        token_data = response.json()

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in")

        print("zoom token data for refersh\n", token_data)
        print("expires in before", expires_in)

        current_time = datetime.now()  # datetime.now() gets server's current time
        print("current_time", current_time)
        expires_in = current_time + timedelta(seconds=expires_in)
        print("expires_in", expires_in)

        update_teacher_zoom_token(access_token, refresh_token, expires_in, teacher_id)

        return token_data  # Contains access_token, refresh_token, expires_in, etc.
    else:
        print("response failed with problem", response.json())
        return None


@app.route("/oauth/zoom", methods=["POST"])
@jwt_required()
def oauth_api():

    teacher_id = get_jwt_identity()

    print("teacher id", teacher_id)

    tokens = {"access_token": None, "refresh_token": None, "expires_in": None}

    code = request.json.get("code")

    credentials = "zmBmqzTWi3hfm77oblxA:CgumBylyr6Jp7ycPJqHzTShs25429cHs"
    encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    #    print("encode crendentials",encoded_credentials)
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {
        "code": f"{code}",
        "grant_type": "authorization_code",
        "redirect_uri": "https://dev.sehanibp.kr/oauth/zoom",
    }
    print("headers and data", headers, data)
    response = requests.post("https://zoom.us/oauth/token", headers=headers, data=data)

    print("response for zoom access token", response.json())

    if response.status_code == 200:
        data = response.json()
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        expires_in = data.get("expires_in")

        current_time = datetime.now()  # datetime.now() gets server's current time
        print("current_time", current_time)
        expires_in = current_time + timedelta(seconds=expires_in)
        print("expires_in", expires_in)

        access_token = response.json().get("access_token")
        tokens["access_token"] = access_token
        tokens["refresh_token"] = response.json().get("refresh_token")
        tokens["expires_in"] = expires_in

        print("expires_in timestamp", expires_in)

        result = update_teacher_zoom_token(
            tokens["access_token"],
            tokens["refresh_token"],
            tokens["expires_in"],
            teacher_id,
        )

        if result:
            return jsonify({"msg": "teacher zoom setting complete"}), 200
        else:
            return jsonify({"error": "teacher zoom setting error"}), 404

    #     user_id = "koysr20@gmail.com"

    #     # URL to fetch the recordings
    #     recordings_url = f"https://api.zoom.us/v2/users/{user_id}/recordings"

    #     # Parameters for the GET request
    #     params = {
    #         'from': '2024-07-15',
    #         'to': '2024-08-15'
    #     }

    #     # Headers with the access token
    #     headers = {
    #         'Authorization': f'Bearer {access_token}'
    #     }

    #     # Make the GET request to fetch recordings
    #     response = requests.get(recordings_url, headers=headers, params=params)
    #     print('reponse for recording', response.json())
    #     if response.status_code == 200:
    #         #latest_recording = response.json()['recording_files'][0]
    #         #print("Latest Recording:", latest_recording)
    #         #print("Info:",response.json())
    #         recording_files = response.json()['meetings'][0]['recording_files'][0]
    # #        print(recording_files)
    #         latest_recording = recording_files['download_url']
    #         latest_recording_date = localize_time(recording_files['recording_start'])

    #         response = requests.post('https://www.sehanib.kr/api/storeZoomVideo',json={'link':latest_recording})
    #         print('final response_________________________________________\n', response)

    # #        print("Latest Recording:", latest_recording)
    # #        print("Recording Date:",latest_recording_date)
    #     else:
    #         print("Failed to fetch recordings:", response.text)

    return "hi"


def get_current_time():
    KST = timezone("Asia/Seoul")

    current_time = datetime.now().astimezone(KST)

    return current_time


def localize_time(iso_datetime_str):
    datetime_obj = datetime.fromisoformat(iso_datetime_str.replace("Z", "+00:00"))

    KST = timezone("Asia/Seoul")

    local_time = datetime_obj.astimezone(KST)

    return local_time


# Get current time in KST (Asia/Seoul)
def get_current_time_kst():
    kst = pytz.timezone("Asia/Seoul")
    return datetime.now(kst)


# Get parent phone number using student id and send alimtalk
def handle_alim_talk_message(student_name, student_id):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT p.phone_number FROM parents as p
                JOIN parents_students as ps ON
                p.parent_id = ps.parent_id
                WHERE ps.student_id = %s
            """

            cursor.execute(sql, (student_id))
            result = cursor.fetchall()

            print("result in alim talk", result)

            if not result:
                print("no parent matched for student id", student_id)
                return

            for row in result:
                phone_number = row["phone_number"]

                if not phone_number:
                    print("No phone number for parent of student_id", student_id)
                    return

                send_attendance_message(student_name, phone_number)

    finally:
        connection.close()

    return


# Function to check attendance 5 minutes after class starts
# Need to change level to level_id
def check_attendance_missing(start_time, grade, subject_name, level_id, mode_id):
    # Check SEHAN_END_DATE - do not check attendance or send messages on or after the end date
    from utils.date_validator import is_current_date_after_sehan_end
    if is_current_date_after_sehan_end():
        app.logger.info(
            f"Skipping check_attendance_missing for {subject_name} - current date is on or after SEHAN_END_DATE"
        )
        return
    
    app.logger.info(
        f"check_attendance_missing called for {subject_name} at {start_time}, grade {grade}, level {level_id}, mode {mode_id}"
    )
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            now_kst = get_current_time_kst()
            current_time = now_kst.time()

            # This function is scheduled for start_time + 10 minutes (KST)
            check_time = (
                datetime.combine(now_kst.date(), start_time) + timedelta(minutes=10)
            ).time()

            app.logger.info(
                f"check_attendance_missing = Current time: {current_time}, Check time: {check_time}, Start time: {start_time}"
            )

            # Allow a 1-minute window (9-11 minutes after start)
            earliest = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=9)).time()
            latest = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=11)).time()
            if current_time < earliest or current_time > latest:
                app.logger.warning(
                    f"check_attendance_missing called outside window. Current: {current_time}, "
                    f"Window: {earliest} - {latest}"
                )
                return  # Skip if outside expected window

            # Query to fetch students in the grade who are not in attendance
            cursor.execute(
                """
                SELECT 
                    s.student_id, 
                    s.name 
                FROM 
                    students s
                LEFT JOIN 
                    (SELECT *
                        FROM attendance
                        WHERE attendance_id = (
                            SELECT MAX(attendance_id)
                            FROM attendance a2
                            WHERE a2.student_id = attendance.student_id
                            AND a2.subject_name = %s
                            AND attendance_date = CURDATE()
                        )              
                    )
                    a 
                ON 
                    s.student_id = a.student_id 
                    AND a.attendance_date = CURDATE() 
                    AND a.subject_name = %s
                JOIN student_classes sc ON s.student_id = sc.student_id
                JOIN classes c ON sc.class_id = c.class_id
                JOIN subjects sub ON c.subject_id = sub.subject_id
                WHERE 
                    s.grade = %s
                    AND sub.subject_name = %s
                    AND (a.status IS NULL OR a.status = 'reset')
                    AND (sc.level_id = %s OR %s = 3) -- student's level id == class level id or class level id == 3 
                    AND (c.mode_id = %s)
                    ;

            """,
                (
                    subject_name,
                    subject_name,
                    grade,
                    subject_name,
                    level_id,
                    level_id,
                    mode_id,
                ),
            )
            missing_students = cursor.fetchall()

            # 알림톡
            for student in missing_students:
                app.logger.info(
                    f"Student {student['name']} (ID: {student['student_id']}) not in the class for name {subject_name}."
                )
                handle_alim_talk_message(student["name"], student["student_id"])
                # send_attendance_message(student['name'], "821055388689")
    finally:
        conn.close()


def get_adjusted_date(start_time, day_name):
    # print("time_slots", time_slots)
    # between 11:30PM and 3AM, 30 minutes after for absent becomes next day
    late_night_start = dt_time(23, 30)
    late_night_end = dt_time(3, 0)
    # List of days for shifting logic
    days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]

    # Shift to the next day if time is between 11:30 PM and 3:00 AM
    absent_date = ""
    current_datetime_object = get_current_time_kst()

    app.logger.info(f"current datetime object {current_datetime_object}")

    if (start_time >= late_night_start) or (start_time < late_night_end):
        try:
            original_index = days.index(day_name)
            shifted_index = (original_index + 1) % 7
            day_name = days[shifted_index]

            # previous date
            previous_datetime_object = current_datetime_object - timedelta(days=1)
            previous_date = previous_datetime_object.date()

            absent_date = previous_date

        except ValueError:
            # Handle unexpected day_name
            app.logger.warning(f"Unexpected day_name: {day_name}")
            return "9999-99-99"
    else:
        absent_date = current_datetime_object.date()

    return absent_date


# Function to mark students absent 30 minutes after class starts
def mark_students_absent(
    start_time, grade, subject_name, level_id, mode_id, timetable_id, day_name
):
    # Check SEHAN_END_DATE - do not mark students absent on or after the end date
    from utils.date_validator import is_current_date_after_sehan_end
    if is_current_date_after_sehan_end():
        app.logger.info(
            f"Skipping mark_students_absent for {subject_name} - current date is on or after SEHAN_END_DATE"
        )
        return
    
    absent_date = get_adjusted_date(start_time, day_name)
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            now_kst = get_current_time_kst()
            current_time = now_kst.time()
            check_time = (
                datetime.combine(now_kst.date(), start_time) + timedelta(minutes=30)
            ).time()

            app.logger.info(
                f"mark_students_absent = Current time: {current_time}, Check time: {check_time}, Start time: {start_time}, absent_date: {absent_date}"
            )

            if current_time < check_time:
                return  # Skip if the check time hasn't arrived

            # Query to fetch students in the grade who are not marked in attendance
            cursor.execute(
                """
                SELECT 
                    s.student_id, 
                    s.name 
                FROM 
                    students s
                LEFT JOIN 
                    (SELECT *
                        FROM attendance
                        WHERE attendance_id = (
                            SELECT MAX(attendance_id)
                            FROM attendance a2
                            WHERE a2.student_id = attendance.student_id
                            AND a2.subject_name = %s
                            AND attendance_date = %s
                        )              
                    )
                    a 
                ON 
                    s.student_id = a.student_id 
                    AND a.attendance_date = %s 
                    AND a.subject_name = %s
                JOIN student_classes sc ON s.student_id = sc.student_id
                JOIN classes c ON sc.class_id = c.class_id
                JOIN subjects sub ON c.subject_id = sub.subject_id
                WHERE 
                    s.grade = %s
                    AND sub.subject_name = %s
                    AND (a.status IS NULL OR a.status = 'reset')
                    AND (sc.level_id = %s OR %s = 3) -- student's level id == class level id or class level id == 3 
                    AND (c.mode_id = %s)
                    ;

            """,
                (
                    subject_name,
                    absent_date,
                    absent_date,
                    subject_name,
                    grade,
                    subject_name,
                    level_id,
                    level_id,
                    mode_id,
                ),
            )
            absent_students = cursor.fetchall()

            app.logger.info(f"absent students for {subject_name}:{absent_students}")

            # Get class context from timetable_id for denormalized fields
            class_context = None
            valid_timetable_id = None
            if timetable_id:
                # First, check if the timetable entry exists
                cursor.execute(
                    """
                    SELECT timetable_id FROM timetable WHERE timetable_id = %s
                    """,
                    (timetable_id,),
                )
                timetable_exists = cursor.fetchone()
                
                if timetable_exists:
                    # Timetable exists, get its basic info first
                    cursor.execute(
                        """
                        SELECT class_id, time_slot_id, day_id, teacher_id
                        FROM timetable
                        WHERE timetable_id = %s
                        """,
                        (timetable_id,),
                    )
                    timetable_info = cursor.fetchone()
                    
                    if timetable_info:
                        # Check if class exists
                        cursor.execute(
                            "SELECT class_id FROM classes WHERE class_id = %s",
                            (timetable_info["class_id"],),
                        )
                        class_exists = cursor.fetchone()
                        
                        # Check if time_slot exists
                        cursor.execute(
                            "SELECT time_slot_id FROM time_slots WHERE time_slot_id = %s",
                            (timetable_info["time_slot_id"],),
                        )
                        time_slot_exists = cursor.fetchone()
                        
                        if not class_exists:
                            app.logger.error(
                                f"timetable_id {timetable_id} references non-existent class_id {timetable_info['class_id']}"
                            )
                        if not time_slot_exists:
                            app.logger.error(
                                f"timetable_id {timetable_id} references non-existent time_slot_id {timetable_info['time_slot_id']}"
                            )
                    
                    # Try to get full class context with JOINs
                    cursor.execute(
                        """
                        SELECT 
                            t.class_id,
                            t.day_id,
                            t.time_slot_id,
                            t.teacher_id,
                            c.subject_id,
                            c.level_id,
                            c.mode_id,
                            c.grade_id,
                            ts.start_time,
                            ts.end_time
                        FROM timetable t
                        JOIN classes c ON t.class_id = c.class_id
                        JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
                        WHERE t.timetable_id = %s
                        """,
                        (timetable_id,),
                    )
                    class_context = cursor.fetchone()
                    
                    if class_context:
                        # Full context available, use timetable_id
                        valid_timetable_id = timetable_id
                    else:
                        # Timetable exists but JOINs failed (missing class or time_slot)
                        # This indicates data integrity issue, but we'll still use the timetable_id
                        app.logger.warning(
                            f"timetable_id {timetable_id} exists but class/time_slot context not found. "
                            f"Timetable info: {timetable_info}. Using timetable_id without denormalized fields."
                        )
                        valid_timetable_id = timetable_id
                else:
                    # Timetable doesn't exist at all
                    app.logger.warning(
                        f"timetable_id {timetable_id} not found in database, using NULL for attendance records"
                    )

            # Mark these students as absent with denormalized fields
            for student in absent_students:
                if class_context:
                    cursor.execute(
                        """
                        INSERT INTO attendance (
                            student_id, subject_name, attendance_date, status, timetable_id,
                            class_id, subject_id, level_id, mode_id, grade_id,
                            day_id, time_slot_id, start_time, end_time, teacher_id
                        )
                        VALUES (%s, %s, %s, 'absent', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                        (
                            student["student_id"],
                            subject_name,
                            absent_date,
                            valid_timetable_id,
                            class_context["class_id"],
                            class_context["subject_id"],
                            class_context["level_id"],
                            class_context["mode_id"],
                            class_context["grade_id"],
                            class_context["day_id"],
                            class_context["time_slot_id"],
                            class_context["start_time"],
                            class_context["end_time"],
                            class_context["teacher_id"],
                        ),
                    )
                else:
                    # Fallback: insert without denormalized fields
                    # Use NULL for timetable_id if it doesn't exist in the database
                    cursor.execute(
                        """
                        INSERT INTO attendance (student_id, subject_name, attendance_date, status, timetable_id)
                        VALUES (%s, %s, %s, 'absent', %s)
                    """,
                        (student["student_id"], subject_name, absent_date, valid_timetable_id),
                    )
                app.logger.info(
                    f"Student {student['student_id']} marked as absent for {subject_name}."
                )
            conn.commit()
    finally:
        conn.close()


# Schedule jobs
def schedule_attendance_checks():
    seoul_tz = pytz.timezone("Asia/Seoul")
    # Convert SEHAN_START_DATE to a datetime object
    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
    end_date = seoul_tz.localize(datetime.strptime(SEHAN_END_DATE, "%Y-%m-%d"))

    end_date = end_date + timedelta(days=1)
    app.logger.info(f"Scheduling attendance checks from {start_date} to {end_date}")
    app.logger.info(f"Current time: {get_current_time_kst()}")
    # Check if the current date is after or on the target start date
    if get_current_time_kst() < start_date or get_current_time_kst() > end_date:
        return

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Fetch class times and their grades
            cursor.execute(
                """
                SELECT ts.start_time, c.level_id, c.mode_id, g.grade, s.subject_name, d.day_name, t.timetable_id
                FROM time_slots ts
                JOIN timetable t ON ts.time_slot_id = t.time_slot_id
                JOIN classes c ON t.class_id = c.class_id
                JOIN subjects s ON c.subject_id = s.subject_id
                JOIN days d ON t.day_id = d.day_id
                JOIN grades g ON c.grade_id = g.grade_id
                JOIN levels l on c.level_id = l.id
            """
            )
            time_slots = cursor.fetchall()

            now_kst = get_current_time_kst()
            current_day_name = now_kst.strftime("%A")

            for slot in time_slots:
                start_time = datetime.strptime(
                    str(slot["start_time"]), "%H:%M:%S"
                ).time()
                grade = slot["grade"]
                subject_name = slot["subject_name"]
                day_name = slot["day_name"]
                level_id = slot["level_id"]
                mode_id = slot["mode_id"]
                timetable_id = slot["timetable_id"]
                # print("level", level)

                # Map days to scheduling methods
                day_scheduler = {
                    "Monday": lambda: schedule.every().monday,
                    "Tuesday": lambda: schedule.every().tuesday,
                    "Wednesday": lambda: schedule.every().wednesday,
                    "Thursday": lambda: schedule.every().thursday,
                    "Friday": lambda: schedule.every().friday,
                    "Saturday": lambda: schedule.every().saturday,
                    # "Sunday": lambda: schedule.every().sunday,  # just for testing...
                }

                app.logger.info(
                    f"scheduling info: {day_name}, {start_time}, {subject_name}, {level_id}"
                )

                # Skip scheduling for weekends or unknown days
                if day_name not in day_scheduler:
                    continue

                # Schedule attendance code 5 minutes before start of class (local KST time)
                code_dt = datetime.combine(datetime.today(), start_time) - timedelta(
                    minutes=5
                )
                code_time = code_dt.strftime("%H:%M")
                day_scheduler[day_name]().at(code_time).do(generateRandomNumber)
                app.logger.debug(
                    f"Scheduled attendance code for {day_name} at {code_time} "
                    f"(5 min before {start_time} KST)"
                )

                # Schedule checks 10 minutes after start (local KST time)
                check_dt = datetime.combine(datetime.today(), start_time) + timedelta(
                    minutes=10
                )
                day_scheduler[day_name]().at(check_dt.strftime("%H:%M")).do(
                    check_attendance_missing,
                    start_time,
                    grade,
                    subject_name,
                    level_id,
                    mode_id,
                )

                # Schedule absences 30 minutes after start (local KST time)
                absent_dt = datetime.combine(datetime.today(), start_time) + timedelta(
                    minutes=30
                )
                day_scheduler[day_name]().at(absent_dt.strftime("%H:%M")).do(
                    mark_students_absent,
                    start_time,
                    grade,
                    subject_name,
                    level_id,
                    mode_id,
                    timetable_id,
                    day_name,
                )

                # Catch-up: if scheduler starts mid-day, run missed windows for today's classes
                if day_name == current_day_name:
                    now_time = now_kst.time()

                    # If we are between start_time -5 and start_time, ensure code is generated
                    if code_dt.time() <= now_time < start_time:
                        app.logger.info(
                            f"Catch-up: generating attendance code for {subject_name} scheduled at {start_time} (current {now_time})"
                        )
                        generateRandomNumber()

                    # If we are between start_time +10 and start_time +11, run missing check
                    check_window_start = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=10)).time()
                    check_window_end = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=11)).time()
                    if check_window_start <= now_time <= check_window_end:
                        app.logger.info(
                            f"Catch-up: running check_attendance_missing for {subject_name} (current {now_time})"
                        )
                        check_attendance_missing(start_time, grade, subject_name, level_id, mode_id)

                    # If we are between start_time +30 and start_time +35, run absent marking
                    absent_window_start = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=30)).time()
                    absent_window_end = (datetime.combine(now_kst.date(), start_time) + timedelta(minutes=35)).time()
                    if absent_window_start <= now_time <= absent_window_end:
                        app.logger.info(
                            f"Catch-up: running mark_students_absent for {subject_name} (current {now_time})"
                        )
                        mark_students_absent(
                            start_time, grade, subject_name, level_id, mode_id, timetable_id, day_name
                        )

                    # If we already passed the check window but before absent window, run the missing check once
                    if now_time > check_window_end and now_time < absent_window_start:
                        app.logger.info(
                            f"Catch-up (late window): running check_attendance_missing for {subject_name} (current {now_time})"
                        )
                        check_attendance_missing(start_time, grade, subject_name, level_id, mode_id)

                    # If we already passed the absent window, ensure absents are marked once
                    if now_time > absent_window_end:
                        app.logger.info(
                            f"Catch-up (absent window passed): running mark_students_absent for {subject_name} (current {now_time})"
                        )
                        mark_students_absent(
                            start_time, grade, subject_name, level_id, mode_id, timetable_id, day_name
                        )

    finally:
        conn.close()


# schedule.every().minute.do(generateRandomNumber)


# def handle_zoom_recordings(day_id):

#     connection = get_db_connection()

#     try:
#         with connection.cursor() as cursor:
#             sql = """
#                 SELECT tts.teacher_id, tts.grade_id, tts.start_time, s.subject_name, t.name, t.zoom_user_id, t.zoom_expires_in, t.zoom_refresh_token, t.zoom_access_token
#                 FROM teacher_time_slots tts
#                 JOIN subjects s
#                 ON tts.subject_id = s.subject_id
#                 JOIN teachers t
#                 ON tts.teacher_id = t.id
#                 WHERE day_id = %s
#             """
#             cursor.execute(sql, (day_id))
#             result = cursor.fetchall()

#             if not result:
#                 print("No teacher time slots")
#                 return

#     finally:
#         connection.close()
#     for element in result:
#         teacher_id = element["teacher_id"]
#         zoom_user_id = element["zoom_user_id"]
#         teacher_name = element["name"]
#         grade_id = element["grade_id"]
#         teacher_recording_start = element["start_time"]
#         print(
#             "teacher_recording_start value name", teacher_recording_start, teacher_name
#         )

#         if grade_id == 1:
#             grade = "11"
#         elif grade_id == 2:
#             grade = "12"
#         else:
#             grade = "pre-IB"

#         subject_name = element["subject_name"]
#         access_token = element["zoom_access_token"]
#         refresh_token = element["zoom_refresh_token"]
#         expires_in = element["zoom_expires_in"]

#         if not access_token:
#             continue

#         print("\nteacher name grade subjectname", teacher_name, grade, subject_name)

#         current_time = datetime.now()  # datetime.now() gets server's current time

#         print("current_time and expires in", type(current_time), type(expires_in))

#         # if access token expired
#         if current_time > expires_in:
#             data = refresh_zoom_access_token(teacher_id, refresh_token)

#             if not data:
#                 continue

#             access_token = data.get("access_token")
#             refresh_token = data.get("refresh_token")
#             expires_in = data.get("expires_in")
#         else:
#             print("No need to refresh token")

#         # URL to fetch the recordings
#         recordings_url = f"https://api.zoom.us/v2/users/{zoom_user_id}/recordings"

#         print("recording url", recordings_url)

#         # Get the current date and time
#         current_datetime = datetime.now() - timedelta(days=1)

#         # Subtract one day
#         previous_day = current_datetime  # - timedelta(days=1)

#         # Format it as YYYY-MM-DD
#         formatted_date = previous_day.strftime("%Y-%m-%d")

#         # Parameters for the GET request
#         params = {"from": formatted_date, "to": formatted_date}

#         # Headers with the access token
#         headers = {"Authorization": f"Bearer {access_token}"}

#         # Make the GET request to fetch recordings
#         response = requests.get(recordings_url, headers=headers, params=params)
#         print("reponse for recording", response.json())
#         if response.status_code == 200:
#             # latest_recording = response.json()['recording_files'][0]
#             # print("Latest Recording:", latest_recording)
#             print("Zoom recording info", response.json())
#             meetings = response.json()["meetings"]
#             for meeting in meetings:
#                 for recording in meeting["recording_files"]:
#                     # need to set conditions TODO finish i think
#                     download_url = recording["download_url"]
#                     recording_type = recording["recording_type"]
#                     recording_start = recording["recording_start"]
#                     file_size = recording["file_size"]
#                     file_extension = recording["file_extension"].lower()

#                     recording_datetime_utc = datetime.strptime(
#                         recording_start, "%Y-%m-%dT%H:%M:%SZ"
#                     )
#                     recording_datetime_utc = recording_datetime_utc.replace(
#                         tzinfo=timezone("UTC")
#                     )
#                     recording_datetime_seoul = recording_datetime_utc.astimezone(
#                         timezone("Asia/Seoul")
#                     )
#                     # Parse the recording_start into a datetime object
#                     recording_time_seoul = recording_datetime_seoul.time()

#                     recording_dt = datetime.combine(
#                         recording_datetime_seoul.date(), recording_time_seoul
#                     )
#                     teacher_dt = (
#                         datetime.combine(
#                             recording_datetime_seoul.date(), datetime.min.time()
#                         )
#                         + teacher_recording_start
#                     )

#                     time_window_start = teacher_dt - timedelta(minutes=10)
#                     time_window_end = teacher_dt + timedelta(minutes=10)

#                     print("recording dt teacher dt", recording_dt, teacher_dt)
#                     print("between  ", time_window_start, time_window_end)

#                     if (
#                         recording_type != "audio_only"
#                         and (time_window_start <= recording_dt <= time_window_end)
#                         and file_size > 100000
#                     ):
#                         print("download url", download_url)
#                         file_name = f"{current_datetime.strftime("%Y-%m-%d")}_{grade}_{subject_name}_{teacher_name}.{file_extension}"
#                         print("file name", file_name)
#                         storeZoomVideo(file_name, download_url)
#         #         recording_files = response.json()['meetings'][0]['recording_files'][0]
#         # #        print(recording_files)
#         #         latest_recording = recording_files['download_url']
#         #         latest_recording_date = localize_time(recording_files['recording_start'])

#         #         response = requests.post('https://www.sehanib.kr/api/storeZoomVideo',json={'link':latest_recording})
#         #         print('final response_________________________________________\n', response)

#         #        print("Latest Recording:", latest_recording)
#         #        print("Recording Date:",latest_recording_date)
#         else:
#             print("Failed to fetch recordings:", response.text)


# def schedule_zoom_video_upload():
#     connection = get_db_connection()

#     result = []

#     try:
#         with connection.cursor() as cursor:
#             sql = """
#                 SELECT DISTINCT day_id from timetable
#             """

#             cursor.execute(sql)
#             result = cursor.fetchall()

#     finally:
#         connection.close()

#     # Map days to scheduling methods
#     day_scheduler = {
#         "1": lambda: schedule.every().tuesday,
#         "2": lambda: schedule.every().wednesday,
#         "3": lambda: schedule.every().thursday,
#         "4": lambda: schedule.every().friday,
#         "5": lambda: schedule.every().saturday,
#     }

#     for row in result:
#         day_id = str(row["day_id"])

#         seoul_tz = pytz.timezone("Asia/Seoul")
#         # Convert SEHAN_START_DATE to a datetime object
#         start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
#         end_date = seoul_tz.localize(datetime.strptime(SEHAN_END_DATE, "%Y-%m-%d"))

#         target_end_date = end_date + timedelta(days=2)
#         print("zoom target end date", target_end_date)

#         if (
#             get_current_time_kst() >= start_date
#             and get_current_time_kst() <= target_end_date
#         ):
#             day_scheduler[day_id]().at("12:28").do(handle_zoom_recordings, day_id)


import hmac
import hashlib
import base64

from utils.db import DBHelper


@app.route("/api/webhook/test/zoom", methods=["POST"])
def zoom_webhook():
    app.logger.info("Received Zoom webhook")
    app.logger.info(f"Request headers: {dict(request.headers)}")
    app.logger.info(f"Request method: {request.method}")
    app.logger.info(f"Request path: {request.path}")

    data = request.get_json()
    app.logger.info(f"Webhook data: {data}")

    # Handle validation
    if data.get("event") == "endpoint.url_validation":
        # Check if the payload contains the "plainToken" property
        payload = data.get("payload", {})
        plain_token = payload.get("plainToken")
        if plain_token is not None:
            # Hash the plainToken using HMAC-SHA256
            encrypted_token = hmac.new(
                ZOOM_WEBHOOK_SECRET_TOKEN.encode("utf-8"),
                plain_token.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()

            # Create the response JSON object
            response = {"plainToken": plain_token, "encryptedToken": encrypted_token}

            # Set the response content type to JSON
            return response, 200

    if data["event"] == "recording.completed":
        recording_data = data["payload"]["object"]

        # print("recording data info", recording_data)

        host_email = recording_data["host_email"]

        # Example of how you can handle the recording data
        recording_files = recording_data["recording_files"]

        # Process each recording file
        for file in recording_files:
            file_extension = file["file_extension"].lower()

            app.logger.debug(
                f"Processing file with type: {file['file_type']} and extension: {file_extension}"
            )

            if file["file_type"] == "MP4":
                recording_start_time = file["recording_start"]
                # convert zoom time format to python time format
                utc_time = datetime.fromisoformat(
                    recording_start_time.replace("Z", "+00:00")
                )
                local_time = utc_time.astimezone(pytz.timezone("Asia/Seoul"))

                day_id = local_time.weekday() + 1

                time_str = local_time.strftime("%H:%M:%S")

                app.logger.info(
                    f"Looking up class for recording at {time_str} on day {day_id} for host {host_email}"
                )

                # Get the subject name, level name, grade name for that specific class
                query = """
                    SELECT s.subject_name, l.level_name, g.grade
                    FROM timetable t
                    JOIN classes c ON t.class_id = c.class_id
                    JOIN time_slots ts ON t.time_slot_id = ts.time_slot_id
                    JOIN subjects s ON c.subject_id = s.subject_id
                    JOIN levels l ON c.level_id = l.id
                    JOIN grades g ON c.grade_id = g.grade_id
                    JOIN teachers te ON t.teacher_id = te.id
                    WHERE te.zoom_user_id = %s
                    AND t.day_id = %s
                    AND %s BETWEEN DATE_SUB(ts.start_time, INTERVAL 10 MINUTE) 
                        AND DATE_ADD(ts.start_time, INTERVAL 10 MINUTE)
                    """
                db_helper = DBHelper()

                result = db_helper.fetch_one(query, (host_email, day_id, time_str))

                if result:
                    level = result["level_name"].replace("/", "_")

                    # Extract date from recording_start (format: '2025-12-15T14:07:01Z')
                    recording_date = recording_start_time.split('T')[0]  # Get just the date part (YYYY-MM-DD)

                    file_name = f"{recording_date}_{result['grade']}_{result['subject_name']}_{level}.{file_extension}"

                    app.logger.debug(f"Downloading file as: {file_name}")

                    download_url = file["download_url"]

                    # Queue background task
                    app.logger.info(f"Queuing Celery task to process recording: {file_name}")
                    try:
                        task_result = process_recording.delay(
                            file_name=file_name,
                            download_url=download_url,
                            host_email=host_email,
                        )
                        app.logger.info(f"Task queued successfully. Task ID: {task_result.id}")
                    except Exception as e:
                        app.logger.error(f"Failed to queue Celery task for {file_name}: {str(e)}", exc_info=True)

                    # try:
                    #     storeZoomVideo(file_name, download_url)
                    #     app.logger.info(f"Successfully stored video: {file_name}")
                    # except Exception as e:
                    #     app.logger.error(
                    #         f"Failed to store video {file_name}: {str(e)}",
                    #         exc_info=True,
                    #     )
                else:
                    # just for 6/14 sehan test...
                    # file_name = f"{host_email}_test_file.{file_extension}"
                    # download_url = file["download_url"]
                    # process_recording.delay(
                    #     file_name=file_name,
                    #     download_url=download_url,
                    #     host_email=host_email
                    # )

                    # storeZoomVideo(file_name, download_url)

                    # app.logger.error(
                    #     f"No matching class found in timetable for time {time_str} on day id {day_id} for host {host_email}"
                    # )
                    pass  # No action needed when no matching class found

    # Else handle normal event
    # Zoom event payload will be here
    return "", 200


@app.route("/get-week-number", methods=["GET"])
@jwt_required()
def get_week_number_for_request():
    week_number = get_week_number()
    print("todays' week number is", week_number)
    return jsonify({"week_number": week_number, "sehan_start_date": SEHAN_START_DATE})


def get_week_number():
    seoul_tz = pytz.timezone("Asia/Seoul")

    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))

    # Get the current date
    current_date = get_current_time_kst()

    # Calculate the difference in days

    days_difference = (current_date - start_date).days

    # If the current date is before the start date, return week 0
    if days_difference < 0:
        return 0

    # Calculate the week number
    week_number = days_difference // 7 + 1

    return week_number


def handle_student_report():
    previous_week_number = get_week_number() - 1

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT p.phone_number, s.name FROM parents as p
                JOIN parents_students as ps ON
                p.parent_id = ps.parent_id
                JOIN students as s ON
                s.student_id = ps.student_id
            """

            cursor.execute(sql)
            result = cursor.fetchall()
            print("result for parents to send report", result)

            for row in result:
                phone_number = row["phone_number"]
                student_name = row["name"]

                send_report_message(student_name, previous_week_number, phone_number)

    finally:
        connection.close()


def schedule_student_report():
    seoul_tz = pytz.timezone("Asia/Seoul")
    # Convert SEHAN_START_DATE to a datetime object
    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
    end_date = seoul_tz.localize(datetime.strptime(SEHAN_END_DATE, "%Y-%m-%d"))

    # Calculate the target start date (1 week after SEHAN_START_DATE)
    target_start_date = start_date + timedelta(weeks=1)
    target_end_date = end_date + timedelta(weeks=1)

    # Check if the current date is after or on the target start date
    if (
        get_current_time_kst() >= target_start_date
        and get_current_time_kst() <= target_end_date
    ):
        # Schedule the task
        schedule.every().wednesday.at("13:00").do(handle_student_report)
        print(f"Scheduled student report from {target_start_date.strftime('%Y-%m-%d')}")
    else:
        print(f"Scheduling will start from {target_start_date.strftime('%Y-%m-%d')}")


def delete_student_comments():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            sql = """
                DELETE from student_comments;
            """

            cursor.execute(sql)
        connection.commit()

    finally:
        connection.close()


def schedule_delete_comments():
    schedule.every().saturday.at("00:00").do(delete_student_comments)


def start_schedule():
    global should_reschedule

    print("starting schedule")
    app.logger.info("starting schedule")
    try:
        schedule_attendance_checks()
        app.logger.info(f"Scheduler initialized. Number of scheduled jobs: {len(schedule.jobs)}")
    except Exception as e:
        app.logger.error(f"Error initializing attendance checks: {e}", exc_info=True)
    
    # schedule_zoom_video_upload()
    # schedule_student_report()
    # schedule_delete_comments()
    while True:
        try:
            if should_reschedule:
                should_reschedule = False
                clear_and_reschedule_schedules()

            schedule.run_pending()
            time.sleep(1)
        except Exception as e:
            app.logger.error(f"Error in scheduler loop: {e}", exc_info=True)
            time.sleep(5)  # Wait longer before retrying on error


def clear_and_reschedule_schedules():
    global should_reschedule

    with schedule_lock:
        # Clear existing schedules
        schedule.clear()

        # Re-run the schedules (reschedule them)
        schedule_attendance_checks()
        # schedule_zoom_video_upload()
        # schedule_student_report()
        # schedule_delete_comments()
    print("Schedules cleared and rescheduled.")


# generateRandomNumber()
# schedule_thread = threading.Thread(target = start_schedule)
# schedule_thread.start()

should_reschedule = False
schedule_lock = threading.Lock()


def initialize_scheduler():
    """
    Initialize the scheduler if the application is running in production mode.
    """
    mode = os.getenv("APP_MODE", "development")  # Default to 'development'
    if mode == "production":
        generateRandomNumber()
        schedule_thread = threading.Thread(target=start_schedule)
        schedule_thread.start()


# Initialize scheduler immediately for Gunicorn (production)
if os.getenv("APP_MODE", "development") == "production":
    initialize_scheduler()

if __name__ == "__main__":
    port = 5001
    seoul_tz = pytz.timezone("Asia/Seoul")
    # Convert SEHAN_START_DATE to a datetime object
    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
    end_date = seoul_tz.localize(datetime.strptime(SEHAN_END_DATE, "%Y-%m-%d"))

    # generateRandomNumber()

    # Calculate the target start date (1 week after SEHAN_START_DATE)
    target_start_date = start_date + timedelta(weeks=1)
    target_end_date = end_date + timedelta(weeks=1)

    # Check if the current date is after or on the target start date
    if (
        get_current_time_kst() >= target_start_date
        and get_current_time_kst() <= target_end_date
    ):
        print("bypassed")
    if len(sys.argv) > 1 and sys.argv[1]:
        port = sys.argv[1]
    schedule_thread = None
    # generateRandomNumber()
    # schedule_thread = threading.Thread(target=start_schedule)
    # schedule_thread.start()

    # start_time = datetime.strptime(
    #                 "00:15:00", "%H:%M:%S"
    #             ).time()
    # day_name = "Thursday"
    # absent_date = get_adjusted_date(start_time, day_name)
    # print(absent_date)

    app.run("0.0.0.0", debug=True, port=port, use_reloader=True)
