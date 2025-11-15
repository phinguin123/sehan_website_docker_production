from celery import Celery
from utils.utils import storeZoomVideo  # Import your actual function
import logging
from services.report_service import ReportService

app = Celery("tasks")
app.config_from_object("config.celery_config")


@app.task
def process_recording(file_name, download_url, host_email):
    try:
        storeZoomVideo(file_name, download_url)
        logging.info(f"Successfully stored video: {file_name}")
        return True
    except Exception as e:
        logging.error(f"Failed to store video {file_name}: {str(e)}", exc_info=True)
        # Implement retry logic here if needed
        return False


@app.task
def process_generate_student_report():
    try:
        rs = ReportService()
        rs.generate_student_reports()
    except Exception as e:
        logging.exception(f"Error in generating report")
