import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BarChart from '@/components/charts/BarChart';
import DoughnutChart from '@/components/charts/DoughnutChart';
import instance from "@/apis/axiosInstance";

// Mock data for testing/development
const MOCK_DATA = {
  subjectNames: {
    3: [ // pre-IB
      { subject_name: "English" },
      { subject_name: "Math" },
      { subject_name: "Science" },
      { subject_name: "Korean" },
      { subject_name: "CompSci" },
    ],
    1: [ // Grade 11
      { subject_name: "English A" },
      { subject_name: "Math AA" },
      { subject_name: "Physics" },
      { subject_name: "Chemistry" },
      { subject_name: "Economics" },
      { subject_name: "Korean A" },
    ],
    2: [ // Grade 12
      { subject_name: "English A" },
      { subject_name: "Math AA" },
      { subject_name: "Biology" },
      { subject_name: "Chemistry" },
      { subject_name: "CompSci" },
      { subject_name: "Korean A" },
    ],
    4: [ // MYP
      { subject_name: "English" },
      { subject_name: "Math" },
      { subject_name: "Science" },
      { subject_name: "Individuals" },
      { subject_name: "Arts" },
    ],
  },
  homeworkAverage: {
    3: { homeworkAverageMarks: [85, 78, 82, 88, 75] },
    1: { homeworkAverageMarks: [82, 76, 79, 84, 81, 86] },
    2: { homeworkAverageMarks: [88, 85, 83, 87, 84, 89] },
    4: { homeworkAverageMarks: [80, 75, 78, 82, 77] },
  },
  examAverage: {
    3: { examAverageMarks: [82, 80, 85, 86, 78] },
    1: { examAverageMarks: [79, 82, 83, 81, 78, 84] },
    2: { examAverageMarks: [86, 88, 85, 89, 82, 87] },
    4: { examAverageMarks: [78, 81, 80, 85, 79] },
  },
  attendanceInfo: [
    { status: "Present", count: 245 },
    { status: "Absent", count: 12 },
    { status: "Late", count: 18 },
    { status: "Excused", count: 8 },
  ],
};

const AdminDashboardPage = () => {
  // Set to true to use mock data for testing/development
  const USE_MOCK_DATA = true;

  const [subjectNames, setSubjectNames] = useState(MOCK_DATA.subjectNames);
  const [homeworkAverage, setHomeworkAverage] = useState(MOCK_DATA.homeworkAverage);
  const [examAverage, setExamAverage] = useState(MOCK_DATA.examAverage);
  const [attendanceInfo, setAttendanceInfo] = useState(MOCK_DATA.attendanceInfo);

  useEffect(() => {
    // Skip API calls if using mock data
    if (USE_MOCK_DATA) {
      return;
    }

    fetchAttendanceInfo();
    fetchSubjectNames(3);
    fetchSubjectNames(1);
    fetchSubjectNames(2);
    fetchSubjectNames(4);
    fetchHomeworkAverage(3);
    fetchHomeworkAverage(1);
    fetchHomeworkAverage(2);
    fetchHomeworkAverage(4);
    fetchExamAverage(3);
    fetchExamAverage(1);
    fetchExamAverage(2);
    fetchExamAverage(4);
  }, [USE_MOCK_DATA]);

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

  // Transform data for Recharts BarChart
  const transformBarChartData = (gradeID) => {
    const subjects = subjectNames[gradeID] || [];
    const homeworkMarks = homeworkAverage[gradeID]?.homeworkAverageMarks || [];
    const examMarks = examAverage[gradeID]?.examAverageMarks || [];

    return subjects.map((subject, index) => ({
      name: subject.subject_name,
      "Homework Average": homeworkMarks[index] || 0,
      "Test Average": examMarks[index] || 0,
    }));
  };

  // Transform data for Recharts DoughnutChart
  const transformDoughnutData = () => {
    return attendanceInfo.map((item) => ({
      name: item.status || item.name,
      value: item.count,
    }));
  };

  return (
    <div className="container mx-auto px-6 lg:px-40">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>pre-IB</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BarChart
                data={transformBarChartData(3)}
                dataKeys={["Homework Average", "Test Average"]}
                colors={["#8b5cf6", "#06b6d4"]}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Grade 11</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BarChart
                data={transformBarChartData(1)}
                dataKeys={["Homework Average", "Test Average"]}
                colors={["#8b5cf6", "#06b6d4"]}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Grade 12</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BarChart
                data={transformBarChartData(2)}
                dataKeys={["Homework Average", "Test Average"]}
                colors={["#8b5cf6", "#06b6d4"]}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>MYP</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BarChart
                data={transformBarChartData(4)}
                dataKeys={["Homework Average", "Test Average"]}
                colors={["#8b5cf6", "#06b6d4"]}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DoughnutChart
                data={transformDoughnutData()}
                colors={[
                  "#10b981",
                  "#ef4444",
                  "#f59e0b",
                  "#3b82f6",
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
        {/* <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Homework Submission</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <DoughnutChart
                data={[
                  { name: 'Submitted', value: 300 },
                  { name: 'Not Submitted', value: 50 }
                ]}
                colors={['#20C178', '#FF6384']}
                height={300}
              />
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
