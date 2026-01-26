// GenerateCodePage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import instance from "@/apis/axiosInstance";

function AdminAttendanceCodePage() {
  const [ validCode, setValidCode ] = useState();


  useEffect(() => {
    function getCode(){
      instance.get('/api/attendance/code').then((r) => {    
        const code = r.data.attendanceCode
        if(code){
          setValidCode(code);
        }
        else{
          console.log('empty code?');
        }
      })
      .catch(error => {
        console.error("Error in get request:",error);
      });
    }

    getCode();
  }, []);


  return (
    <CodeContainer>
      <ContainerHeading>오늘의 코드</ContainerHeading>
      <CodeDisplay>{validCode}</CodeDisplay>
      <InstructionText>출석탭에서 위에 코드를 입력해주세요.</InstructionText>
    </CodeContainer>
  );
}

const CodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  background-color: #ffffff;
  margin-top: 6rem;
  width: 100%;
`;

const CodeDisplay = styled.div`
  font-size: 80px;
  font-weight: bold;
  color: #2c3e50;
  background-color: #ecf0f1;
  padding: 20px 40px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  margin-top: 20px;
`;

const InstructionText = styled.p`
  font-size: 2rem;
  color: #7f8c8d;
  margin-top: 20px;
`;

const ContainerHeading = styled.div`
  font-family: 'Noto Sans KR Bold';
  font-weight: 900;
  font-size: 1.7rem;
`;

export default AdminAttendanceCodePage;
