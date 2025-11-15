import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarIcon,
  BookOpenIcon,
  GraduationCapIcon,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SubjectCarousel from "../components/SubjectCarousel";
import instance from "../apis/AxiosInterceptor";
import SubmissionRate from "../components/SubmissionRate";
import { useNavigate, Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 10;

const initialChildren = [
  {
    name: "Alice Doe",
    subjects: [
      { name: "Math", score: 85 },
      { name: "Science", score: 92 },
      { name: "English", score: 78 },
      { name: "History", score: 88 },
    ],
    notStartedHomework: [
      { subject: "Math", dueDate: "2024-11-15" },
      { subject: "Science", dueDate: "2024-11-16" },
      { subject: "History", dueDate: "2024-11-18" },
    ],
    pendingHomework: [
      { subject: "English", submittedDate: "2024-11-10" },
      { subject: "Math", submittedDate: "2024-11-11" },
    ],
    submissionRate: 75,
    attendanceRate: 95,
    homeworkSubmitted: 15,
    homeworkNotSubmitted: 5,
  },
  {
    name: "Bob Doe",
    subjects: [
      { name: "Math", score: 79 },
      { name: "Science", score: 88 },
      { name: "English", score: 90 },
      { name: "History", score: 82 },
    ],
    notStartedHomework: [
      { subject: "Science", dueDate: "2024-11-17" },
      { subject: "History", dueDate: "2024-11-19" },
    ],
    pendingHomework: [
      { subject: "Math", submittedDate: "2024-11-09" },
      { subject: "English", submittedDate: "2024-11-12" },
    ],
    submissionRate: 90,
    attendanceRate: 98,
    homeworkSubmitted: 18,
    homeworkNotSubmitted: 2,
  },
];

const groupHomeworkBySubject = (homeworks) => {
  return homeworks.reduce((acc, homework) => {
    if (!acc[homework.subject]) {
      acc[homework.subject] = [];
    }
    acc[homework.subject].push(homework);
    return acc;
  }, {});
};

const HomeworkList = ({ homeworks }) => {
  const [selectedSubject, setSelectedSubject] = useState("all");
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const current_kst = new Date(utc + 9 * 60 * 60000);
  // const dueDateObj = new Date(homeworkItem.dueDate);
  // const daysLeft = Math.ceil((dueDateObj - current_kst) / (1000 * 60 * 60 * 24));

  const subjects = ["all", ...new Set(homeworks.map((hw) => hw.subject_name))];
  console.log("subjects", subjects);

  const filteredHomeworks =
    selectedSubject === "all"
      ? homeworks
      : homeworks.filter((hw) => hw.subject === selectedSubject);

  return (
    <div>
      <div className="mb-4">
        <Select onValueChange={setSelectedSubject} defaultValue="all">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject_name) => (
              <SelectItem key={subject_name} value={subject_name}>
                {subject_name.charAt(0).toUpperCase() + subject_name.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {filteredHomeworks.map((hw) => {
            const dueDateObj = new Date(hw.dueDate);
            const daysLeft = Math.ceil(
              (dueDateObj - current_kst) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={hw.id}
                className="flex items-center p-4 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#333",
                      marginBottom: "2.5%",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {hw.title} ({hw.subject_name})
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      color: daysLeft > 1 ? "#28a745" : "#d9534f", // Green if days left, red if due today
                      fontFamily: "Noto Sans KR Bold",
                    }}
                  >
                    D-{daysLeft}
                  </div>
                </div>
                {hw.status === "notStarted" ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default function ParentDashboardPage() {
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(initialChildren[0]);
  const [activeHomeworkTab, setActiveHomeworkTab] = useState("notStarted");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/logout", { state: { from: window.location.pathname } });
  };

  useEffect(() => {
    fetchChildList();
  }, []);

  const fetchChildList = async () => {
    try {
      const response = await instance.get("/api/parent/getChildList");
      const childrenData = response.data;
      console.log("childrenData", childrenData);
      setChildren(childrenData);

      const updatedChildrenData = await Promise.all(
        childrenData.map(async (child) => {
          const [submissionRate, attendanceRate, notStartedHomework] =
            await Promise.all([
              fetchSubmissionRate(child),
              fetchAttendanceRate(child),
              fetchNotStartedHomework(child),
              // fetchHomeworkStats(child.id)
            ]);
          return {
            ...child,
            submissionRate,
            attendanceRate,
            notStartedHomework,
            // ...homeworkStats
          };
        })
      );
      console.log("updatedChildrenData", updatedChildrenData);
      setChildren(updatedChildrenData);
      setActiveChild(updatedChildrenData[0].name);
    } catch (error) {
      if (error.response) {
        // Display the backend error message using alert
        alert(error.response.data.error || "An unexpected error occurred.");
      } else {
        // Handle client-side or network errors
        alert("Failed to connect to the server. Please try again.");
      }
    }
  };

  const fetchNotStartedHomework = async (child) => {
    try {
      const response = await instance.get(
        `/api/students/${child.student_id}/homework`,
        {
          params: {
            subject_ids: "all", // Fetch all subjects
            status: "pending",
          },
        }
      );

      console.log("not started homework", response.data);
      setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
      return response.data;
    } catch (error) {
      console.error("Error fetching not started homework:", error);
    }
  };

  const fetchSubmissionRate = async (child) => {
    try {
      console.log("child_id", child.student_id);
      const response = await instance.get("/api/student/homeworkRate", {
        withCredentials: true,
        params: {
          student_id: child.student_id,
        },
      });
      console.log("received homework rate response:", response.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching homework rate:", error);
    }
  };

  const fetchAttendanceRate = async (child) => {
    try {
      const response = await instance.get("/api/student/attendanceRate", {
        params: {
          student_id: child.student_id,
        },
      });
      console.log("received attendance rate response:", response.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching attendance rate:", error);
    }
  };

  return (
    <div className="w-full mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <Link
          to="/parent/report"
          className="hover:text-blue-500 hover:bg-white px-6 py-2 text-lg"
        >
          Report
        </Link>
        <Button
          variant="ghost"
          className="hover:text-pink-500 hover:bg-white px-6 py-2 text-lg"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
      <Tabs value={activeChild} onValueChange={setActiveChild}>
        <TabsList className="grid w-full grid-cols-5 lg:w-1/2 overflow-x-auto">
          {children.map((child) => (
            <TabsTrigger
              className="whitespace-nowrap overflow-hidden text-ellipsis justify-start"
              key={child.name}
              value={child.name}
            >
              {child.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {children.map((child) => (
          <TabsContent key={child.name} value={child.name}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <CardTitle>{child.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Homework Average</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <SubjectCarousel customParam={child.student_id} />
                        {/* <BarChart data={child.subjects}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="score" fill="#8884d8" />
                        </BarChart> */}
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-7 w-7 text-muted-foreground" />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: "80%",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <p className="text-lg font-medium">Attendance Rate</p>
                          <SubmissionRate
                            submissionRate={child.attendanceRate}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpenIcon className="h-7 w-7 text-muted-foreground" />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: "80%",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <p className="text-lg font-medium">
                            Homework Submission
                          </p>
                          <SubmissionRate
                            submissionRate={child.submissionRate}
                          />
                        </div>
                      </div>
                      {/* <div className="flex items-center space-x-2">
                        <GraduationCapIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Average Score</p>
                          <p className="text-2xl font-bold">
                            {Math.round(child.subjects.reduce((acc, subject) => acc + subject.score, 0) / child.subjects.length)}%
                          </p>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Homework Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <HomeworkList homeworks={child.notStartedHomework} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
