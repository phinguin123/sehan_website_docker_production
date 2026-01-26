import requests
import logging
import os

# Set up logging - ensure logs go to server.log when called from Celery
# Try to use the same log file as Celery tasks
LOG_FILE = "logs/server.log"
logger = logging.getLogger(__name__)

# If logger doesn't have handlers, add file handler
if not logger.handlers:
    # Ensure log directory exists
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
    logger.addHandler(file_handler)
    logger.setLevel(logging.INFO)
    
    # Also add to root logger to catch all logs
    root_logger = logging.getLogger()
    if not any(isinstance(h, logging.FileHandler) and h.baseFilename.endswith('server.log') for h in root_logger.handlers):
        root_logger.addHandler(file_handler)

# URL and authentication details
url = "https://api.tason.com/tas-api/kakaosend"
tas_id = "koysr20@gmail.com"  # Replace with your tas_id
auth_key = "***REMOVED-TASON-KEY***"
# attendance_template_code = "C_YO_002_02_62706"
student_report_template_code = "C_YO_002_02_62707"
before_summer_template_code = "C_YO_002_02_67647"
before_winter_template_code = "C_YO_002_02_73504"
pt_session_remind_template_code = "C_YO_002_02_73038"
pt_report_template_code = "C_YO_002_02_72859"

# Send the POST request
headers = {"Content-Type": "application/json"}


