import { Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import React, { lazy, Suspense } from "react";

// Small, always-present components (keep as normal imports)
import NavigationBar from "./components/layout/NavigationBar";
import SimpleSidebar from "./components/layout/SideBar";
import PrivateRoutes from "./components/routes/PrivateRoutes";
import AdminPrivateRoutes from "./components/routes/AdminPrivateRoutes";
import ParentPrivateRoutes from "./components/routes/ParentPrivateRoutes";
import RandomNumberGenerator from "./components/common/RandomNumberGenerator";
import ZoomRedirection from "./components/routes/ZoomRedirection";
import Logout from "./components/routes/Logout";

// LAZY IMPORTS for heavy/page components
// Student Pages
const Homepage = lazy(() => import("./pages/student/Homepage"));
const StudentGradesPage = lazy(() => import("./pages/student/StudentGradesPage"));
const AttendancePage = lazy(() => import("./pages/student/AttendancePage"));
const HomeworkPage = lazy(() => import("./pages/student/HomeworkPage"));
const SetupNamePage = lazy(() => import("./pages/student/SetupNamePage"));

// Public Pages
const LoginPage = lazy(() => import("./pages/public/LoginPage"));
const SecretPage_v02 = lazy(() => import("./pages/public/SecretPage_v02"));

// Layouts
const ShadcnLayout = lazy(() => import("./components/layout/ShadcnLayout"));

// Admin Pages
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminHomeworkCreatePage = lazy(() => import("./pages/admin/AdminHomeworkCreatePage"));
const AdminHomeworkGradePage = lazy(() => import("./pages/admin/AdminHomeworkGradePage"));
const AdminAttendancePage = lazy(() => import("./pages/admin/AdminAttendancePage"));
const AdminAttendanceCodePage = lazy(() => import("./pages/admin/AdminAttendanceCodePage"));
const AdminTimetableSettingsPage = lazy(() => import("./pages/admin/AdminTimetableSettingsPage"));
const AdminStudentSettingsPage = lazy(() => import("./pages/admin/AdminStudentSettingsPage"));
const AdminTeacherSettingsPage = lazy(() => import("./pages/admin/AdminTeacherSettingsPage"));
const AdminParentSettingsPage = lazy(() => import("./pages/admin/AdminParentSettingsPage"));
const AdminParentStudentPage = lazy(() => import("./pages/admin/AdminParentStudentPage"));
const AdminStudentManualSettingsPage = lazy(() => import("./pages/admin/AdminStudentManualSettingsPage"));
const AdminStudentCommentsPage = lazy(() => import("./pages/admin/AdminStudentCommentsPage"));
const AdminReportGenerate = lazy(() => import("./pages/admin/AdminReportGenerate"));
const StudentScoresTable = lazy(() => import("./pages/admin/StudentScoresTable"));
const AdminSettingPage = lazy(() => import("./pages/admin/AdminSettingPage"));

// Parent Pages
const ParentDashboardPage = lazy(() => import("./pages/parent/ParentDashboardPage"));
const ParentLoginPage = lazy(() => import("./pages/parent/ParentLoginPage"));
const ParentSelectChildPage = lazy(() => import("./pages/parent/ParentSelectChildPage"));
const ParentReportPage = lazy(() => import("./pages/parent/ParentReportPage"));

// Marketing & Other
const Redirection = lazy(() => import("@/components/routes/Redirection"));
const AboutPhinguin = lazy(() => import("./pages/marketing/2025/winter/about"));

import styled from "styled-components";

const Center = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
`;

const noBarsRoutes = [
  "/login",
  "/oauth",
  "/oauth/zoom",
  "/set-name",
  "/secure-sehan-admin",
];

function MainLayout({ children }) {
  const location = useLocation();
  return (
    <Center>
      {!noBarsRoutes.includes(location.pathname) && <SimpleSidebar />}
      <RandomNumberGenerator>{children}</RandomNumberGenerator>
    </Center>
  );
}

// Suspense wrapper for all lazy-loaded page content
function SuspenseWrapper({ children }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}

const Router = () => {
  const location = useLocation();
  const showNavBar =
    !noBarsRoutes.includes(location.pathname) &&
    !location.pathname.startsWith("/secure-sehan-admin") &&
    !location.pathname.startsWith("/parent") &&
    !location.pathname.startsWith("/2025");

  return (
    <>
      {showNavBar && <NavigationBar />}
      <Routes>

        {/* PUBLIC ADMIN ROUTE (Login) */}
        <Route
          path="/secure-sehan-admin/login"
          element={
            <SuspenseWrapper>
              <AdminLoginPage />
            </SuspenseWrapper>
          }
        />


        {/* PROTECTED ADMIN ROUTES */}
        {/* Step 1: Wrap everything in the Layout */}
        <Route
          path="/secure-sehan-admin/*"
          element={
            <SuspenseWrapper>
              <ShadcnLayout />
            </SuspenseWrapper>
          }
        >
          {/* Step 2: Wrap the protected children in the Guard */}
          <Route element={<AdminPrivateRoutes />}>
            <Route
              path="dashboard"
              element={
                <SuspenseWrapper>
                  <AdminDashboardPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="homework/create"
              element={
                <SuspenseWrapper>
                  <AdminHomeworkCreatePage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="homework/grade"
              element={
                <SuspenseWrapper>
                  <AdminHomeworkGradePage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="attendance/info"
              element={
                <SuspenseWrapper>
                  <AdminAttendancePage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="attendance/code"
              element={
                <SuspenseWrapper>
                  <AdminAttendanceCodePage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="scores"
              element={
                <SuspenseWrapper>
                  <StudentScoresTable />
                </SuspenseWrapper>
              }
            />
            <Route
              path="settings/timetable"
              element={
                <SuspenseWrapper>
                  <AdminTimetableSettingsPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="settings/students"
              element={
                <SuspenseWrapper>
                  <AdminStudentSettingsPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="settings/teachers"
              element={
                <SuspenseWrapper>
                  <AdminTeacherSettingsPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="settings/parents"
              element={
                <SuspenseWrapper>
                  <AdminParentSettingsPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="settings/parent-student"
              element={
                <SuspenseWrapper>
                  <AdminParentStudentPage />
                </SuspenseWrapper>
              }
            />
            {/* <Route
              path="settings/manual-student"
              element={
                <SuspenseWrapper>
                  <AdminStudentManualSettingsPage />
                </SuspenseWrapper>
              }
            /> */}
            <Route
              path="settings/config"
              element={
                <SuspenseWrapper>
                  <AdminSettingPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="report/comments"
              element={
                <SuspenseWrapper>
                  <AdminStudentCommentsPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="report/management"
              element={
                <SuspenseWrapper>
                  <AdminReportGenerate />
                </SuspenseWrapper>
              }
            />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* About Phinguin */}
        <Route 
          path="/2025/winter/phinguin" 
          element={
            <SuspenseWrapper>
              <AboutPhinguin />
            </SuspenseWrapper>
          } 
        />

        {/* Parent routes */}
        <Route path="/parent/*" element={<Outlet />}>
          <Route element={<ParentPrivateRoutes />}>
            <Route
              path="dashboard"
              element={
                <SuspenseWrapper>
                  <ParentDashboardPage />
                </SuspenseWrapper>
              }
            />
            <Route
              path="report"
              element={
                <SuspenseWrapper>
                  <ParentReportPage />
                </SuspenseWrapper>
              }
            />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          <Route
            path="login"
            element={
              <SuspenseWrapper>
                <ParentLoginPage />
              </SuspenseWrapper>
            }
          />
          <Route
            path="set-name"
            element={
              <SuspenseWrapper>
                <ParentSelectChildPage />
              </SuspenseWrapper>
            }
          />
        </Route>

        {/* Main app routes (sidebar + random gen) */}
        <Route
          path="*"
          element={
            <MainLayout>
              <Routes>
                <Route element={<PrivateRoutes />}>
                  <Route
                    path="/"
                    element={
                      <SuspenseWrapper>
                        <Homepage />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="/grades"
                    element={
                      <SuspenseWrapper>
                        <StudentGradesPage />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <SuspenseWrapper>
                        <AttendancePage />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="/homework/:subject"
                    element={
                      <SuspenseWrapper>
                        <HomeworkPage />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="/happy-new-year"
                    element={
                      <SuspenseWrapper>
                        <SecretPage_v02 />
                      </SuspenseWrapper>
                    }
                  />
                </Route>
                {/* Public routes */}
                <Route
                  path="/oauth"
                  element={
                    <SuspenseWrapper>
                      <Redirection />
                    </SuspenseWrapper>
                  }
                />
                <Route 
                  path="/oauth/zoom" 
                  element={
                    <SuspenseWrapper>
                      <ZoomRedirection />
                    </SuspenseWrapper>
                  } 
                />
                <Route
                  path="/login"
                  element={
                    <SuspenseWrapper>
                      <LoginPage />
                    </SuspenseWrapper>
                  }
                />
                <Route 
                  path="/logout" 
                  element={
                    <SuspenseWrapper>
                      <Logout />
                    </SuspenseWrapper>
                  } 
                />
                <Route
                  path="/set-name"
                  element={
                    <SuspenseWrapper>
                      <SetupNamePage />
                    </SuspenseWrapper>
                  }
                />
                {/* Add 404 page here as needed */}
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </>
  );
};

export default Router;
