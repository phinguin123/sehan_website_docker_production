import React, { useEffect, useState } from "react";
import {
  CCard,
  CCardBody,
  CCol,
  CCardHeader,
  CRow,
  CContainer,
} from "@coreui/react";
import { CChartBar, CChartDoughnut, CChartPie } from "@coreui/react-chartjs";
import instance from "../apis/AxiosInterceptor";

const AdminDashboardPage = () => {
  const [subjectNames, setSubjectNames] = useState([]);
  const [homeworkAverage, setHomeworkAverage] = useState([]);
  const [examAverage, setExamAverage] = useState([]);
  const [attendanceInfo, setAttendanceInfo] = useState([]);

  useEffect(() => {
    fetchAttendanceInfo();
    fetchSubjectNames(3);
    fetchSubjectNames(1);
    fetchSubjectNames(2);
    fetchHomeworkAverage(3);
    fetchHomeworkAverage(1);
    fetchHomeworkAverage(2);
    fetchExamAverage(3);
    fetchExamAverage(1);
    fetchExamAverage(2);
  }, []);

  const fetchAttendanceInfo = async () => {
    try {
      const response = await instance.get("/api/attendance/info");
      console.log("attendance info", response.data);

      setAttendanceInfo(response.data);
    } catch (error) {
      console.error("Error fetching attendance info", error);
    }
  };

  const fetchSubjectNames = async (gradeID) => {
    try {
      const response = await instance.get("/api/get-grade-subjects", {
        params: { gradeID },
      });
      console.log("received subject names response:", response.data);

      setSubjectNames((prevSubjects) => ({
        ...prevSubjects,
        [gradeID]: response.data, // Dynamically update the average for the specific grade
      }));
    } catch (error) {
      console.error("Error fetching student names:", error);
    }
  };

  const fetchHomeworkAverage = async (gradeID) => {
    try {
      const response = await instance.get("/api/homework/average", {
        params: { gradeID },
      });

      console.log("homework average", response.data);

      setHomeworkAverage((prevAverages) => ({
        ...prevAverages,
        [gradeID]: response.data, // Dynamically update the average for the specific grade
      }));
      console.log(
        "hoemwork average final",
        homeworkAverage[11]?.homeworkAverageMarks
      );
    } catch (error) {
      console.error("Error fetching student names:", error);
    }
  };

  const fetchExamAverage = async (gradeID) => {
    try {
      const response = await instance.get("/api/exam/average", {
        params: { gradeID },
      });

      console.log("exam average", response.data);

      setExamAverage((prevAverages) => ({
        ...prevAverages,
        [gradeID]: response.data, // Dynamically update the average for the specific grade
      }));
    } catch (error) {
      console.error("Error fetching student names:", error);
    }
  };

  return (
    <CContainer
      fluid
      className="px-6"
      style={{ paddingLeft: "10rem", paddingRight: "10rem" }}
    >
      <CRow className="g-4">
        <CCol lg={6} md={12}>
          <CCard className="h-100">
            <CCardHeader>pre-IB</CCardHeader>
            <CCardBody className="p-4">
              <CChartBar
                data={{
                  labels: subjectNames[3]?.map((item) => item.subject_name),
                  datasets: [
                    {
                      label: "Homework Average",
                      backgroundColor: "#f87979",
                      data: homeworkAverage[3]?.homeworkAverageMarks,
                      stack: "Stack 0",
                    },
                    {
                      label: "Test Average",
                      backgroundColor: "#0D9CFC",
                      data: examAverage[3]?.examAverageMarks,
                      stack: "Stack 1",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                  },
                  scales: {
                    x: {
                      stacked: true,
                    },
                  },
                }}
                style={{ height: "300px" }}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6} md={12}>
          <CCard className="h-100">
            <CCardHeader>Grade 11</CCardHeader>
            <CCardBody className="p-4">
              <CChartBar
                data={{
                  labels: subjectNames[1]?.map((item) => item.subject_name),
                  datasets: [
                    {
                      label: "Homework Average",
                      backgroundColor: "#f87979",
                      data: homeworkAverage[1]?.homeworkAverageMarks,
                      stack: "Stack 0",
                    },
                    {
                      label: "Test Average",
                      backgroundColor: "#0D9CFC",
                      data: examAverage[1]?.examAverageMarks,
                      stack: "Stack 1",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                  },
                  scales: {
                    x: {
                      stacked: true,
                    },
                  },
                }}
                style={{ height: "300px" }}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6} md={12}>
          <CCard className="h-100">
            <CCardHeader>Grade 12</CCardHeader>
            <CCardBody className="p-4">
              <CChartBar
                data={{
                  labels: subjectNames[2]?.map((item) => item.subject_name),
                  datasets: [
                    {
                      label: "Homework Average",
                      backgroundColor: "#f87979",
                      data: homeworkAverage[2]?.homeworkAverageMarks,
                      stack: "Stack 0",
                    },
                    {
                      label: "Test Average",
                      backgroundColor: "#0D9CFC",
                      data: examAverage[2]?.examAverageMarks,
                      stack: "Stack 1",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                  },
                  scales: {
                    x: {
                      stacked: true,
                    },
                  },
                }}
                style={{ height: "300px" }}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6} md={6}>
          <CCard className="h-100">
            <CCardHeader>Attendance</CCardHeader>
            <CCardBody className="p-4">
              <CChartDoughnut
                data={{
                  labels: ["present", "absent", "late", "excused", "recorded"],
                  datasets: [
                    {
                      backgroundColor: [
                        "#E5FBE9",
                        "#F7E3E2",
                        "#FBF9C9",
                        "#E0EAFC",
                        "#F1E9FD",
                      ],
                      data: attendanceInfo?.map((item) => item.count),
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
                style={{ height: "300px" }}
              />
            </CCardBody>
          </CCard>
        </CCol>
        {/* <CCol lg={6} md={6}>
          <CCard className="h-100">
            <CCardHeader>Homework Submission</CCardHeader>
            <CCardBody className="p-4">
              <CChartPie
                data={{
                  labels: ['Submitted', 'Not Submitted'],
                  datasets: [
                    {
                      data: [300, 50],
                      backgroundColor: ['#20C178', '#FF6384'],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
                style={{ height: '300px' }}
              />
            </CCardBody>
          </CCard>
        </CCol> */}
      </CRow>
    </CContainer>
  );
};

export default AdminDashboardPage;
