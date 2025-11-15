from utils.db import DBHelper
from datetime import datetime, timedelta
import pytz
import os

db_helper = DBHelper()


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
    return db_helper.fetch_one(query, (subject_name))


def get_grade_id_by_student_id(student_id):
    query = "SELECT g.grade_id FROM students s JOIN grades g ON s.grade = g.grade WHERE s.student_id = %s"

    return db_helper.fetch_one(query, (student_id))


from test_ftp import upload_file_to_ftp
import requests


def storeZoomVideo(name, link):
    # data = request.get_json()

    if name:
        response = requests.get(link, stream=True)
        print("getting the response")
        with open(name, "wb+") as file:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:  # filter out keep-alive chunks
                    file.write(chunk)

        print(f"Download completed")
        upload_file_to_ftp(name, name)

    else:
        print("not received link")

    return "received link"


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


def check_user_admin(teacher_id):
    if teacher_id == 16 or teacher_id == 29:
        return True
    return False
