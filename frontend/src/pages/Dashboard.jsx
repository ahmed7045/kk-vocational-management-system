import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Clock,
  Wallet,
  Receipt,
  TrendingUp,
  RefreshCcw,
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
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import { formatCurrency, getSelectedBranchId, getSelectedBranchName } from "../utils/formatters";
import "./dashboard.css";

const Dashboard = () => {
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
  }, []);

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
  const recentPayments = dashboardData?.recentPayments || [];
  const revenueAnalytics = dashboardData?.revenueAnalytics || [];
  const expenseAnalytics = dashboardData?.expenseAnalytics || [];
  const coursePopularity = dashboardData?.coursePopularity || [];

  const statCards = [
    {
      title: "Total Students",
      value: summary.totalStudents || 0,
      icon: Users,
      type: "info",
    },
    {
      title: "Paid Students",
      value: summary.paidStudents || 0,
      icon: UserCheck,
      type: "success",
    },
    {
      title: "Pending Students",
      value: summary.pendingStudents || 0,
      icon: Clock,
      type: "warning",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(summary.monthlyRevenue),
      icon: Wallet,
      type: "success",
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(summary.monthlyExpenses),
      icon: Receipt,
      type: "danger",
    },
    {
      title: "Monthly Balance",
      value: formatCurrency(summary.monthlyBalance),
      icon: TrendingUp,
      type: summary.monthlyBalance >= 0 ? "success" : "danger",
    },
  ];

  const paymentColumns = [
    {
      key: "student_name",
      title: "Student",
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "payment_method",
      title: "Method",
      render: (row) => row.payment_method || "-",
    },
    {
      key: "payment_date",
      title: "Date",
      render: (row) =>
        row.payment_date
          ? new Date(row.payment_date).toLocaleDateString("en-GB")
          : "-",
    },
  ];

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview for {branchName || "All Branches"}
          </p>
        </div>

        <Button variant="secondary" onClick={fetchDashboard}>
          <RefreshCcw size={16} /> Refresh
        </Button>
      </div>

      <div className="dashboard-stats-grid">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
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

      <div className="dashboard-grid-2">
        <Card title="Recent Payments" subtitle="Latest fee transactions">
          <Table
            columns={paymentColumns}
            data={recentPayments}
            emptyText="No recent payments found"
          />
        </Card>

        <Card title="Course Popularity" subtitle="Top enrolled courses">
          <div className="course-list">
            {coursePopularity.length === 0 ? (
              <p className="empty-text">No course data found</p>
            ) : (
              coursePopularity.map((course) => (
                <div className="course-row" key={course.id}>
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