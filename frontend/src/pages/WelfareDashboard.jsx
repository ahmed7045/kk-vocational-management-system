import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Users,
  Wallet,
  FileCheck,
  Plus,
  RefreshCcw,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import { useNavigate, useLocation } from "react-router-dom";
import { formatCurrency, formatDate } from "../utils/formatters";

import "./welfare.css";

const WelfareDashboard = ({ defaultTab = "dashboard" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [dashboard, setDashboard] = useState(null);
  const [donors, setDonors] = useState([]);
  const [charities, setCharities] = useState([]);
  const [donations, setDonations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [donationMethods, setDonationMethods] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [donorModalOpen, setDonorModalOpen] = useState(false);
  const [charityModalOpen, setCharityModalOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState("");

  const [donorForm, setDonorForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });

  const [charityForm, setCharityForm] = useState({
    charityName: "",
    charityType: "",
    contactPerson: "",
    phone: "",
    address: "",
    description: "",
  });

  const [donationForm, setDonationForm] = useState({
    donorId: "",
    charityId: "",
    donationMethodId: "",
    amount: "",
    donationDate: "",
    purpose: "",
    note: "",
  });

  const [applicationForm, setApplicationForm] = useState({
    applicantName: "",
    fatherName: "",
    phone: "",
    cnic: "",
    gender: "",
    maritalStatus: "",
    familyMembers: "",
    residenceType: "",
    educationLevel: "",
    monthlyIncome: "",
    monthlyExpense: "",
    supportType: "",
    requestedAmount: "",
    address: "",
    verificationNotes: "",
  });

  const [statusForm, setStatusForm] = useState({
    caseStatus: "approved",
    approvedAmount: "",
    verificationNotes: "",
  });

  // const fetchWelfareData = async () => {
  //   try {
  //     setLoading(true);
  //     setError("");

  //     const [
  //       dashboardRes,
  //       donorsRes,
  //       charitiesRes,
  //       donationsRes,
  //       applicationsRes,
  //       methodsRes,
  //     ] = await Promise.all([
  //       axiosInstance.get("/welfare/dashboard"),
  //       axiosInstance.get("/welfare/donors?page=1&limit=100"),
  //       axiosInstance.get("/welfare/charities?page=1&limit=100"),
  //       axiosInstance.get("/welfare/donations?page=1&limit=100"),
  //       axiosInstance.get("/welfare/applications?page=1&limit=100"),
  //       axiosInstance.get("/welfare/donation-methods"),
  //     ]);

  //     setDashboard(dashboardRes.data.data);
  //     setDonors(donorsRes.data.data || []);
  //     setCharities(charitiesRes.data.data || []);
  //     setDonations(donationsRes.data.data || []);
  //     setApplications(applicationsRes.data.data || []);
  //     setDonationMethods(methodsRes.data.data || []);
  //   } catch (error) {
  //     setError(error.response?.data?.message || "Failed to fetch welfare data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const fetchWelfareData = async () => {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "dashboard") {
        const [dashboardRes, donationsRes, applicationsRes] = await Promise.all([
          axiosInstance.get("/welfare/dashboard"),
          axiosInstance.get("/welfare/donations?page=1&limit=100"),
          axiosInstance.get("/welfare/applications?page=1&limit=100"),
        ]);

        setDashboard(dashboardRes.data.data);
        setDonations(donationsRes.data.data || []);
        setApplications(applicationsRes.data.data || []);
      }

      if (activeTab === "donors") {
        const donorsRes = await axiosInstance.get("/welfare/donors?page=1&limit=100");
        setDonors(donorsRes.data.data || []);
      }

      if (activeTab === "charities") {
        const charitiesRes = await axiosInstance.get("/welfare/charities?page=1&limit=100");
        setCharities(charitiesRes.data.data || []);
      }

      if (activeTab === "donations") {
        const [donationsRes, donorsRes, charitiesRes, methodsRes] =
          await Promise.all([
            axiosInstance.get("/welfare/donations?page=1&limit=100"),
            axiosInstance.get("/welfare/donors?page=1&limit=100"),
            axiosInstance.get("/welfare/charities?page=1&limit=100"),
            axiosInstance.get("/welfare/donation-methods"),
          ]);

        setDonations(donationsRes.data.data || []);
        setDonors(donorsRes.data.data || []);
        setCharities(charitiesRes.data.data || []);
        setDonationMethods(methodsRes.data.data || []);
      }

      if (activeTab === "applications") {
        const applicationsRes = await axiosInstance.get(
          "/welfare/applications?page=1&limit=100"
        );

        setApplications(applicationsRes.data.data || []);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch welfare data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const openModal = location.state?.openModal;

    if (!openModal) return;

    if (openModal === "donation" && defaultTab === "donations") {
      setDonationModalOpen(true);
    }

    if (openModal === "charity" && defaultTab === "charities") {
      setCharityModalOpen(true);
    }

    if (openModal === "application" && defaultTab === "applications") {
      setApplicationModalOpen(true);
    }

    window.history.replaceState({}, document.title);
  }, [location.state, defaultTab]);

  useEffect(() => {
    fetchWelfareData();
  }, [activeTab]);

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;

    setter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createDonor = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await axiosInstance.post("/welfare/donors", donorForm);

      setDonorModalOpen(false);
      setDonorForm({
        fullName: "",
        phone: "",
        email: "",
        address: "",
      });

      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create donor");
    } finally {
      setSaving(false);
    }
  };

  const createCharity = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await axiosInstance.post("/welfare/charities", charityForm);

      setCharityModalOpen(false);
      setCharityForm({
        charityName: "",
        charityType: "",
        contactPerson: "",
        phone: "",
        address: "",
        description: "",
      });

      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create charity");
    } finally {
      setSaving(false);
    }
  };

  const createDonation = async (event) => {
    event.preventDefault();

    if (!donationForm.amount || Number(donationForm.amount) <= 0) {
      alert("Donation amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/welfare/donations", {
        donorId: donationForm.donorId ? Number(donationForm.donorId) : null,
        charityId: donationForm.charityId ? Number(donationForm.charityId) : null,
        donationMethodId: donationForm.donationMethodId
          ? Number(donationForm.donationMethodId)
          : null,
        amount: Number(donationForm.amount),
        donationDate: donationForm.donationDate || null,
        purpose: donationForm.purpose || null,
        note: donationForm.note || null,
      });

      setDonationModalOpen(false);
      setDonationForm({
        donorId: "",
        charityId: "",
        donationMethodId: "",
        amount: "",
        donationDate: "",
        purpose: "",
        note: "",
      });

      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create donation");
    } finally {
      setSaving(false);
    }
  };

  const createApplication = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await axiosInstance.post("/welfare/applications", {
        ...applicationForm,
        familyMembers: Number(applicationForm.familyMembers || 0),
        monthlyIncome: Number(applicationForm.monthlyIncome || 0),
        monthlyExpense: Number(applicationForm.monthlyExpense || 0),
        requestedAmount: Number(applicationForm.requestedAmount || 0),
      });

      setApplicationModalOpen(false);
      setApplicationForm({
        applicantName: "",
        fatherName: "",
        phone: "",
        cnic: "",
        gender: "",
        maritalStatus: "",
        familyMembers: "",
        residenceType: "",
        educationLevel: "",
        monthlyIncome: "",
        monthlyExpense: "",
        supportType: "",
        requestedAmount: "",
        address: "",
        verificationNotes: "",
      });

      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create application");
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (application, status) => {
    setSelectedApplication(application);
    setStatusForm({
      caseStatus: status,
      approvedAmount:
        status === "approved" ? application.requested_amount || "" : "",
      verificationNotes: "",
    });
    setStatusModalOpen(true);
  };

  const updateApplicationStatus = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await axiosInstance.patch(
        `/welfare/applications/${selectedApplication.id}/status`,
        {
          caseStatus: statusForm.caseStatus,
          approvedAmount: statusForm.approvedAmount
            ? Number(statusForm.approvedAmount)
            : 0,
          verificationNotes: statusForm.verificationNotes || null,
        }
      );

      setStatusModalOpen(false);
      setSelectedApplication(null);
      fetchWelfareData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update application");
    } finally {
      setSaving(false);
    }
  };

  const getCaseBadgeType = (status) => {
    if (status === "approved") return "success";
    if (status === "completed") return "info";
    if (status === "rejected") return "danger";
    return "warning";
  };

  const handleQuickAdd = (type) => {
    setQuickAddOpen(false);

    if (type === "donation") {
      navigate("/app/welfare/donations", {
        state: { openModal: "donation" },
      });
    }

    if (type === "charity") {
      navigate("/app/welfare/charities", {
        state: { openModal: "charity" },
      });
    }

    if (type === "application") {
      navigate("/app/welfare/applications", {
        state: { openModal: "application" },
      });
    }
  };

  const donorColumns = [
    {
      key: "full_name",
      title: "Donor",
      render: (row) => (
        <div>
          <strong>{row.full_name}</strong>
          <span className="table-subtext">{row.email || "-"}</span>
        </div>
      ),
    },
    { key: "phone", title: "Phone", render: (row) => row.phone || "-" },
    { key: "address", title: "Address", render: (row) => row.address || "-" },
  ];

  const charityColumns = [
    {
      key: "charity_name",
      title: "Charity",
      render: (row) => (
        <div>
          <strong>{row.charity_name}</strong>
          <span className="table-subtext">{row.charity_type || "-"}</span>
        </div>
      ),
    },
    { key: "contact_person", title: "Contact", render: (row) => row.contact_person || "-" },
    { key: "phone", title: "Phone", render: (row) => row.phone || "-" },
    {
      key: "is_active",
      title: "Status",
      render: (row) => (
        <Badge type={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const donationColumns = [
    { key: "donor_name", title: "Donor", render: (row) => row.donor_name || "-" },
    { key: "charity_name", title: "Charity", render: (row) => row.charity_name || "-" },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
    },
    { key: "donation_method", title: "Method", render: (row) => row.donation_method || "-" },
    { key: "donation_date", title: "Date", render: (row) => formatDate(row.donation_date) },
    { key: "purpose", title: "Purpose", render: (row) => row.purpose || "-" },
  ];

  const applicationColumns = [
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
    { key: "cnic", title: "CNIC", render: (row) => row.cnic || "-" },
    { key: "support_type", title: "Support", render: (row) => row.support_type || "-" },
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
        <Badge type={getCaseBadgeType(row.case_status)}>
          {row.case_status}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="welfare-actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openStatusModal(row, "approved")}
          >
            <CheckCircle size={14} /> Approve
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={() => openStatusModal(row, "rejected")}
          >
            <XCircle size={14} /> Reject
          </Button>
        </div>
      ),
    },
  ];

  const donationByDate = donations.reduce((acc, donation) => {
    const date = donation.donation_date
      ? new Date(donation.donation_date).toLocaleDateString("en-GB")
      : "Unknown";

    const existing = acc.find((item) => item.date === date);

    if (existing) {
      existing.amount += Number(donation.amount || 0);
    } else {
      acc.push({
        date,
        amount: Number(donation.amount || 0),
      });
    }

    return acc;
  }, []);

  const monthlyDonations = donations.reduce((acc, donation) => {
    if (!donation.donation_date) return acc;

    const donationDate = new Date(donation.donation_date);

    const month = donationDate.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

    const existing = acc.find((item) => item.month === month);

    if (existing) {
      existing.amount += Number(donation.amount || 0);
    } else {
      acc.push({
        month,
        amount: Number(donation.amount || 0),
      });
    }

    return acc;
  }, []);

  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading welfare dashboard..." />
      </div>
    );
  }

  return (
    <div className="page welfare-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {activeTab === "dashboard" && "Welfare Dashboard"}
            {activeTab === "donors" && "Donors"}
            {activeTab === "charities" && "Charities"}
            {activeTab === "donations" && "Donations"}
            {activeTab === "applications" && "Welfare Applications"}
          </h1>
          <p className="page-subtitle">
            Manage welfare records, donations, donors, charities and applications.
          </p>
        </div>

        <div className="welfare-header-actions">
          {activeTab === "dashboard" && (
            <div className="quick-add-wrapper">
              <button
                type="button"
                className="quick-add-main-btn"
                onClick={() => setQuickAddOpen((prev) => !prev)}
              >
                <Plus size={16} />
                Add
                <ChevronDown size={15} />
              </button>

              {quickAddOpen && (
                <div className="quick-add-menu">
                  <button type="button" onClick={() => handleQuickAdd("donation")}>
                    Add Donation
                  </button>

                  <button type="button" onClick={() => handleQuickAdd("charity")}>
                    Add Charity
                  </button>

                  <button type="button" onClick={() => handleQuickAdd("application")}>
                    Add Application
                  </button>
                </div>
              )}
            </div>
          )}

          <Button variant="secondary" onClick={fetchWelfareData}>
            <RefreshCcw size={16} /> Refresh
          </Button>
        </div>
      </div>

      {error && <div className="welfare-error">{error}</div>}

      {/* <div className="welfare-tabs">
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </button>
        <button className={activeTab === "donors" ? "active" : ""} onClick={() => setActiveTab("donors")}>
          Donors
        </button>
        <button className={activeTab === "charities" ? "active" : ""} onClick={() => setActiveTab("charities")}>
          Charities
        </button>
        <button className={activeTab === "donations" ? "active" : ""} onClick={() => setActiveTab("donations")}>
          Donations
        </button>
        <button className={activeTab === "applications" ? "active" : ""} onClick={() => setActiveTab("applications")}>
          Applications
        </button>
      </div> */}

      {activeTab === "dashboard" && (
        <>
          <div className="welfare-summary-grid">
            <Card>
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon">
                  <Wallet size={24} />
                </div>
                <div>
                  <p>Total Donations</p>
                  <h2>{formatCurrency(dashboard?.totalDonations)}</h2>
                </div>
              </div>
            </Card>

            <Card>
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon danger">
                  <HeartHandshake size={24} />
                </div>
                <div>
                  <p>Welfare Expenses</p>
                  <h2>{formatCurrency(dashboard?.totalWelfareExpenses)}</h2>
                </div>
              </div>
            </Card>

            <Card>
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon success">
                  <FileCheck size={24} />
                </div>
                <div>
                  <p>Available Balance</p>
                  <h2>{formatCurrency(dashboard?.availableBalance)}</h2>
                </div>
              </div>
            </Card>

            <Card>
              <div className="welfare-summary-card">
                <div className="welfare-summary-icon">
                  <Users size={24} />
                </div>
                <div>
                  <p>Total Cases</p>
                  <h2>{dashboard?.totalCases || 0}</h2>
                </div>
              </div>
            </Card>
          </div>

          <div className="welfare-summary-grid small">
            <Card>
              <div className="welfare-mini-stat">
                <p>Pending Cases</p>
                <h3>{dashboard?.pendingCases || 0}</h3>
              </div>
            </Card>

            <Card>
              <div className="welfare-mini-stat">
                <p>Approved Cases</p>
                <h3>{dashboard?.approvedCases || 0}</h3>
              </div>
            </Card>

            <Card>
              <div className="welfare-mini-stat">
                <p>Lives Touched</p>
                <h3>{dashboard?.livesTouched || 0}</h3>
              </div>
            </Card>

            <Card>
              <div className="welfare-mini-stat">
                <p>Active Grants</p>
                <h3>{dashboard?.activeGrants || 0}</h3>
              </div>
            </Card>
          </div>

          <div className="welfare-graphs-grid">
            <Card title="Donation by Date" subtitle="Daily donation collection">
              <div className="welfare-chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={donationByDate}
                    margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Monthly Donations" subtitle="Donation collection by month">
              <div className="welfare-chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyDonations}
                    margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === "donors" && (
        <Card
          title="Donors"
          subtitle="Manage welfare donors"
          action={<Button onClick={() => setDonorModalOpen(true)}><Plus size={16} /> Add Donor</Button>}
        >
          <Table columns={donorColumns} data={donors} emptyText="No donors found" />
        </Card>
      )}

      {activeTab === "charities" && (
        <Card
          title="Charities"
          subtitle="Manage welfare charities/programs"
          action={<Button onClick={() => setCharityModalOpen(true)}><Plus size={16} /> Add Charity</Button>}
        >
          <Table columns={charityColumns} data={charities} emptyText="No charities found" />
        </Card>
      )}

      {activeTab === "donations" && (
        <Card
          title="Donations"
          subtitle="Manage donation records"
          action={<Button onClick={() => setDonationModalOpen(true)}><Plus size={16} /> Add Donation</Button>}
        >
          <Table columns={donationColumns} data={donations} emptyText="No donations found" />
        </Card>
      )}

      {activeTab === "applications" && (
        <Card
          title="Welfare Applications"
          subtitle="Manage welfare cases and approvals"
          action={<Button onClick={() => setApplicationModalOpen(true)}><Plus size={16} /> Add Application</Button>}
        >
          <Table columns={applicationColumns} data={applications} emptyText="No applications found" />
        </Card>
      )}

      <Modal open={donorModalOpen} title="Add Donor" onClose={() => setDonorModalOpen(false)} size="md">
        <form onSubmit={createDonor}>
          <Input label="Full Name" name="fullName" value={donorForm.fullName} onChange={handleChange(setDonorForm)} required />
          <Input label="Phone" name="phone" value={donorForm.phone} onChange={handleChange(setDonorForm)} />
          <Input label="Email" name="email" type="email" value={donorForm.email} onChange={handleChange(setDonorForm)} />
          <Input label="Address" name="address" value={donorForm.address} onChange={handleChange(setDonorForm)} />

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setDonorModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Donor</Button>
          </div>
        </form>
      </Modal>

      <Modal open={charityModalOpen} title="Add Charity" onClose={() => setCharityModalOpen(false)} size="lg">
        <form onSubmit={createCharity}>
          <div className="welfare-form-grid">
            <Input label="Charity Name" name="charityName" value={charityForm.charityName} onChange={handleChange(setCharityForm)} required />
            <Input label="Charity Type" name="charityType" value={charityForm.charityType} onChange={handleChange(setCharityForm)} />
            <Input label="Contact Person" name="contactPerson" value={charityForm.contactPerson} onChange={handleChange(setCharityForm)} />
            <Input label="Phone" name="phone" value={charityForm.phone} onChange={handleChange(setCharityForm)} />
          </div>

          <Input label="Address" name="address" value={charityForm.address} onChange={handleChange(setCharityForm)} />

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={charityForm.description} onChange={handleChange(setCharityForm)} rows="3" />
          </div>

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setCharityModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Charity</Button>
          </div>
        </form>
      </Modal>

      <Modal open={donationModalOpen} title="Add Donation" onClose={() => setDonationModalOpen(false)} size="lg">
        <form onSubmit={createDonation}>
          <div className="welfare-form-grid">
            <Select
              label="Donor"
              name="donorId"
              value={donationForm.donorId}
              onChange={handleChange(setDonationForm)}
              options={donors.map((donor) => ({ label: donor.full_name, value: donor.id }))}
            />

            <Select
              label="Charity"
              name="charityId"
              value={donationForm.charityId}
              onChange={handleChange(setDonationForm)}
              options={charities.map((charity) => ({ label: charity.charity_name, value: charity.id }))}
            />

            <Select
              label="Method"
              name="donationMethodId"
              value={donationForm.donationMethodId}
              onChange={handleChange(setDonationForm)}
              options={donationMethods.map((method) => ({ label: method.method_name, value: method.id }))}
            />

            <Input label="Amount" name="amount" type="number" value={donationForm.amount} onChange={handleChange(setDonationForm)} required />
            <Input label="Donation Date" name="donationDate" type="date" value={donationForm.donationDate} onChange={handleChange(setDonationForm)} />
            <Input label="Purpose" name="purpose" value={donationForm.purpose} onChange={handleChange(setDonationForm)} />
          </div>

          <Input label="Note" name="note" value={donationForm.note} onChange={handleChange(setDonationForm)} />

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setDonationModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Donation</Button>
          </div>
        </form>
      </Modal>

      <Modal open={applicationModalOpen} title="Add Welfare Application" onClose={() => setApplicationModalOpen(false)} size="lg">
        <form onSubmit={createApplication}>
          <div className="welfare-form-grid">
            <Input label="Applicant Name" name="applicantName" value={applicationForm.applicantName} onChange={handleChange(setApplicationForm)} required />
            <Input label="Father Name" name="fatherName" value={applicationForm.fatherName} onChange={handleChange(setApplicationForm)} />
            <Input label="Phone" name="phone" value={applicationForm.phone} onChange={handleChange(setApplicationForm)} />
            <Input label="CNIC" name="cnic" value={applicationForm.cnic} onChange={handleChange(setApplicationForm)} />

            <Select
              label="Gender"
              name="gender"
              value={applicationForm.gender}
              onChange={handleChange(setApplicationForm)}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
            />

            <Select
              label="Marital Status"
              name="maritalStatus"
              value={applicationForm.maritalStatus}
              onChange={handleChange(setApplicationForm)}
              options={[
                { label: "Single", value: "single" },
                { label: "Married", value: "married" },
                { label: "Widowed", value: "widowed" },
              ]}
            />

            <Input label="Family Members" name="familyMembers" type="number" value={applicationForm.familyMembers} onChange={handleChange(setApplicationForm)} />
            <Input label="Residence Type" name="residenceType" value={applicationForm.residenceType} onChange={handleChange(setApplicationForm)} />
            <Input label="Education Level" name="educationLevel" value={applicationForm.educationLevel} onChange={handleChange(setApplicationForm)} />
            <Input label="Monthly Income" name="monthlyIncome" type="number" value={applicationForm.monthlyIncome} onChange={handleChange(setApplicationForm)} />
            <Input label="Monthly Expense" name="monthlyExpense" type="number" value={applicationForm.monthlyExpense} onChange={handleChange(setApplicationForm)} />
            <Input label="Support Type" name="supportType" value={applicationForm.supportType} onChange={handleChange(setApplicationForm)} />
            <Input label="Requested Amount" name="requestedAmount" type="number" value={applicationForm.requestedAmount} onChange={handleChange(setApplicationForm)} />
          </div>

          <Input label="Address" name="address" value={applicationForm.address} onChange={handleChange(setApplicationForm)} />
          <Input label="Verification Notes" name="verificationNotes" value={applicationForm.verificationNotes} onChange={handleChange(setApplicationForm)} />

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setApplicationModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Application</Button>
          </div>
        </form>
      </Modal>

      <Modal open={statusModalOpen} title="Update Application Status" onClose={() => setStatusModalOpen(false)} size="md">
        <form onSubmit={updateApplicationStatus}>
          <Select
            label="Status"
            name="caseStatus"
            value={statusForm.caseStatus}
            onChange={handleChange(setStatusForm)}
            options={[
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
              { label: "Completed", value: "completed" },
              { label: "Pending", value: "pending" },
            ]}
          />

          <Input label="Approved Amount" name="approvedAmount" type="number" value={statusForm.approvedAmount} onChange={handleChange(setStatusForm)} />

          <Input label="Verification Notes" name="verificationNotes" value={statusForm.verificationNotes} onChange={handleChange(setStatusForm)} />

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Update Status</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WelfareDashboard;