import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import PortalSelection from "../pages/PortalSelection";
import BranchSelection from "../pages/BranchSelection";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/Students";
import Employees from "../pages/Employees";
import Courses from "../pages/Courses";
import Payments from "../pages/Payments";
import Expenses from "../pages/Expenses";
import WelfareDashboard from "../pages/WelfareDashboard";
import Reports from "../pages/Reports";
import Certificates from "../pages/Certificates";

import ProtectedRoute from "../auth/ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";

const PortalGuard = ({ portal, children }) => {
  const selectedPortal = localStorage.getItem("selectedPortal");

  if (portal && selectedPortal !== portal) {
    return <Navigate to="/portal-selection" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/portal-selection"
          element={
            <ProtectedRoute>
              <PortalSelection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/branch-selection"
          element={
            <ProtectedRoute>
              <PortalGuard portal="vocational">
                <BranchSelection />
              </PortalGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <PortalGuard portal="vocational">
                <Dashboard />
              </PortalGuard>
            }
          />

          <Route
            path="dashboard"
            element={
              <PortalGuard portal="vocational">
                <Dashboard />
              </PortalGuard>
            }
          />

          <Route
            path="students"
            element={
              <PortalGuard portal="vocational">
                <Students
                  defaultStudentStatus="active"
                  pageTitle="Active Students"
                />
              </PortalGuard>
            }
          />

          <Route
            path="students/non-active"
            element={
              <PortalGuard portal="vocational">
                <Students
                  defaultStudentStatus="non_active"
                  pageTitle="Non-Active Students"
                />
              </PortalGuard>
            }
          />

          <Route
            path="employees"
            element={
              <PortalGuard portal="vocational">
                <Employees />
              </PortalGuard>
            }
          />

          <Route
            path="courses"
            element={
              <PortalGuard portal="vocational">
                <Courses />
              </PortalGuard>
            }
          />

          <Route
            path="payments"
            element={
              <PortalGuard portal="vocational">
                <Payments />
              </PortalGuard>
            }
          />

          <Route
            path="certificates"
            element={
              <PortalGuard portal="vocational">
                <Certificates />
              </PortalGuard>
            }
          />

          <Route
            path="welfare"
            element={
              <PortalGuard portal="welfare">
                <WelfareDashboard defaultTab="dashboard" />
              </PortalGuard>
            }
          />

          <Route
            path="welfare/donors"
            element={
              <PortalGuard portal="welfare">
                <WelfareDashboard defaultTab="donors" />
              </PortalGuard>
            }
          />

          <Route
            path="welfare/charities"
            element={
              <PortalGuard portal="welfare">
                <WelfareDashboard defaultTab="charities" />
              </PortalGuard>
            }
          />
          <Route
            path="welfare/charity-records"
            element={
              <PortalGuard portal="welfare">
                <WelfareDashboard defaultTab="charityRecords" />
              </PortalGuard>
            }
          />
          <Route
            path="welfare/donations"
            element={
              <PortalGuard portal="welfare">
                <WelfareDashboard defaultTab="donations" />
              </PortalGuard>
            }
          />

          <Route
            path="welfare/applications"
            element={
              <PortalGuard portal="welfare">
                <WelfareDashboard defaultTab="applications" />
              </PortalGuard>
            }
          />

          <Route path="reports" element={<Reports />} />

          <Route path="expenses" element={<Expenses />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;