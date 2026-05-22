import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Search, UserCog } from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import {
  formatCurrency,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./employees.css";

const Employees = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [employees, setEmployees] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [accountMode, setAccountMode] = useState("info_only");

  const [form, setForm] = useState({
    fullName: "",
    designation: "",
    phone: "",
    salary: "",
    gender: "",
    email: "",
    password: "",
    genderVisibility: "both",
    // permissionIds: [],
    permissions: [],
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);
      if (search) params.append("search", search);

      const response = await axiosInstance.get(`/employees?${params.toString()}`);
      setEmployees(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axiosInstance.get("/employees/permissions");
      setPermissions(response.data.data || []);
    } catch (error) {
      console.error("Permission fetch error:", error.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPermissions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const togglePermission = (permissionId) => {
  //   setForm((prev) => {
  //     const exists = prev.permissionIds.includes(permissionId);

  //     return {
  //       ...prev,
  //       permissionIds: exists
  //         ? prev.permissionIds.filter((id) => id !== permissionId)
  //         : [...prev.permissionIds, permissionId],
  //     };
  //   });
  // };

  const togglePermission = (permissionName) => {
  setForm((prev) => {
    const exists = prev.permissions.includes(permissionName);

    return {
      ...prev,
      permissions: exists
        ? prev.permissions.filter((name) => name !== permissionName)
        : [...prev.permissions, permissionName],
    };
  });
};

  const resetForm = () => {
    setAccountMode("info_only");

    setForm({
      fullName: "",
      designation: "",
      phone: "",
      salary: "",
      gender: "",
      email: "",
      password: "",
      genderVisibility: "both",
      // permissionIds: [],
      permissions: [],
    });
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        branchId: Number(branchId),
        fullName: form.fullName,
        designation: form.designation,
        phone: form.phone,
        salary: Number(form.salary || 0),
        gender: form.gender || null,
        genderVisibility: form.genderVisibility,
        hasLoginAccount: accountMode === "with_account",
      };

      if (accountMode === "with_account") {
        payload.email = form.email;
        payload.password = form.password;
        // payload.permissionIds = form.permissionIds;
        payload.permissions = form.permissions;
      }

      await axiosInstance.post("/employees", payload);

      setModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create employee");
    } finally {
      setSaving(false);
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
      key: "gender_visibility",
      title: "Visibility",
      render: (row) => row.gender_visibility || "both",
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
            Manage employees and limited system access for {branchName || "selected branch"}.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      <Card>
        <div className="employees-toolbar">
          <div className="employees-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone or designation..."
            />
          </div>

          <Button variant="secondary" onClick={fetchEmployees}>
            <RefreshCcw size={16} /> Apply
          </Button>
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
        title="Add Employee"
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleCreateEmployee}>
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

            <Select
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              placeholder="Select gender"
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
            />

            <Select
              label="Gender Visibility"
              name="genderVisibility"
              value={form.genderVisibility}
              onChange={handleChange}
              options={[
                { label: "Both", value: "both" },
                { label: "Male Only", value: "male_only" },
                { label: "Female Only", value: "female_only" },
              ]}
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
                  required
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>

              <div className="permissions-box">
                <div className="permissions-header">
                  <UserCog size={18} />
                  <strong>Permissions</strong>
                </div>

                {permissions.length === 0 ? (
                  <p className="permissions-empty">No permissions found.</p>
                ) : (
                  <div className="permissions-grid">
                    {permissions.map((permission) => (
                      <label key={permission.id} className="permission-item">
                        <input
                          type="checkbox"
                          // checked={form.permissionIds.includes(permission.id)}
                          // onChange={() => togglePermission(permission.id)}
                          checked={form.permissions.includes(permission.name)}
                          onChange={() => togglePermission(permission.name)}
                        />
                        <span>{permission.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              Add Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;