"""
Common utilities and imports for private tutoring routes
"""

import sys
import os
import json
import decimal
from datetime import datetime, timedelta
import pytz
import bcrypt

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from utils.db import DBHelper
from dao.private_tutoring.pt_student_dao import PTStudentDAO
from dao.private_tutoring.pt_session_dao import PTSessionDAO
from dao.private_tutoring.pt_schedule_dao import PTScheduleDAO
from dao.private_tutoring.pt_alert_dao import PTAlertDAO
from dao.private_tutoring.pt_subject_dao import PTSubjectDAO
from dao.private_tutoring.pt_teacher_dao import PTTeacherDAO

# Custom JSON encoder to handle Decimal and datetime types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super(DecimalEncoder, self).default(obj)

# Initialize DAO instances
db_helper = DBHelper()
student_dao = PTStudentDAO(db_helper)
session_dao = PTSessionDAO(db_helper)
schedule_dao = PTScheduleDAO(db_helper)
alert_dao = PTAlertDAO(db_helper)
subject_dao = PTSubjectDAO(db_helper)
# PTTeacherDAO uses static methods, no instantiation needed
teacher_dao = PTTeacherDAO
