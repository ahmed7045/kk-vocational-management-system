import { useEffect, useState } from "react";
import { Plus, Search, UserCog } from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import {
  formatCurrency,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./employees.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const Employees = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    accountType: "",
  });

  const [accountMode, setAccountMode] = useState("info_only");
  const vocationalTabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "students", label: "Students" },
    { key: "nonActiveStudents", label: "Non-Active Students" },
    { key: "employees", label: "Employees" },
    { key: "expenses", label: "Expenses" },
    { key: "courses", label: "Courses & Shifts" },
    { key: "certificates", label: "Certificates" },
    { key: "reports", label: "Reports" },
  ];

  const welfareTabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "donors", label: "Donors" },
    { key: "donations", label: "Donations" },
    { key: "applications", label: "Applications" },
    { key: "beneficiaries", label: "Beneficiaries" },
    { key: "expenses", label: "Expenses" },
    { key: "reports", label: "Welfare Reports" },
  ];
  const [form, setForm] = useState({
    fullName: "",
    designation: "",
    phone: "",
    salary: "",
    email: "",
    password: "",
    portalAccess: "",
    branchId: branchId || "",
    selectedTabs: [],
  });

  const applyFilters = (records, currentFilters = filters) => {
    let filtered = [...records];

    if (currentFilters.search.trim()) {
      const searchText = currentFilters.search.toLowerCase().trim();

      filtered = filtered.filter((employee) =>
        [
          employee.full_name,
          employee.designation,
          employee.phone,
          employee.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchText))
      );
    }

    if (currentFilters.accountType === "with_account") {
      filtered = filtered.filter((employee) => employee.has_login_account);
    }

    if (currentFilters.accountType === "info_only") {
      filtered = filtered.filter((employee) => !employee.has_login_account);
    }

    setEmployees(filtered);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);

      const response = await axiosInstance.get(`/employees?${params.toString()}`);
      const data = response.data.data || [];

      setAllEmployees(data);
      applyFilters(data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

const fetchBranches = async () => {
  try {
    const response = await axiosInstance.get("/branches");
    setBranches(response.data.data || []);
  } catch (error) {
    console.error("Branch fetch error:", error.response?.data?.message);
  }
};

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [branchId]);

  useEffect(() => {
    applyFilters(allEmployees);
  }, [filters.search, filters.accountType, allEmployees]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      accountType: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleSelectedTab = (tabKey) => {
    setForm((prev) => {
      const exists = prev.selectedTabs.includes(tabKey);

      return {
        ...prev,
        selectedTabs: exists
          ? prev.selectedTabs.filter((key) => key !== tabKey)
          : [...prev.selectedTabs, tabKey],
      };
    });
  };

  const handlePortalSelect = (portalAccess) => {
    setForm((prev) => ({
      ...prev,
      portalAccess,
      branchId: portalAccess === "vocational" ? prev.branchId || branchId || "" : "",
      selectedTabs: [],
    }));
  };

  const resetForm = () => {
    setAccountMode("info_only");

    setForm({
      fullName: "",
      designation: "",
      phone: "",
      salary: "",
      email: "",
      password: "",
      portalAccess: "",
      branchId: branchId || "",
      selectedTabs: [],
    });
  };

  const openAddModal = () => {
    setSelectedRecord(null);
    resetForm();
    setModalOpen(true);
  };

  const handleSaveEmployee = async (event) => {
    event.preventDefault();

    if (accountMode === "with_account") {
      if (!form.portalAccess) {
        alert("Please select Welfare or Vocational access.");
        return;
      }

      if (form.portalAccess === "vocational" && !form.branchId) {
        alert("Please select a branch for vocational account.");
        return;
      }

      if (form.selectedTabs.length === 0) {
        alert("Please select at least one permission tab.");
        return;
      }
    }

    if (accountMode === "info_only" && !branchId) {
      alert("Please select a branch first.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        branchId:
          accountMode === "with_account" && form.portalAccess === "vocational"
            ? Number(form.branchId)
            : branchId
              ? Number(branchId)
              : null,
        fullName: form.fullName,
        designation: form.designation,
        phone: form.phone,
        salary: Number(form.salary || 0),
        hasLoginAccount: accountMode === "with_account",
      };

      if (accountMode === "with_account") {
        payload.email = form.email;
        payload.password = form.password;
        payload.portalAccess = form.portalAccess;
        payload.selectedTabs = form.selectedTabs;
      }

      if (selectedRecord?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(`/employees/${selectedRecord.id}`, payload);
          await fetchEmployees();
        } else {
          const updatedEmployees = allEmployees.map((employee) =>
            employee.id === selectedRecord.id
              ? {
                ...employee,
                full_name: payload.fullName,
                designation: payload.designation,
                phone: payload.phone,
                salary: payload.salary,
                has_login_account: payload.hasLoginAccount,
                email: payload.email || employee.email,
                permissions: payload.permissions || employee.permissions || [],
              }
              : employee
          );

          setAllEmployees(updatedEmployees);
          applyFilters(updatedEmployees);
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/employees", payload);
          await fetchEmployees();
        } else {
          const newEmployee = {
            id: Date.now(),
            full_name: payload.fullName,
            designation: payload.designation,
            phone: payload.phone,
            salary: payload.salary,
            has_login_account: payload.hasLoginAccount,
            email: payload.email || "",
            permissions: payload.permissions || [],
            is_active: true,
          };

          const updatedEmployees = [newEmployee, ...allEmployees];
          setAllEmployees(updatedEmployees);
          applyFilters(updatedEmployees);
        }
      }

      setModalOpen(false);
      setSelectedRecord(null);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const handleView = (row) => {
    setSelectedRecord(row);
    setViewModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedRecord(row);

    setAccountMode(row.has_login_account ? "with_account" : "info_only");

    setForm({
      fullName: row.full_name || "",
      designation: row.designation || "",
      phone: row.phone || "",
      salary: row.salary || "",
      email: row.email || "",
      password: "",
      portalAccess: row.portal_access || "",
      branchId: row.branch_id || branchId || "",
      selectedTabs: [],
    });

    setModalOpen(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedRecord(row);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(`/employees/${selectedRecord.id}`);
      }

      const updatedEmployees = allEmployees.filter(
        (employee) => employee.id !== selectedRecord.id
      );

      setAllEmployees(updatedEmployees);
      applyFilters(updatedEmployees);

      setDeleteModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "full_name",
      title: "Employee",
      render: (row) => (
        <div>
          <strong>{row.full_name}</strong>
          <span className="table-subtext">{row.designation || "-"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (row) => row.phone || "-",
    },
    {
      key: "salary",
      title: "Salary",
      render: (row) => formatCurrency(row.salary),
    },
    {
      key: "has_login_account",
      title: "Account",
      render: (row) => (
        <Badge type={row.has_login_account ? "info" : "default"}>
          {row.has_login_account ? "With Account" : "Info Only"}
        </Badge>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      render: (row) => (
        <Badge type={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleView(row)}
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading employees..." />
      </div>
    );
  }

  return (
    <div className="page employees-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            Manage employees and limited system access for{" "}
            {branchName || "selected branch"}.
          </p>
        </div>

        <Button onClick={openAddModal}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      <Card className="employee-card">
        <div className="employees-toolbar">
          <div className="employees-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, phone, email or designation..."
            />
          </div>

          <Select
            name="accountType"
            value={filters.accountType}
            onChange={handleFilterChange}
            placeholder="Account type"
            options={[
              { label: "All Accounts", value: "" },
              { label: "With Account", value: "with_account" },
              { label: "Info Only", value: "info_only" },
            ]}
          />

          {/* <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button> */}

          {/* <Button variant="secondary" onClick={fetchEmployees}>
            <RefreshCcw size={16} /> Refresh
          </Button> */}
        </div>

        {error && <div className="employees-error">{error}</div>}

        <Table
          columns={columns}
          data={employees}
          emptyText="No employees found"
        />
      </Card>

      <Modal
        open={modalOpen}
        title={selectedRecord?.id ? "Edit Employee" : "Add Employee"}
        onClose={() => {
          setModalOpen(false);
          setSelectedRecord(null);
          resetForm();
        }}
        size="lg"
      >
        <form onSubmit={handleSaveEmployee}>
          <div className="employee-account-toggle">
            <button
              type="button"
              className={accountMode === "info_only" ? "active" : ""}
              onClick={() => setAccountMode("info_only")}
            >
              Info Only
            </button>

            <button
              type="button"
              className={accountMode === "with_account" ? "active" : ""}
              onClick={() => setAccountMode("with_account")}
            >
              With Account
            </button>
          </div>

          <div className="employee-form-grid">
            <Input
              label="Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Ahmed Ali"
              required
            />

            <Input
              label="Designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              placeholder="e.g. Trainer"
            />

            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="03456789012"
            />

            <Input
              label="Salary"
              name="salary"
              type="number"
              value={form.salary}
              onChange={handleChange}
              placeholder="e.g. 30000"
            />
          </div>

          {accountMode === "with_account" && (
            <>
              <div className="employee-form-grid">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="employee@example.com"
                  required={!selectedRecord?.id}
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    selectedRecord?.id
                      ? "Leave empty to keep old password"
                      : "Min. 6 characters"
                  }
                  required={!selectedRecord?.id}
                />
              </div>

              <div className="permissions-box">
                <div className="permissions-header">
                  <UserCog size={18} />
                  <strong>Access & Permissions</strong>
                </div>

                <div className="portal-access-grid">
                  <label className={`portal-option ${form.portalAccess === "welfare" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="portalAccess"
                      checked={form.portalAccess === "welfare"}
                      onChange={() => handlePortalSelect("welfare")}
                    />
                    <span>Welfare</span>
                  </label>

                  <label className={`portal-option ${form.portalAccess === "vocational" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="portalAccess"
                      checked={form.portalAccess === "vocational"}
                      onChange={() => handlePortalSelect("vocational")}
                    />
                    <span>Vocational</span>
                  </label>
                </div>

                {form.portalAccess === "vocational" && (
                  <div className="employee-branch-select">
                    <Select
                      label="Branch"
                      name="branchId"
                      value={form.branchId}
                      onChange={handleChange}
                      placeholder="Select Branch"
                      options={branches.map((branch) => ({
                        label: branch.name,
                        value: branch.id,
                      }))}
                      required
                    />
                  </div>
                )}

                {form.portalAccess && (
                  <>
                    <div className="permissions-header permissions-subheader">
                      <strong>
                        {form.portalAccess === "welfare"
                          ? "Welfare Permission Tabs"
                          : "Vocational Permission Tabs"}
                      </strong>
                    </div>

                    <div className="permissions-grid">
                      {(form.portalAccess === "welfare" ? welfareTabs : vocationalTabs).map((tab) => (
                        <label key={tab.key} className="permission-item">
                          <input
                            type="checkbox"
                            checked={form.selectedTabs.includes(tab.key)}
                            onChange={() => toggleSelectedTab(tab.key)}
                          />
                          <span>{tab.label}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {!form.portalAccess && (
                  <p className="permissions-empty">Select Welfare or Vocational to show permission tabs.</p>
                )}
              </div>
            </>
          )}

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setSelectedRecord(null);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              {selectedRecord?.id ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={viewModalOpen}
        title="Employee Details"
        onClose={() => {
          setViewModalOpen(false);
          setSelectedRecord(null);
        }}
        size="md"
      >
        {selectedRecord && (
          <div className="employee-detail-grid">
            <div>
              <strong>Name:</strong>
              <p>{selectedRecord.full_name || "-"}</p>
            </div>

            <div>
              <strong>Designation:</strong>
              <p>{selectedRecord.designation || "-"}</p>
            </div>

            <div>
              <strong>Phone:</strong>
              <p>{selectedRecord.phone || "-"}</p>
            </div>

            <div>
              <strong>Salary:</strong>
              <p>{formatCurrency(selectedRecord.salary || 0)}</p>
            </div>

            <div>
              <strong>Account:</strong>
              <p>
                {selectedRecord.has_login_account
                  ? "With Account"
                  : "Info Only"}
              </p>
            </div>

            <div>
              <strong>Status:</strong>
              <p>{selectedRecord.is_active ? "Active" : "Inactive"}</p>
            </div>

            {selectedRecord.email && (
              <div>
                <strong>Email:</strong>
                <p>{selectedRecord.email}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Employee"
        message={`Are you sure you want to delete ${selectedRecord?.full_name || "this employee"
          }?`}
        loading={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Employees;