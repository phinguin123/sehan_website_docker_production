import React from "react";

const Dashboard = React.lazy(() => import("@/pages/admin/AdminDashboardPage"));

// homework
const HomeworkCreate = React.lazy(() => import("@/pages/admin/AdminHomeworkCreatePage"));
const HomeworkGrade = React.lazy(() => import("@/pages/admin/AdminHomeworkGradePage"));
const AttendanceInfo = React.lazy(() => import("@/pages/admin/AdminAttendancePage"));
const AttendanceCode = React.lazy(() => import("@/pages/admin/AdminAttendanceCodePage"));
const TimetableSettings = React.lazy(() => import("@/pages/admin/AdminTimetableSettingsPage"));
const StudentSettings = React.lazy(() => import("@/pages/admin/AdminStudentSettingsPage"));
const TeacherSettings = React.lazy(() => import("@/pages/admin/AdminTeacherSettingsPage"));
const ParentSettings = React.lazy(() => import("@/pages/admin/AdminParentSettingsPage"));
const ParentStudentSettings = React.lazy(() => import("@/pages/admin/AdminParentStudentPage"));
const StudentManualSettings = React.lazy(() => import("@/pages/admin/AdminStudentManualSettingsPage"));
const ReportComments = React.lazy(() => import("@/pages/admin/AdminStudentCommentsPage"));
const ReportGenerate = React.lazy(() => import("@/pages/admin/AdminReportGenerate"));
const StudentScoresTable = React.lazy(() => import("@/pages/admin/StudentScoresTable"));
const Config = React.lazy(() => import("@/pages/admin/AdminSettingPage"));

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
];

export default adminRoutes;