def send_attendance_message(student_name, user_phone_number):
    # Data to send
    payload = {
        "tas_id": tas_id,
        "send_type": "KA",
        "auth_key": auth_key,
        "data": [
            {
                "user_name": "김지태어쩌구",
                "user_email": user_phone_number,  # Format: country code + phone number
                "map_content": f"안녕하세요. 세한아카데미 IB입니다. {student_name} 학생이 출석하지 않아 연락드립니다.",
                "sender": "0234532550",  # Replace with your sender number
                "sender_name": "sehanib123",  # Replace with sender name
                "template_code": attendance_template_code,  # Replace with your template code
            },
        ],
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print("Error:", e)


def send_report_message(student_name, week_number, user_phone_number):
    # Data to send
    payload = {
        "tas_id": tas_id,
        "send_type": "KA",
        "auth_key": auth_key,
        "data": [
            {
                "user_name": "김지태어쩌구",
                "user_email": user_phone_number,  # Format: country code + phone number
                "map_content": f"안녕하세요. 요청하신 {week_number}주 차 {student_name} 학생 Assessment Report Card입니다. 확인 후 문의 사항 있으시면 언제든지 연락 바랍니다.",
                "sender": "0234532550",  # Replace with your sender number
                "sender_name": "sehanib123",  # Replace with sender name
                "template_code": student_report_template_code,  # Replace with your template code
            },
        ],
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print("Error:", e)


def send_before_summer_message(
    parent_phone_number, sehan_start_date, student_email, parent_email
):
    # Data to send
    payload = {
        "tas_id": tas_id,
        "send_type": "KA",
        "auth_key": auth_key,
        "data": [
            {
                "user_name": "김지태어쩌구",
                "user_email": parent_phone_number,  # Format: country code + phone number
                "map_content": f"""안녕하세요. {sehan_start_date} 시작하는 IB여름특강을 위해서 출결 및 숙제를 포함한 학습관리 홈페이지 로그인 안내입니다.
www.sehanibp.kr 학생 이메일({student_email})과 www.sehanibp.kr/parent 학부모님 이메일({parent_email}) 확인 바라며, 수정이 필요한 경우 카카오톡 채널로 연락 바랍니다. 비밀번호는 2550으로 동일합니다.
※ www.sehanibp.kr 은 노트북에서만 로그인 가능하며, 학부모님 사이트는 개강 다음날 부터 데이터 입력 됩니다.
※홈페이지 사용 방법은 추후 사전안내문과 사전 온라인미팅 시 공지(날짜와 시간은 사전안내문 참고)""",
                "sender": "0234532550",  # Replace with your sender number
                "sender_name": "sehanib123",  # Replace with sender name
                "template_code": pt_session_remind_template_code,  # Replace with your template code
            },
        ],
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print("Error:", e)


# Private tutoring functions removed - feature deprecated

def send_before_winter_message(
    parent_phone_number, sehan_start_date, student_email, parent_email
):
    # Validate phone number format (should be country code + number, e.g., 821012345678)
    if not parent_phone_number:
        logger.error("Parent phone number is missing")
        return False
    
    # Ensure phone number is in correct format (remove spaces, dashes, etc.)
    phone_clean = str(parent_phone_number).replace("-", "").replace(" ", "").replace("+", "")
    if not phone_clean.startswith("82"):  # Korea country code
        if phone_clean.startswith("0"):
            # Convert 010-xxxx-xxxx format to 8210xxxxxxx
            phone_clean = "82" + phone_clean[1:]
        else:
            phone_clean = "82" + phone_clean
    
    # Data to send
    payload = {
        "tas_id": tas_id,
        "send_type": "KA",
        "auth_key": auth_key,
        "data": [
            {
                "user_name": "김지태어쩌구",
                "user_email": phone_clean,  # Format: country code + phone number
                "map_content": f"""안녕하세요. {sehan_start_date} 시작하는 IB겨울 특강을 위해서 출결 및 숙제를 포함한 학습관리 홈페이지 로그인 안내입니다.
www.sehanibp.kr 학생 이메일({student_email})과 www.sehanibp.kr/parent 학부모님 이메일({parent_email}) 확인 바라며, 수정이 필요한 경우 카카오톡 채널로 연락 바랍니다. 비밀번호는 2550으로 동일합니다.
※ www.sehanibp.kr 은 노트북에서만 로그인 가능하며, 학부모님 사이트는 개강 다음날 부터 데이터 입력 됩니다.
※홈페이지 사용 방법은 추후 사전안내문과 사전 온라인미팅 시 공지(날짜와 시간은 사전안내문 참고)""",
                "sender": "0234532550",  # Replace with your sender number
                "sender_name": "phinguin",  # Replace with sender name
                "template_code": before_winter_template_code,  # Replace with your template code
            },
        ],
    }

    try:
        logger.info(f"Sending Kakao AlimTalk to {phone_clean} for student {student_email}")
        logger.debug(f"Payload template_code: {before_winter_template_code}, phone: {phone_clean}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        
        response_data = response.json()
        logger.info(f"Kakao API Response Status: {response.status_code}")
        logger.info(f"Kakao API Response Body: {response_data}")
        
        # Log the response to help debug
        print(f"Kakao API Response: {response_data}")
        
        # Check if the response indicates success or failure
        # Different APIs return different success indicators
        if isinstance(response_data, dict):
            # Check for Tason API success format: {'MEM CNT': 1, 'WRONG_DATA': []}
            if "MEM CNT" in response_data:
                mem_cnt = response_data.get("MEM CNT", 0)
                wrong_data = response_data.get("WRONG_DATA", [])
                if mem_cnt > 0 and (not wrong_data or len(wrong_data) == 0):
                    logger.info(f"✅ Message sent successfully to {phone_clean} (MEM CNT: {mem_cnt})")
                    return True
                else:
                    error_msg = f"MEM CNT: {mem_cnt}, WRONG_DATA: {wrong_data}"
                    logger.error(f"❌ Kakao API returned error: {error_msg}")
                    logger.error(f"Full response: {response_data}")
                    return False
            # Check various other possible success indicators
            elif (response_data.get("result") == "success" or 
                response_data.get("code") == "0000" or 
                response_data.get("status") == "success" or
                response_data.get("success") == True):
                logger.info(f"✅ Message sent successfully to {phone_clean}")
                return True
            elif response_data.get("result") == "fail" or (response_data.get("code") is not None and response_data.get("code") != "0000"):
                error_msg = response_data.get("message") or response_data.get("error") or response_data.get("msg") or str(response_data)
                logger.error(f"❌ Kakao API returned error: {error_msg}")
                logger.error(f"Full response: {response_data}")
                return False
            else:
                # If we can't determine, log the full response
                logger.warning(f"⚠️  Unknown response format: {response_data}")
                return True  # Assume success if we can't determine
        else:
            logger.warning(f"⚠️  Unexpected response format (not dict): {response_data}")
            return True  # Assume success if we can't determine
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error sending Kakao AlimTalk: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_text = e.response.text
                logger.error(f"Error response body: {error_text}")
                print(f"Error response: {error_text}")
            except:
                pass
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    # Test code removed - private tutoring feature deprecated
    pass