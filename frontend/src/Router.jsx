import { Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import React, { lazy, Suspense } from "react";

// Small, always-present components (keep as normal imports)
import NavigationBar from "./components/NavigationBar";
import SimpleSidebar from "./components/SideBar";
import PrivateRoutes from "./components/PrivateRoutes";
import ParentPrivateRoutes from "./components/ParentPrivateRoutes";
import PrivateTutoringPrivateRoutes from "./components/PrivateTutoringPrivateRoutes";
import RandomNumberGenerator from "./components/RandomNumberGenerator";
import ZoomRedirection from "./components/ZoomRedirection";
import Logout from "./components/Logout";

// LAZY IMPORTS for heavy/page components
const Homepage = lazy(() => import("./Pages/Homepage"));
const LoginPage = lazy(() => import("./Pages/LoginPage"));
const StudentGradesPage = lazy(() => import("./Pages/StudentGradesPage"));
const AttendancePage = lazy(() => import("./Pages/AttendancePage"));
const HomeworkPage = lazy(() => import("./Pages/HomeworkPage"));
const SetupNamePage = lazy(() => import("./Pages/SetupNamePage"));
const AdminLayout = lazy(() => import("./layout/AdminLayout"));
const AdminLoginPage = lazy(() => import("./Pages/AdminLoginPage"));
const ParentDashboardPage = lazy(() => import("./Pages/ParentDashboardPage"));
const ParentLoginPage = lazy(() => import("./Pages/ParentLoginPage"));
const ParentSelectChildPage = lazy(() => import("./Pages/ParentSelectChildPage"));
const ParentReportPage = lazy(() => import("./Pages/ParentReportPage"));
const Redirection = lazy(() => import("@/components/Redirection"));

// Private Tutoring Components
const PrivateTutoringLayout = lazy(() => import("./layout/PrivateTutoringLayout"));
const PTLoginPage = lazy(() => import("./pages/private-tutoring/LoginPage"));
const PTDashboard = lazy(() => import("./pages/private-tutoring/Dashboard"));
const PTStudentManager = lazy(() => import("./pages/private-tutoring/StudentManager"));
const PTTeacherManager = lazy(() => import("./pages/private-tutoring/TeacherManager"));
const PTSessionManager = lazy(() => import("./pages/private-tutoring/SessionManager"));
// const PTScheduleManager = lazy(() => import("./pages/private-tutoring/ScheduleManager"));
const PTReports = lazy(() => import("./pages/private-tutoring/Reports"));
const PTExampleReport = lazy(() => import("./pages/private-tutoring/ExampleReport"));
const PTCompleteSession = lazy(() => import("./pages/private-tutoring/CompleteSession"));
const PTSessions = lazy(() => import("./pages/private-tutoring/Sessions"));
const AboutPhinguin = lazy(() => import("./pages/2025/winter/about"));

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
  "/private-tutoring",
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
    !location.pathname.startsWith("/private-tutoring") &&
    !location.pathname.startsWith("/parent") &&
    !location.pathname.startsWith("/2025");

  return (
    <>
      {showNavBar && <NavigationBar />}
      <Routes>
        <Route
          path="/secure-sehan-admin/login"
          element={
            <SuspenseWrapper>
              <AdminLoginPage />
            </SuspenseWrapper>
          }
        />
        {/* Admin routes */}
        <Route
          path="/secure-sehan-admin/*"
          element={
            <SuspenseWrapper>
              <AdminLayout />
            </SuspenseWrapper>
          }
        >

          {/* Add more admin routes here, lazy as needed */}
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

        {/* Private Tutoring Login */}
        <Route
          path="/private-tutoring/login"
          element={
            <SuspenseWrapper>
              <PTLoginPage />
            </SuspenseWrapper>
          }
        />

        {/* Private Tutoring routes */}
        <Route path="/private-tutoring/*" element={<Outlet />}>
          <Route element={<PrivateTutoringPrivateRoutes />}>
            <Route
              path="*"
              element={
                <SuspenseWrapper>
                  <PrivateTutoringLayout />
                </SuspenseWrapper>
              }
            >
              <Route path="dashboard" element={<SuspenseWrapper><PTDashboard /></SuspenseWrapper>} />
              <Route path="students" element={<SuspenseWrapper><PTStudentManager /></SuspenseWrapper>} />
              <Route path="teachers" element={<SuspenseWrapper><PTTeacherManager /></SuspenseWrapper>} />
              {/* Sessions list/history */}
              <Route path="sessions" element={<SuspenseWrapper><PTSessions /></SuspenseWrapper>} />
              {/* Session Manager (builder) */}
              <Route path="session-manager" element={<SuspenseWrapper><PTSessionManager /></SuspenseWrapper>} />
              {/* Schedule tab removed - sessions managed via Session Manager */}
              <Route path="complete-session" element={<SuspenseWrapper><PTCompleteSession /></SuspenseWrapper>} />
              <Route path="reports" element={<SuspenseWrapper><PTReports /></SuspenseWrapper>} />
              <Route path="example-report" element={<SuspenseWrapper><PTExampleReport /></SuspenseWrapper>} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
        </Route>

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
                <Route path="/oauth/zoom" element={<ZoomRedirection />} />
                <Route
                  path="/login"
                  element={
                    <SuspenseWrapper>
                      <LoginPage />
                    </SuspenseWrapper>
                  }
                />
                <Route path="/logout" element={<Logout />} />
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
