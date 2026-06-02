import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Users,
  Wallet,
  HeartHandshake,
} from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Select from "../components/common/Select";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Loader from "../components/common/Loader";
import {
  formatCurrency,
  formatDate,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./reports.css";

const Reports = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const selectedPortal = localStorage.getItem("selectedPortal") || "vocational";
  const isWelfarePortal = selectedPortal === "welfare";

  const [activeTab, setActiveTab] = useState(
    isWelfarePortal ? "financial" : "students"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [studentReport, setStudentReport] = useState([]);
  const [financialReport, setFinancialReport] = useState(null);
  const [welfareReport, setWelfareReport] = useState(null);

  const [filters, setFilters] = useState({
    feeStatus: "",
    studentStatus: "",
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const buildQuery = (type) => {
    const params = new URLSearchParams();

    if (type !== "welfare" && branchId) {
      params.append("branchId", branchId);
    }


    if (type === "students") {
      if (filters.feeStatus) {
        params.append("feeStatus", filters.feeStatus);
      }

      if (filters.studentStatus) {
        params.append("studentStatus", filters.studentStatus);
      }
    }

    return params.toString();
  };

  const fetchStudentReport = async () => {
    const query = buildQuery("students");
    const response = await axiosInstance.get(`/reports/students?${query}`);
    setStudentReport(response.data.data || []);
  };

  const fetchFinancialReport = async () => {
    const query = buildQuery("financial");

    if (isWelfarePortal) {
      const response = await axiosInstance.get(`/reports/welfare?${query}`);
      const welfareData = response.data.data;

      setFinancialReport({
        summary: {
          totalRevenue: welfareData?.summary?.totalDonations || 0,
          totalExpenses: welfareData?.summary?.totalApprovedSupport || 0,
          profit: welfareData?.summary?.balanceAfterApprovedSupport || 0,
        },
        payments: welfareData?.donations || [],
        expenses: welfareData?.applications || [],
      });

      return;
    }

    const response = await axiosInstance.get(`/reports/financial?${query}`);
    setFinancialReport(response.data.data);
  };

  const fetchWelfareReport = async () => {
    const query = buildQuery("welfare");
    const response = await axiosInstance.get(`/reports/welfare?${query}`);
    setWelfareReport(response.data.data);
  };

  const fetchActiveReport = async () => {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "students") {
        await fetchStudentReport();
      }

      if (activeTab === "financial") {
        await fetchFinancialReport();
      }

      if (activeTab === "welfare") {
        await fetchWelfareReport();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveReport();
  }, [
    activeTab,
    branchId,
    filters.fromDate,
    filters.studentStatus,
  ]);

  const downloadFile = async (url, filename) => {
    try {
      const response = await axiosInstance.get(url, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to download file");
    }
  };

  const handleExport = (format) => {
    const query = buildQuery(activeTab);

    const extension = format === "pdf" ? "pdf" : "xlsx";
    const filename = `${activeTab}_report.${extension}`;

    let exportUrl = `/reports/${activeTab}/export/${format}?${query}`;

    if (isWelfarePortal && activeTab === "financial") {
      exportUrl = `/reports/welfare/financial/export/${format}?${query}`;
    }

    downloadFile(exportUrl, filename);
  };

  const studentColumns = [
    {
      key: "full_name",
      title: "Student",
      render: (row) => (
        <div>
          <strong>{row.full_name}</strong>
          <span className="table-subtext">{row.father_name || "-"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (row) => row.phone || "-",
    },
    {
      key: "branch_name",
      title: "Branch",
      render: (row) => row.branch_name || "-",
    },
    {
      key: "courses",
      title: "Courses",
      render: (row) =>
        Array.isArray(row.courses) ? row.courses.join(", ") : "-",
    },
    {
      key: "fee_status",
      title: "Fee Status",
      render: (row) => (
        <Badge type={row.fee_status === "paid" ? "success" : "danger"}>
          {row.fee_status}
        </Badge>
      ),
    },
    {
      key: "student_status",
      title: "Status",
      render: (row) => (
        <Badge type={row.student_status === "active" ? "success" : "warning"}>
          {row.student_status}
        </Badge>
      ),
    },
    {
      key: "total_fee",
      title: "Total",
      render: (row) => formatCurrency(row.total_fee),
    },
    {
      key: "paid_fee",
      title: "Paid",
      render: (row) => formatCurrency(row.paid_fee),
    },
    {
      key: "remaining_fee",
      title: "Remaining",
      render: (row) => formatCurrency(row.remaining_fee),
    },
  ];


  const expenseColumns = [
    {
      key: "title",
      title: "Expense",
      render: (row) => row.title || row.name || "-",
    },
    {
      key: "category_name",
      title: "Category",
      render: (row) => row.category_name || "-",
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "expense_date",
      title: "Date",
      render: (row) => formatDate(row.expense_date || row.date),
    },
  ];

  const donationColumns = [
    {
      key: "donor_name",
      title: "Donor",
      render: (row) => row.donor_name || "-",
    },
    {
      key: "charity_name",
      title: "Charity",
      render: (row) => row.charity_name || "-",
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "donation_date",
      title: "Date",
      render: (row) => formatDate(row.donation_date),
    },
  ];

  const welfareApplicationColumns = [
    {
      key: "applicant_name",
      title: "Applicant",
      render: (row) => (
        <div>
          <strong>{row.applicant_name}</strong>
          <span className="table-subtext">{row.phone || "-"}</span>
        </div>
      ),
    },
    {
      key: "support_type",
      title: "Support",
      render: (row) => row.support_type || "-",
    },
    {
      key: "requested_amount",
      title: "Requested",
      render: (row) => formatCurrency(row.requested_amount),
    },
    {
      key: "approved_amount",
      title: "Approved",
      render: (row) => formatCurrency(row.approved_amount),
    },
    {
      key: "case_status",
      title: "Status",
      render: (row) => (
        <Badge
          type={
            row.case_status === "approved"
              ? "success"
              : row.case_status === "rejected"
                ? "danger"
                : "warning"
          }
        >
          {row.case_status}
        </Badge>
      ),
    },
  ];

  const totalStudents = studentReport.length;

  const totalFee = studentReport.reduce(
    (sum, student) => sum + Number(student.total_fee || 0),
    0
  );

  const totalPaid = studentReport.reduce(
    (sum, student) => sum + Number(student.paid_fee || 0),
    0
  );

  const totalRemaining = studentReport.reduce(
    (sum, student) => sum + Number(student.remaining_fee || 0),
    0
  );

  return (
    <div className="page reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Generate reports for {branchName || "selected branch"}.
          </p>
        </div>

        <div className="reports-header-actions">
          {/* <Button variant="secondary" onClick={fetchActiveReport}>
            <RefreshCcw size={16} /> Refresh
          </Button> */}

          <Button variant="secondary" onClick={() => handleExport("pdf")}>
            <Download size={16} /> PDF
          </Button>

          <Button onClick={() => handleExport("excel")}>
            <Download size={16} /> Excel
          </Button>
        </div>
      </div>

      <div className="reports-tabs">

        <div className="reports-tabs-left">
          {!isWelfarePortal && (
            <button
              className={activeTab === "students" ? "active" : ""}
              onClick={() => setActiveTab("students")}
            >
              <Users size={16} /> Student Report
            </button>
          )}

          {!isWelfarePortal && (
            <button
              className={activeTab === "financial" ? "active" : ""}
              onClick={() => setActiveTab("financial")}
            >
              <Wallet size={16} /> Financial Report
            </button>
          )}
          
        </div>


        <div className="reports-tabs-right">

          <Card className="reports-filter-card">
            <div className="reports-filter-bar">
              {activeTab === "students" && (
                <>
                  <Select
                    name="feeStatus"
                    value={filters.feeStatus}
                    onChange={handleFilterChange}
                    placeholder="Fee status"
                    options={[
                      { label: "All Fee Status", value: "" },
                      { label: "Paid", value: "paid" },
                      { label: "Pending", value: "pending" },
                    ]}
                  />

                  <Select
                    name="studentStatus"
                    value={filters.studentStatus}
                    onChange={handleFilterChange}
                    placeholder="Student status"
                    options={[
                      { label: "All Student Status", value: "" },
                      { label: "Active", value: "active" },
                      { label: "Non Active", value: "non_active" },

                    ]}
                  />
                </>
              )}



              {/* <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button> */}
            </div>
          </Card>

        </div>

      </div>

      {error && <div className="reports-error">{error}</div>}

      {loading ? (
        <Card>
          <Loader text="Loading report..." />
        </Card>
      ) : (
        <>
          {activeTab === "students" && (
            <>
              <Card title="Student Report">
                <Table
                  columns={studentColumns}
                  data={studentReport}
                  emptyText="No student report data found"
                />
              </Card>
            </>
          )}

          {activeTab === "financial" && (
            <>

              <div className="reports-grid-2 single ">
                <Card
                  title={
                    isWelfarePortal ? "Approved / Support Cases" : "Expenses"
                  }
                >
                  <Table
                    columns={
                      isWelfarePortal
                        ? welfareApplicationColumns
                        : expenseColumns
                    }
                    data={financialReport?.expenses || []}
                    emptyText={
                      isWelfarePortal
                        ? "No welfare support records found"
                        : "No expense records found"
                    }
                  />
                </Card>
              </div>
            </>
          )}

          {activeTab === "welfare" && (
            <>
              <div className="reports-summary-grid">
                <Card>
                  <div className="report-summary-card">
                    <HeartHandshake size={24} />
                    <div>
                      <p>Total Donations</p>
                      <h2>
                        {formatCurrency(welfareReport?.summary?.totalDonations)}
                      </h2>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="report-summary-card success">
                    <HeartHandshake size={24} />
                    <div>
                      <p>Approved Support</p>
                      <h2>
                        {formatCurrency(
                          welfareReport?.summary?.totalApprovedSupport
                        )}
                      </h2>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="report-summary-card">
                    <HeartHandshake size={24} />
                    <div>
                      <p>Balance After Support</p>
                      <h2>
                        {formatCurrency(
                          welfareReport?.summary?.balanceAfterApprovedSupport
                        )}
                      </h2>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="report-summary-card">
                    <HeartHandshake size={24} />
                    <div>
                      <p>Total Applications</p>
                      <h2>{welfareReport?.summary?.totalApplications || 0}</h2>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="reports-grid-2">
                <Card title="Donations">
                  <Table
                    columns={donationColumns}
                    data={welfareReport?.donations || []}
                    emptyText="No donation records found"
                  />
                </Card>

                <Card title="Applications">
                  <Table
                    columns={welfareApplicationColumns}
                    data={welfareReport?.applications || []}
                    emptyText="No welfare applications found"
                  />
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;