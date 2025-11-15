import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import instance from "../apis/AxiosInterceptor";

const statusOptions = [
  { value: "reset", label: "-", color: "" },
  { value: "present", label: "Present", color: "bg-green-100" },
  { value: "late", label: "Late", color: "bg-yellow-100" },
  { value: "absent", label: "Absent", color: "bg-red-100" },
  { value: "excused", label: "Excused", color: "bg-blue-100" },
  { value: "recorded", label: "Recorded", color: "bg-purple-100" },
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const grades = [
  { name: "Grade 11", id: "1" },
  { name: "Grade 12", id: "2" },
  { name: "pre-IB", id: "3" },
];
const modes = [
  { mode_id: 1, mode_name: "Online" },
  { mode_id: 2, mode_name: "Offline" },
];

const getKSTDate = (daysToAdd = 0) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60000 + daysToAdd * 24 * 60 * 60 * 1000);

  return kst.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export default function AttendanceComponent() {
  const [selectedDate, setSelectedDate] = useState(getKSTDate());
  // const [timeSlots, setTimeSlots] = useState([]);
  // const [timetables, setTimetables] = useState({});
  // const [students, setStudents] = useState([]);
  const tableRef = useRef(null);
  const [activeGrade, setActiveGrade] = useState("1");
  const [allTimetables, setAllTimetables] = useState({});
  const [attendanceData, setAttendanceData] = useState(null);
  const [modeID, setModeID] = useState("1");

  const fetchAttendanceData = async (selectedDate, activeGrade) => {
    const response = await instance.get("/api/attendance/daily", {
      params: {
        grade_id: activeGrade,
        attendance_date: selectedDate,
        mode_id: modeID,
      },
    });
    console.log("attendance data", response.data);
    setAttendanceData(response.data);
  };

  useEffect(() => {
    // fetchTimeTablesData();
    // fetchStudents(activeGrade);
    // fetchAttendance(selectedDate);
    fetchAttendanceData(selectedDate, activeGrade);
  }, [selectedDate, activeGrade, modeID]);

  // const fetchTimeTablesData = async () => {
  //   try {
  //     const response = await instance.get("/api/timetable", {
  //       params: { grade_id: activeGrade, mode_id: modeID },
  //     });
  //     console.log("received timetable response:", response.data);
  //     setAllTimetables(response.data);
  //     setTimeSlots(response.data[activeGrade].timeSlots);
  //     setTimetables(response.data[activeGrade].timetables);
  //   } catch (error) {
  //     console.error("Error fetching timetables:", error);
  //   }
  // };

  // const fetchStudents = async (activeGradeId) => {
  //   try {
  //     const response = await instance.get(
  //       `${import.meta.env.VITE_API_BASE_URL}/api/student/getList`,
  //       { withCredentials: true }
  //     );
  //     console.log("received students response:", response.data);
  //     console.log("activeGrade", activeGrade);

  //     const filteredStudents = response.data.filter((student) => {
  //       const gradeId = getGradeId(student.grade); // Map grade name to ID
  //       console.log("grade id", gradeId);
  //       return gradeId === activeGradeId;
  //     });
  //     console.log("filtered students", filteredStudents);
  //     setStudents(filteredStudents);
  //   } catch (error) {
  //     console.error("Error fetching students:", error);
  //   }
  // };

  const getGradeId = (gradeName) => {
    const gradeMap = {
      11: "1",
      12: "2",
      "pre-IB": "3",
    };
    return gradeMap[gradeName] || null; // Return null if no match
  };

  const transformAttendanceData = (data, date) => {
    const attendance = { [date]: {} };

    data.forEach(({ student_id, subject_name, status }) => {
      if (!attendance[date][student_id]) {
        attendance[date][student_id] = {};
      }
      attendance[date][student_id][`${subject_name}_${student_id}`] = status;
    });

    return attendance;
  };

  // const fetchAttendance = async (date) => {
  //   try {
  //     const response = await instance.get(
  //       `${import.meta.env.VITE_API_BASE_URL}/api/get-attendance`,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         params: { attendance_date: date },
  //         withCredentials: true,
  //       }
  //     );
  //     console.log("attendance data", response.data);
  //     const transformedData = transformAttendanceData(response.data, date);

  //     // Update attendance state with the transformed data
  //     setAttendance((prev) => ({
  //       ...prev,
  //       ...transformedData,
  //     }));
  //     // setStudents(response.data)
  //   } catch (error) {
  //     console.error("Error fetching students:", error);
  //   }
  // };

  const handleStatusChange = async (
    studentId,
    subjectName,
    status,
    classId
  ) => {
    try {
      const response = await instance.post("/api/student/submit-attendance", {
        student_id: studentId,
        status: status,
        attendance_date: selectedDate,
        subject_name: subjectName,
        timetable_id: classId,
      });
      window.alert("attendance changed successfully.");
    } catch (error) {
      console.error("Error changing attendance:", error);
      window.alert("There was an error changing the attendance.");
    }

    // when manually changing status, refetch the attendance data
    fetchAttendanceData(selectedDate, activeGrade);

    // console.log("attendance", attendance);

    // setAttendanceData((prev) => ({
    //   ...prev,
    //   [selectedDate]: {
    //     ...prev[selectedDate],
    //     [studentId]: {
    //       ...prev[selectedDate]?.[studentId],
    //       [`${classId}`]: status,
    //     },
    //   },
    // }));
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleGradeChange = (value) => {
    setActiveGrade(value);
  };

  const handleModeIDChange = (value) => setModeID(value);

  // const getDayFromDate = (dateString) => {
  //   const date = new Date(dateString)
  //   return daysOfWeek[date.getDay()]
  // }
  const getDayFromDate = (date) => {
    // Create a date object from the input date
    const dateObj = new Date(date);

    // Convert the date to Korean time (Asia/Seoul)
    const options = { timeZone: "Asia/Seoul", weekday: "long" };
    const formatter = new Intl.DateTimeFormat("en-US", options); // Use 'en-US' for English

    // Format the date to get the day of the week in English
    const day = formatter.format(dateObj);

    return day;
  };

  if (!attendanceData) return <div>Loading...</div>;

  const { timeSlots, timetables, students } = attendanceData;
  const dayOfWeek = getDayFromDate(selectedDate); // e.g. "Monday"
  const dayTimetable = timetables.find((t) => t.day === dayOfWeek) || {
    day: dayOfWeek,
    timeSlots: [],
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <label className="mr-2 font-medium">Mode:</label>
        <Select value={modeID} onValueChange={handleModeIDChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {modes.map((m) => (
              <SelectItem key={m.mode_id} value={String(m.mode_id)}>
                {m.mode_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance for {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="date-select">Select Date</Label>
            <Input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full md:w-auto"
            />
          </div>
          <Tabs value={activeGrade} onValueChange={handleGradeChange}>
            <TabsList>
              {grades.map((grade) => (
                <TabsTrigger key={grade.id} value={grade.id}>
                  {grade.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="overflow-x-auto" ref={tableRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10">
                    Student
                  </TableHead>
                  {timeSlots.map((slot) => (
                    <TableHead
                      key={slot.time_slot_id}
                      className="sticky top-0 bg-white z-10"
                    >
                      {slot.start_time} - {slot.end_time}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="sticky left-0 bg-white z-10">
                      {student.name}
                      {/* {student.duplicate && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({student.duplicate})
                        </span>
                      )} */}
                    </TableCell>
                    {timeSlots.map((slot) => {
                      // Find timetable entries for this time slot on this day
                      const slotObj = dayTimetable.timeSlots.find(
                        (ts) => ts.time_slot_id === slot.time_slot_id
                      );
                      if (!slotObj)
                        return <TableCell key={slot.time_slot_id}>-</TableCell>;
                      return (
                        <TableCell key={slot.time_slot_id}>
                          {slotObj.entries.map((classInfo) => {
                            // Only show if student takes this subject/level
                            const subject = student.subjects.find(
                              (subj) =>
                                subj.subject_name === classInfo.subject_name &&
                                (String(subj.level_id) ===
                                  String(classInfo.level_id) ||
                                  classInfo.level_id === "3")
                            );

                            if (!subject) return null;

                            // Attendance status for this timetable_id
                            const status = subject.status || "";
                            console.log(
                              "status for student",
                              status,
                              student.name,
                              subject
                            );

                            return (
                              <div key={classInfo.timetable_id}>
                                <strong>
                                  {classInfo.subject_name} (
                                  {classInfo.level_name})
                                </strong>
                                <Select
                                  value={status || ""}
                                  onValueChange={(value) =>
                                    handleStatusChange(
                                      student.student_id,
                                      classInfo.subject_name,
                                      value,
                                      classInfo.timetable_id
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={`w-[150px] ${
                                      statusOptions.find(
                                        (s) => s.value === status || ""
                                      )?.color || ""
                                    }`}
                                  >
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                          {/* If no classes for this student in this slot */}
                          {slotObj.entries.every(
                            (classInfo) =>
                              !student.subjects.some(
                                (subj) =>
                                  subj.subject_name ===
                                    classInfo.subject_name &&
                                  (subj.level_id === classInfo.level_id ||
                                    classInfo.level_id === "3")
                              )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
