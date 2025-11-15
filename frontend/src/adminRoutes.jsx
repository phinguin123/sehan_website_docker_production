import React from "react";

const Dashboard = React.lazy(() => import("./Pages/AdminDashboardPage"));

// homework
const HomeworkCreate = React.lazy(() => import("./Pages/AdminHomeworkCreatePage"));
const HomeworkGrade = React.lazy(() => import("./Pages/AdminHomeworkGradePage"));
const AttendanceInfo = React.lazy(() => import("./Pages/AdminAttendancePage"));
const AttendanceCode = React.lazy(() => import("./Pages/AdminAttendanceCodePage"));
const TimetableSettings = React.lazy(() => import("./Pages/AdminTimetableSettingsPage"));
const StudentSettings = React.lazy(() => import("./Pages/AdminStudentSettingsPage"));
const TeacherSettings = React.lazy(() => import("./Pages/AdminTeacherSettingsPage"));
const ParentSettings = React.lazy(() => import("./Pages/AdminParentSettingsPage"));
const ParentStudentSettings = React.lazy(() => import("./Pages/AdminParentStudentPage"));
const StudentManualSettings = React.lazy(() => import("./Pages/AdminStudentManualSettingsPage"));
const ReportComments = React.lazy(() => import("./Pages/AdminStudentCommentsPage"));
const ReportGenerate = React.lazy(() => import("./Pages/AdminReportGenerate"));
const StudentScoresTable = React.lazy(() => import("./Pages/admin/StudentScoresTable"));
const Config = React.lazy(() => import("./Pages/admin/AdminSettingPage"));

// Private Tutoring
const TutorDashboard = React.lazy(() => import("./pages/private-tutoring/Dashboard"));
const PTStudentManager = React.lazy(() => import("./pages/private-tutoring/StudentManager"));
const PTSessionManager = React.lazy(() => import("./pages/private-tutoring/SessionManager"));
const PTScheduleManager = React.lazy(() => import("./pages/private-tutoring/ScheduleManager"));
const PTReports = React.lazy(() => import("./pages/private-tutoring/Reports"));
const PTSessions = React.lazy(() => import("./pages/private-tutoring/Sessions"));

const adminRoutes = [
  // { path: '/', exact: true, name: 'Home' },
  { 
    path: "/dashboard", 
    name: "Dashboard", 
    element: Dashboard 
  },
  { 
    path: "/homework/create", 
    name: "HomeworkCreate", 
    element: HomeworkCreate 
  },
  { 
    path: "/homework/grade", 
    name: "HomeworkGrade", 
    element: HomeworkGrade 
  },
  {
    path: "/attendance/info",
    name: "AttendanceInformation",
    element: AttendanceInfo,
  },
  { 
    path: "/attendance/code", 
    name: "AttendanceCode", 
    element: AttendanceCode 
  },
  {
    path: "/settings/timetable",
    name: "TimetableSettings",
    element: TimetableSettings,
  },
  {
    path: "/settings/students",
    name: "StudentSettings",
    element: StudentSettings,
  },
  {
    path: "/settings/teachers",
    name: "TeacherSettings",
    element: TeacherSettings,
  },
  {
    path: "/settings/parents",
    name: "ParentSettings",
    element: ParentSettings,
  },
  {
    path: "/settings/manual-student",
    name: "StudentManualSettings",
    element: StudentManualSettings,
  },
  {
    path: "/settings/parent-student",
    name: "ParentStudentSettings",
    element: ParentStudentSettings,
  },
  { path: "/report/comments", 
    name: "ReportComments", 
    element: ReportComments 
  },
  {
    path: "/report/management",
    name: "ReportGenerate",
    element: ReportGenerate,
  },
  { 
    path: "/scores", 
    name: "StudentScoresTable", 
    element: StudentScoresTable 
  },
  { 
    path: "/settings/config", 
    name: "Config", element: Config 
  },
  
  // Private Tutoring Routes
  { 
    path: "/private-tutoring/dashboard", 
    name: "TutorDashboard", 
    element: TutorDashboard 
  },
  { 
    path: "/private-tutoring/students", 
    name: "PTStudentManager", 
    element: PTStudentManager 
  },
  { 
    path: "/private-tutoring/sessions", 
    name: "PTSessions", 
    element: PTSessions 
  },
  { 
    path: "/private-tutoring/session-manager", 
    name: "PTSessionManager", 
    element: PTSessionManager 
  },
  { 
    path: "/private-tutoring/schedule", 
    name: "PTScheduleManager", 
    element: PTScheduleManager 
  },
  { 
    path: "/private-tutoring/reports", 
    name: "PTReports", 
    element: PTReports 
  },
];

export default adminRoutes;
