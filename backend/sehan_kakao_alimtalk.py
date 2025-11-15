import requests

# URL and authentication details
url = "https://api.tason.com/tas-api/kakaosend"
tas_id = "koysr20@gmail.com"  # Replace with your tas_id
auth_key = "***REMOVED-TASON-KEY***"  # Replace with your actual auth_key
attendance_template_code = "C_YO_002_02_62706"
student_report_template_code = "C_YO_002_02_62707"
before_summer_template_code = "C_YO_002_02_67647"
pt_session_template_code = "C_YO_002_02_72105"

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
www.sehanib.kr 학생 이메일({student_email})과 www.sehanib.kr/parent 학부모님 이메일({parent_email}) 확인 바라며, 수정이 필요한 경우 카카오톡 채널로 연락 바랍니다. 비밀번호는 2550으로 동일합니다.
※ www.sehanib.kr 은 노트북에서만 로그인 가능하며, 학부모님 사이트는 개강 다음날 부터 데이터 입력 됩니다.
※홈페이지 사용 방법은 추후 사전안내문과 사전 온라인미팅 시 공지(날짜와 시간은 사전안내문 참고)""",
                "sender": "0234532550",  # Replace with your sender number
                "sender_name": "sehanib123",  # Replace with sender name
                "template_code": pt_session_template_code,  # Replace with your template code
            },
        ],
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print("Error:", e)


def send_pt_session_reminder(
    parent_phone_number, session_date, session_time, student_name):
    # Data to send
    payload = {
        "tas_id": tas_id,
        "send_type": "KA",
        "auth_key": auth_key,
        "data": [
            {
                "user_name": "김지태어쩌구",
                "user_email": parent_phone_number,  # Format: country code + phone number
                "map_content": f"""안녕하세요. 세한아카데미 IB 개인 수업 안내입니다.
한국 시간 기준으로 {session_date} {session_time}에 {student_name} 학생 수업이 진행될 예정입니다.
*만약 수업 시간이 변경되는 경우 추가 알림이 안 갈 수 있습니다.""",
                "sender": "0234532550",  # Replace with your sender number
                "sender_name": "sehanib123",  # Replace with sender name
                "template_code": pt_session_template_code,  # Replace with your template code
            },
        ],
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print("Error:", e)


if __name__ == "__main__":
    # Test with a sample phone number
    send_pt_session_reminder("821091285211", "09월 26일", "14시 00분", "김지태")