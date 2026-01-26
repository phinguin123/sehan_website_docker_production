from celery_app import celery_app as app
from utils.utils import storeZoomVideo  # Import your actual function
import logging
import os
from services.report_service import ReportService

# Lazy import of Flask app to avoid circular imports
def get_flask_app():
    """Get Flask app instance, importing it only when needed."""
    try:
        from app import app as flask_app
        return flask_app
    except ImportError:
        # Fallback: try to import from the module path
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from app import app as flask_app
        return flask_app

# Configure logging for Celery tasks
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# If no handlers are configured, add a console handler
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(handler)


@app.task(name='celery_tasks.process_recording', bind=True, max_retries=3)
def process_recording(self, file_name, download_url, host_email):
    """
    Process Zoom recording download and upload to FTP.
    
    Args:
        file_name: Name of the file to save
        download_url: URL to download the recording from
        host_email: Email of the Zoom meeting host
    """
    logger.info(f"Starting to process recording: {file_name} for host: {host_email}")
    logger.info(f"Download URL: {download_url[:100]}...")  # Log first 100 chars of URL
    
    try:
        # Log current working directory
        cwd = os.getcwd()
        logger.info(f"Current working directory: {cwd}")
        logger.info(f"File will be saved as: {file_name}")
        
        # Call the storeZoomVideo function
        result = storeZoomVideo(file_name, download_url)
        
        # Check if file exists after download in the recordings directory
        recordings_dir = os.path.join(os.getcwd(), "recordings")
        stored_file_path = os.path.join(recordings_dir, file_name)

        if os.path.exists(stored_file_path):
            file_size = os.path.getsize(stored_file_path)
            logger.info(
                f"Successfully stored video: {stored_file_path} (size: {file_size} bytes)"
            )
        else:
            logger.warning(
                f"File {stored_file_path} not found after download. It may have been uploaded to FTP and deleted."
            )
        
        logger.info(f"Task completed successfully for: {file_name}")
        return {"status": "success", "file_name": file_name, "result": result}
        
    except Exception as e:
        error_msg = f"Failed to store video {file_name}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        
        # Retry the task if it fails
        try:
            raise self.retry(exc=e, countdown=60)  # Retry after 60 seconds
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for {file_name}. Task failed permanently.")
            return {"status": "failed", "file_name": file_name, "error": str(e)}


@app.task(name='celery_tasks.process_generate_student_report', bind=True)
def process_generate_student_report(self, task_id=None):
    """
    Generate student reports asynchronously and save to file.
    
    Args:
        task_id: Optional task ID to use for filename. If None, uses self.request.id
    
    Returns:
        dict: Status and file information
    """
    # Use provided task_id or Celery's task ID
    if task_id is None:
        task_id = self.request.id
    
    # Create reports directory if it doesn't exist
    reports_dir = os.path.join(os.getcwd(), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    # Generate filename with task_id
    output_path = os.path.join(reports_dir, f"student_reports_{task_id}.zip")
    
    logger.info(f"Starting report generation task {task_id}")
    
    # Get Flask app and execute within Flask application context
    # IMPORTANT: Set up Flask context BEFORE importing or using any Flask-dependent code
    try:
        flask_app = get_flask_app()
        logger.info(f"Flask app retrieved successfully: {type(flask_app)}")
    except Exception as e:
        error_msg = f"Failed to get Flask app for task {task_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "status": "failed",
            "error": error_msg,
            "task_id": task_id
        }
    
    # Execute report generation within Flask application context
    with flask_app.app_context():
        try:
            logger.info(f"Flask app context established for task {task_id}")
            # Generate reports and save to file
            rs = ReportService()
            result = rs.generate_student_reports(output_path=output_path)
            
            logger.info(f"Report generation completed for task {task_id}. File: {output_path}")
            
            return result
            
        except Exception as e:
            error_msg = f"Error generating student reports for task {task_id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return {
                "status": "failed",
                "error": str(e),
                "task_id": task_id
            }
