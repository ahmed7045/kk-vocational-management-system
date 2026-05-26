import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./layout.css";

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;