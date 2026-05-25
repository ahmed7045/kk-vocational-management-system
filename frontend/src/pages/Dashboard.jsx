import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Plus,
  Users,
  UserCheck,
  Clock,
  // Receipt,
  // TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import {
  // formatCurrency,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const todayText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(
        `/dashboard/overview?branchId=${branchId || ""}`
      );

      setDashboardData(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [branchId]);

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="page">
        <div className="dashboard-error">
          <p>{error}</p>
          <Button onClick={fetchDashboard}>Try Again</Button>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const revenueAnalytics = dashboardData?.revenueAnalytics || [];
  const expenseAnalytics = dashboardData?.expenseAnalytics || [];
  const coursePopularity = dashboardData?.coursePopularity || [];

  const statCards = [
    {
      title: "Add Student",
      value: "New",
      icon: Plus,
      type: "info",
      route: "/app/students?openAdd=true",
    },
    {
      title: "Total Students",
      value: summary.totalStudents || 0,
      icon: Users,
      type: "info",
      route: "/app/students",
    },
    {
      title: "Paid Students",
      value: summary.paidStudents || 0,
      icon: UserCheck,
      type: "success",
      route: "/app/students?feeStatus=paid",
    },
    {
      title: "Pending Students",
      value: summary.pendingStudents || 0,
      icon: Clock,
      type: "warning",
      route: "/app/students?feeStatus=pending",
    },
    // {
    //   title: "Monthly Expenses",
    //   value: formatCurrency(summary.monthlyExpenses),
    //   icon: Receipt,
    //   type: "danger",
    //   route: "/app/expenses",
    // },
    // {
    //   title: "Monthly Balance",
    //   value: formatCurrency(summary.monthlyBalance),
    //   icon: TrendingUp,
    //   type: summary.monthlyBalance >= 0 ? "success" : "danger",
    //   route: "/app/reports",
    // },
  ];

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div className="dashboard-welcome-header">
          <div>
            <h1>Welcome back, {user?.fullName || user?.full_name || "User"}</h1>
            <p>{todayText}</p>
          </div>
        </div>
        {/* <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview for {branchName || "All Branches"}
          </p>
        </div> */}

        {/* <Button variant="secondary" onClick={fetchDashboard}>
          <RefreshCcw size={16} /> Refresh
        </Button> */}
      </div>

      <div className="dashboard-stats-grid">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="dashboard-click-card"
              onClick={() => navigate(item.route)}
            >
              <div className="stat-card">
                <div className={`stat-icon stat-${item.type}`}>
                  <Icon size={24} />
                </div>

                <div>
                  <p>{item.title}</p>
                  <h2>{item.value}</h2>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="dashboard-grid-2">
        <Card title="Revenue Analytics" subtitle="Last 6 months revenue">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueAnalytics}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Expense Analytics" subtitle="Last 6 months expenses">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={expenseAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  strokeWidth={3}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid-2 single">
        <Card title="Course Popularity" subtitle="Top enrolled courses">
          <div className="course-list">
            {coursePopularity.length === 0 ? (
              <p className="empty-text">No course data found</p>
            ) : (
              coursePopularity.map((course) => (
                <div
                  className="course-row dashboard-click-row"
                  key={course.id}
                  onClick={() => navigate("/app/courses")}
                >
                  <div>
                    <strong>{course.courseName}</strong>
                    <span>{course.totalStudents} students</span>
                  </div>

                  <Badge type="info">{course.totalStudents}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;