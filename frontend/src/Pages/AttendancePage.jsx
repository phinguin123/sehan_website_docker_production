import { useState, useContext, useEffect } from "react";
import styled from "styled-components";
// import { Flex } from '@charka-ui/react';
import {
  IconButton,
  CloseButton,
  Flex,
  Heading,
  Icon,
  useColorModeValue,
  Text,
  Drawer,
  DrawerContent,
  useDisclosure,
} from "@chakra-ui/react";
import instance from "@/apis/AxiosInterceptor";

const CODE_LENGTH = 4;

const ContainerHeading = styled.div`
  font-family: "Noto Sans KR Bold";
  font-weight: 900;
  font-size: 30px;
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;

  width: 90%; /* Set width to a reasonable percentage or fixed pixel value */
  max-width: 2400px; /* Limit max width for large screens */
  // min-height: 700px;     /* Set a minimum height to control appearance */
  margin-top: 50px;
  padding: 20px; /* Add padding for inner content spacing */
  align-items: center;
  justify-content: center;
  text-align: center;
  // background-color: white;
  // border-radius: 10px;
  // box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);  /* Adds a subtle shadow */
`;

const getKSTDate = (daysToAdd = 0) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;

  const kst = new Date(utc + 9 * 60 * 60000 + daysToAdd * 24 * 60 * 60 * 1000);

  return kst;
};

function AttendancePage() {
  const [codes, setCodes] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [validCode, setValidCode] = useState();
  const [currentClass, setCurrentClass] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  const currentDate = getKSTDate();
  const currentDay = currentDate.getDate().toString().padStart(2, "0");
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    fetchCurrentClass();
    fetchStudentGrade();
  }, []);

  const fetchCurrentClass = async () => {
    try {
      const response = await instance.get("/api/students/me/current-class");
      console.log("received current class response:", response.data);
      setCurrentClass(response.data);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
    }
  };

  const fetchStudentGrade = async () => {
    try {
      const response = await instance.get("/api/student/grade");
      console.log("current grade", response.data);
      setStudentGrade(response.data.grade);
    } catch (error) {
      console.error("Error fetching student's grade:", error);
    }
  };

  function handleInputChange(e) {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCodes(value);
    }
  }

  const submitAttendance = async () => {
    try {
      const response = await instance.post("/api/students/me/attendance", {
        subject_name: currentClass.subject_name,
        timetable_id: currentClass.timetable_id,
        code: codes,
        start_time: currentClass.start_time,
      });
      alert("Attendance submitted successfully!");
      setIsValid(true);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
        setIsValid(false);
      }
    }
  };

  // auto-submit when code length is reached
  useEffect(() => {
    if (codes.length === CODE_LENGTH) {
      // Fetch the current class again to ensure it's up-to-date
      const handleSubmit = async () => {
        await fetchCurrentClass(); // wait for the latest class info
        submitAttendance(); // then submit with updated state
      };
      handleSubmit();
    }
  }, [codes]);

  return (
    <Container>
      <CardContainer>
        <Flex direction="column" align="center">
          <Flex style={{ fontSize: "50px" }} align="center">
            <div style={{ fontSize: "60px", color: "gray" }}>
              {currentYear}-{currentMonth}-{currentDay}{" "}
            </div>
          </Flex>
          <div
            style={{ fontSize: "80px", color: "gray", paddingLeft: "30px" }}
          ></div>
          <Flex>
            <div style={{ fontSize: "50px" }}>
              {studentGrade}학년 {currentClass?.subject_name}{" "}
              {currentClass?.level_name} ({currentClass?.mode_name})
            </div>
          </Flex>
        </Flex>
        <ContainerHeading>
          {currentClass?.start_time} - {currentClass?.end_time}
        </ContainerHeading>
        <Box>
          {Array(CODE_LENGTH)
            .fill(0)
            .map((v, i) => {
              return <Display key={i}>{codes[i]}</Display>;
            })}
          <Input
            value={codes}
            onChange={handleInputChange}
            maxLength={CODE_LENGTH}
            $isvalid={codes.length}
          />
        </Box>
        {codes.length >= CODE_LENGTH ? (
          isValid ? (
            <Validation>출석 완료</Validation>
          ) : (
            <Validation color="#ff5a60">출석 실패</Validation>
          )
        ) : (
          <Validation color="#ff5a60">코드를 입력해주세요</Validation>
        )}
      </CardContainer>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 100vh;
  background-color: #fcfcfc;
  width: 100%;
`;

const Box = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 30px 0 10px;
`;

const Display = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 76px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-weight: 700;
  font-size: 32px;
  color: #2e2e2e;
`;

const Input = styled.input`
  position: absolute;
  max-width: 240px;
  padding: 0 20px 3px;
  height: 76px;
  background: none;
  letter-spacing: 50px;
  font-size: 28px;
  color: rgba(0, 0, 0, 0);
  caret-color: ${(props) =>
    props.$isvalid === CODE_LENGTH ? "transparent" : "black"};
  border: none;
  outline: none;
`;

const Validation = styled.p`
  font-weight: 500;
  color: ${({ color }) => (color ? color : "#1eba66")};
`;

export default AttendancePage;
