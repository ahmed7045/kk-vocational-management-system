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
              <BranchSelection />
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
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="employees" element={<Employees />} />
          <Route path="courses" element={<Courses />} />
          <Route path="payments" element={<Payments />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="welfare" element={<WelfareDashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="certificates" element={<Certificates />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;