import { useEffect, useState } from "react";
import { Download, Eye, Plus, Settings, Trash2, Wallet } from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Select from "../components/common/Select";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Table from "../components/common/Table";
import DateRangePicker from "../components/common/DateRangePicker";
import {
  formatCurrency,
  formatDate,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./reports.css";

const monthOptions = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const getReportPeriodLabel = (report) => {
  if (report.report_filter_type === "date_range") {
    return `${formatDate(report.from_date)} to ${formatDate(report.to_date)}`;
  }

  const monthName =
    monthOptions.find((item) => Number(item.value) === Number(report.report_month))
      ?.label || "-";

  return `${monthName} ${report.report_year || ""}`;
};

const Reports = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();
  const isWelfareReport = !branchId;

  const [error, setError] = useState("");
  const [openingBalance, setOpeningBalance] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportData, setReportData] = useState(null);

  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [savingOpening, setSavingOpening] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [openingForm, setOpeningForm] = useState({
    openingBalance: "",
    openingDate: "",
    note: "",
  });

  const [reportForm, setReportForm] = useState({
    filterType: "month",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    fromDate: "",
    toDate: "",
  });

  const currentYear = new Date().getFullYear();

  const yearOptions = Array.from({ length: 6 }, (_, index) => {
    const year = currentYear - index;

    return {
      label: String(year),
      value: String(year),
    };
  });

  const fetchOpeningBalance = async () => {
    try {
      const url = isWelfareReport
        ? "/reports/welfare/opening-balance"
        : `/reports/vocational/opening-balance?branchId=${branchId}`;

      const response = await axiosInstance.get(url);
      const data = response.data.data;

      setOpeningBalance(data);

      if (data) {
        setOpeningForm({
          openingBalance: data.opening_balance || "",
          openingDate: data.opening_date?.split("T")[0] || "",
          note: data.note || "",
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch opening balance");
    }
  };

  const fetchReports = async () => {
    try {
      const query = new URLSearchParams();

      query.append("portalType", isWelfareReport ? "welfare" : "vocational");

      if (!isWelfareReport) {
        query.append("branchId", branchId);
      }

      const response = await axiosInstance.get(
        `/reports/monthly/saved?${query.toString()}`
      );

      setReports(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch reports");
    }
  };

  useEffect(() => {
    fetchOpeningBalance();
    fetchReports();
  }, [branchId]);

  const handleOpeningChange = (event) => {
    const { name, value } = event.target;

    setOpeningForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReportChange = (event) => {
    const { name, value } = event.target;

    setReportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReportFilterTypeChange = (filterType) => {
    const nextForm = {
      ...reportForm,
      filterType,
    };

    setReportForm(nextForm);
    setReportData(null);

    if (filterType === "month") {
      setTimeout(() => previewCalculation(nextForm), 0);
    }
  };

  const saveOpeningBalance = async () => {
    try {
      setSavingOpening(true);
      setError("");

      const url = isWelfareReport
        ? "/reports/welfare/opening-balance"
        : "/reports/vocational/opening-balance";

      const payload = isWelfareReport
        ? {
          openingBalance: Number(openingForm.openingBalance || 0),
          openingDate: openingForm.openingDate,
          note: openingForm.note || null,
        }
        : {
          branchId: Number(branchId),
          openingBalance: Number(openingForm.openingBalance || 0),
          openingDate: openingForm.openingDate,
          note: openingForm.note || null,
        };

      await axiosInstance.put(url, payload);

      setIsOpeningModalOpen(false);
      await fetchOpeningBalance();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save opening balance");
    } finally {
      setSavingOpening(false);
    }
  };

  const previewCalculation = async (nextForm = reportForm) => {
    try {
      setError("");

      const query = new URLSearchParams();

      if (!isWelfareReport) {
        query.append("branchId", branchId);
      }

      query.append("reportFilterType", nextForm.filterType);

      if (nextForm.filterType === "date_range") {
        if (!nextForm.fromDate || !nextForm.toDate) {
          setReportData(null);
          return;
        }

        query.append("fromDate", nextForm.fromDate);
        query.append("toDate", nextForm.toDate);
      } else {
        query.append("month", nextForm.month);
        query.append("year", nextForm.year);
      }

      const url = isWelfareReport
        ? `/reports/welfare/monthly?${query.toString()}`
        : `/reports/vocational/monthly?${query.toString()}`;

      const response = await axiosInstance.get(url);

      setReportData(response.data.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to calculate report");
    }
  };

  const openGenerateModal = async () => {
    setReportData(null);
    setIsReportModalOpen(true);

    setTimeout(() => {
      previewCalculation();
    }, 0);
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);

      const payload = {
        portalType: isWelfareReport ? "welfare" : "vocational",
        branchId: isWelfareReport ? null : Number(branchId),
        reportFilterType: reportForm.filterType,
      };

      if (reportForm.filterType === "date_range") {
        if (!reportForm.fromDate || !reportForm.toDate) {
          alert("Please select from date and to date.");
          return;
        }

        payload.fromDate = reportForm.fromDate;
        payload.toDate = reportForm.toDate;
      } else {
        payload.month = Number(reportForm.month);
        payload.year = Number(reportForm.year);
      }

      await axiosInstance.post("/reports/monthly/saved", payload);

      setIsReportModalOpen(false);
      setReportData(null);
      await fetchReports();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };



  const previewReport = async (report) => {
    try {
      const response = await axiosInstance.get(
        `/reports/monthly/saved/${report.id}/preview`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to preview report");
    }
  };

  const downloadReport = async (report) => {
    try {
      const response = await axiosInstance.get(
        `/reports/monthly/saved/${report.id}/download`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = blobUrl;
      link.setAttribute("download", `${report.report_no}.pdf`);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to download report");
    }
  };

  const deleteReport = async (report) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete report ${report.report_no}?`
    );

    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/reports/monthly/saved/${report.id}`);
      fetchReports();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete report");
    }
  };

  const columns = [
    {
      key: "report_month",
      title: "Report Month",
      render: (row) => (
        <div>
          <strong>{getReportPeriodLabel(row)}</strong>
          <span className="table-subtext">{row.report_no}</span>
        </div>
      ),
    },
    {
      key: "generated_by_name",
      title: "Generated By",
      render: (row) => row.generated_by_name || "-",
    },
    {
      key: "generated_at",
      title: "Generated Date",
      render: (row) => formatDate(row.generated_at),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="certificate-action-buttons">
          <button
            type="button"
            className="certificate-icon-btn certificate-preview-btn"
            onClick={() => previewReport(row)}
            title="Preview"
          >
            <Eye size={15} />
          </button>

          <button
            type="button"
            className="certificate-icon-btn certificate-download-btn"
            onClick={() => downloadReport(row)}
            title="Download"
          >
            <Download size={15} />
          </button>

          <button
            type="button"
            className="certificate-icon-btn certificate-delete-btn"
            onClick={() => deleteReport(row)}
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            {isWelfareReport
              ? "Generate welfare monthly reports."
              : `Generate reports for ${branchName || "selected branch"}.`}
          </p>
        </div>

        <div className="reports-header-actions">
          <Button variant="secondary" onClick={() => setIsOpeningModalOpen(true)}>
            <Settings size={16} />
            {openingBalance ? "Edit Opening Balance" : "Set Opening Balance"}
          </Button>

          <Button onClick={openGenerateModal}>
            <Plus size={16} /> Generate Report
          </Button>
        </div>
      </div>

      {error && <div className="reports-error">{error}</div>}

      <Card className="reports-main-card">
        <div className="reports-main-content">
          <div className="report-summary-card">
            <Wallet size={24} />
            <div>
              <p>Opening Balance</p>
              <h2>
                {openingBalance
                  ? formatCurrency(openingBalance.opening_balance)
                  : "Not Set"}
              </h2>
            </div>
          </div>
        </div>
      </Card>

      <Card className="reports-main-card">
        <Table
          columns={columns}
          data={reports}
          emptyText="No reports found"
        />
      </Card>

      <Modal
        open={isOpeningModalOpen}
        title={openingBalance ? "Edit Opening Balance" : "Set Opening Balance"}
        onClose={() => setIsOpeningModalOpen(false)}
      >
        <div className="reports-modal-grid">
          <Input
            label="Opening Balance"
            name="openingBalance"
            type="number"
            value={openingForm.openingBalance}
            onChange={handleOpeningChange}
            required
          />

          <Input
            label="Opening Date"
            name="openingDate"
            type="date"
            value={openingForm.openingDate}
            onChange={handleOpeningChange}
            required
          />

          <Input
            label="Note"
            name="note"
            value={openingForm.note}
            onChange={handleOpeningChange}
          />
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setIsOpeningModalOpen(false)}>
            Cancel
          </Button>

          <Button onClick={saveOpeningBalance} loading={savingOpening}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        open={isReportModalOpen}
        title={isWelfareReport ? "Generate Welfare Report" : "Generate Vocational Report"}
        onClose={() => setIsReportModalOpen(false)}
      >
<div className="report-filter-type">
  <button
    type="button"
    className={reportForm.filterType === "month" ? "active" : ""}
    onClick={() => handleReportFilterTypeChange("month")}
  >
    Month Wise
  </button>

  <button
    type="button"
    className={reportForm.filterType === "date_range" ? "active" : ""}
    onClick={() => handleReportFilterTypeChange("date_range")}
  >
    Date Range
  </button>
</div>

{reportForm.filterType === "month" ? (
  <div className="reports-modal-grid">
    <Select
      label="Month"
      name="month"
      value={reportForm.month}
      onChange={(event) => {
        const nextForm = {
          ...reportForm,
          [event.target.name]: event.target.value,
        };

        setReportForm(nextForm);
        previewCalculation(nextForm);
      }}
      options={monthOptions}
      required
    />

    <Select
      label="Year"
      name="year"
      value={reportForm.year}
      onChange={(event) => {
        const nextForm = {
          ...reportForm,
          [event.target.name]: event.target.value,
        };

        setReportForm(nextForm);
        previewCalculation(nextForm);
      }}
      options={yearOptions}
      required
    />
  </div>
) : (
  <div className="reports-date-range-row">
    <DateRangePicker
      fromDate={reportForm.fromDate}
      toDate={reportForm.toDate}
      onChange={({ fromDate, toDate }) => {
        const nextForm = {
          ...reportForm,
          fromDate,
          toDate,
        };

        setReportForm(nextForm);
        previewCalculation(nextForm);
      }}
    />
  </div>
)}

        <div className="report-result-grid">
          <div>
            <span>Previous Balance</span>
            <strong>{formatCurrency(reportData?.previousBalance)}</strong>
          </div>

          {isWelfareReport ? (
            <>
              <div>
                <span>Donations</span>
                <strong>{formatCurrency(reportData?.donations)}</strong>
              </div>

              <div>
                <span>Charity</span>
                <strong>{formatCurrency(reportData?.charity)}</strong>
              </div>

              <div>
                <span>Expenses</span>
                <strong>{formatCurrency(reportData?.expenses)}</strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span>Collected Fees</span>
                <strong>{formatCurrency(reportData?.collectedFees)}</strong>
              </div>

              <div>
                <span>Expenses</span>
                <strong>{formatCurrency(reportData?.expenses)}</strong>
              </div>
            </>
          )}

          <div className="report-current-balance">
            <span>Current Balance</span>
            <strong>{formatCurrency(reportData?.currentBalance)}</strong>
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>
            Cancel
          </Button>

          <Button onClick={generateReport} loading={generatingReport}>
            Generate Report
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;