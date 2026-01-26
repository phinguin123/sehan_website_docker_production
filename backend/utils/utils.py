from utils.db import DBHelper
from datetime import datetime, timedelta
import pytz
import os
import json
from decimal import Decimal

db_helper = DBHelper()


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def timedelta_to_string(td):
    total_seconds = int(td.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}"


def get_current_time():
    seoul_tz = pytz.timezone("Asia/Seoul")
    current_time = datetime.now(seoul_tz).time()

    return current_time


def get_adjusted_current_date():
    current_date = get_current_datetime()
    if current_date.hour < 3:
        # Before 3 AM → treat as previous day
        return (current_date - timedelta(days=1)).date()
    else:
        # Normal case
        return current_date.date()


def get_current_datetime():
    seoul_tz = pytz.timezone("Asia/Seoul")
    current_date = datetime.now(seoul_tz)

    return current_date


def get_current_day_id():
    seoul_tz = pytz.timezone("Asia/Seoul")
    current_day = datetime.now(seoul_tz).strftime("%A")

    query = "SELECT day_id from days WHERE day_name = %s"
    return db_helper.fetch_one(query, (current_day))["day_id"]


# temporary need to change
# TODO
def get_grade_id_by_name(grade_name):
    query = "SELECT grade_id from grades WHERE grade = %s"
    return db_helper.fetch_one(query, (grade_name))


def get_subject_id_by_name(subject_name):
    query = "SELECT subject_id from subjects WHERE subject_name = %s"
    return db_helper.fetch_one(query, (subject_name,))


def get_grade_id_by_student_id(student_id):
    query = "SELECT g.grade_id FROM students s JOIN grades g ON s.grade = g.grade WHERE s.student_id = %s"

    return db_helper.fetch_one(query, (student_id))


from test_ftp import upload_file_to_ftp
import requests


def storeZoomVideo(name, link):
    """
    Download Zoom video from URL and upload to FTP.
    
    Args:
        name: Filename to save the video as
        link: Download URL for the video
        
    Returns:
        str: Status message
    """
    import os
    import logging
    
    logger = logging.getLogger(__name__)
    
    if not name:
        logger.error("No filename provided for video download")
        return "error: no filename"
    
    if not link:
        logger.error("No download link provided")
        return "error: no link"
    
    try:
        # Create recordings directory if it doesn't exist
        recordings_dir = os.path.join(os.getcwd(), "recordings")
        os.makedirs(recordings_dir, exist_ok=True)
        
        # Save file in recordings directory
        file_path = os.path.join(recordings_dir, name)
        
        logger.info(f"Downloading video from {link[:100]}... to {file_path}")
        response = requests.get(link, stream=True, timeout=300)  # 5 minute timeout
        response.raise_for_status()  # Raise exception for bad status codes
        
        with open(file_path, "wb+") as file:
            for chunk in response.iter_content(chunk_size=8192):  # 8KB chunks
                if chunk:  # filter out keep-alive chunks
                    file.write(chunk)
        
        file_size = os.path.getsize(file_path)
        logger.info(f"Download completed: {file_path} (size: {file_size} bytes)")
        
        # Upload to FTP
        logger.info(f"Uploading {name} to FTP...")
        upload_file_to_ftp(file_path, name)
        logger.info(f"FTP upload completed for {name}")
        
        # Optionally clean up local file after FTP upload to save space
        # Uncomment the line below if you want to delete files after FTP upload
        # os.remove(file_path)
        # logger.info(f"Local file {file_path} removed after FTP upload")
        
        return "success"
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading video {name}: {str(e)}", exc_info=True)
        return f"error: download failed - {str(e)}"
    except Exception as e:
        logger.error(f"Error processing video {name}: {str(e)}", exc_info=True)
        return f"error: {str(e)}"


def get_current_datetime_object():
    kst = pytz.timezone("Asia/Seoul")
    return datetime.now(kst)


SEHAN_START_DATE = os.environ.get("SEHAN_START_DATE")


def get_current_week_number():
    seoul_tz = pytz.timezone("Asia/Seoul")
    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
    current_date = get_current_datetime_object()

    delta_days = (current_date - start_date).days

    if delta_days < 0:
        return 0

    return delta_days // 7 + 1


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
        days=3
    )  # Friday is 4 days after Monday

    # Return the date range as strings in the format YYYY-MM-DD
    return start_of_last_week.date(), end_of_last_week.date()


def get_week_date_range(week_number):
    """
    Get the start and end date for a specific week number.
    Week starts on Monday and ends on Sunday.
    
    Args:
        week_number (int): The week number (1-based, e.g., 1 for first week)
    
    Returns:
        tuple: (start_date, end_date) as date objects
    """
    seoul_tz = pytz.timezone("Asia/Seoul")
    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
    
    # Calculate the Monday of the specified week
    # Week 1 starts on the Monday of SEHAN_START_DATE week
    # First, find the Monday of the start week
    days_since_monday = start_date.weekday()  # 0 = Monday, 6 = Sunday
    monday_of_first_week = start_date - timedelta(days=days_since_monday)
    
    # Calculate the target week's Monday
    target_week_monday = monday_of_first_week + timedelta(weeks=week_number - 1)
    
    # End date is Sunday of that week
    target_week_sunday = target_week_monday + timedelta(days=6)
    
    return target_week_monday.date(), target_week_sunday.date()


def get_all_weeks_date_ranges(num_weeks=6):
    """
    Get date ranges for all weeks (default 6 weeks).
    
    Args:
        num_weeks (int): Number of weeks to get ranges for
    
    Returns:
        list: List of tuples [(start_date, end_date), ...]
    """
    return [get_week_date_range(i) for i in range(1, num_weeks + 1)]


def get_week_number_from_date(target_date):
    """
    Get the week number for a specific date.
    
    Args:
        target_date (date): The date to check
    
    Returns:
        int: The week number (1-based)
    """
    seoul_tz = pytz.timezone("Asia/Seoul")
    start_date = seoul_tz.localize(datetime.strptime(SEHAN_START_DATE, "%Y-%m-%d"))
    
    # Find the Monday of the start week
    days_since_monday = start_date.weekday()
    monday_of_first_week = start_date - timedelta(days=days_since_monday)
    
    # Convert target_date to datetime if it's a date object
    if isinstance(target_date, datetime):
        target_dt = target_date
    else:
        target_dt = seoul_tz.localize(datetime.combine(target_date, datetime.min.time()))
    
    # Calculate week number
    days_diff = (target_dt.date() - monday_of_first_week.date()).days
    
    if days_diff < 0:
        return 0
    
    return (days_diff // 7) + 1


def check_user_admin(teacher_id):
    if teacher_id == 16 or teacher_id == 29:
        return True
    return False
