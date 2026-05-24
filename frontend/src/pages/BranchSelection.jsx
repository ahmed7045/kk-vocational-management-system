import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowRight,
  LogOut,
  Users,
  Wallet,
  ArrowLeft,
  Plus,
} from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Modal from "../components/common/Modal";
import { formatCurrency } from "../utils/formatters";
import "./branchSelection.css";

const BranchSelection = () => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [branchModalOpen, setBranchModalOpen] = useState(false);

  const [branchForm, setBranchForm] = useState({
    name: "",
    location: "",
    status: "active",
  });

  const canCreateBranch =
    user?.role === "super_admin" || hasPermission?.("branches.create");

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/portal/branches");
      setBranches(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleBranchFormChange = (event) => {
    const { name, value } = event.target;

    setBranchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetBranchForm = () => {
    setBranchForm({
      name: "",
      location: "",
      status: "active",
    });
  };

  const handleCreateBranch = async (event) => {
    event.preventDefault();

    if (!branchForm.name.trim()) {
      alert("Branch name is required.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/branches", {
        name: branchForm.name.trim(),
        location: branchForm.location.trim() || null,
        status: branchForm.status || "active",
      });

      setBranchModalOpen(false);
      resetBranchForm();
      await fetchBranches();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create branch");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectBranch = (branch) => {
    localStorage.setItem("selectedPortal", "vocational");
    localStorage.setItem("selectedBranchId", branch.id);
    localStorage.setItem("selectedBranchName", branch.name);
    localStorage.setItem("selectedBranchStatus", branch.status || "active");

    navigate("/app/dashboard");
  };

  const getStudentCount = (branch) => {
    return Number(
      branch.students_count ??
        branch.total_students ??
        branch.student_count ??
        0
    );
  };

  const getBranchBalance = (branch) => {
    return Number(
      branch.balance ??
        branch.monthly_revenue ??
        branch.total_balance ??
        0
    );
  };

  if (loading) {
    return <Loader fullPage text="Loading branches..." />;
  }

  return (
    <div className="branch-page">
      <header className="branch-header">
        <div>
          <div className="branch-brand">KK</div>
          <h1>Select Branch</h1>
          <p>Choose a vocational branch to access its dashboard and records.</p>
        </div>

        <div className="branch-user-box">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/portal-selection")}
          >
            <ArrowLeft size={16} /> Back
          </Button>

          {canCreateBranch && (
            <Button size="sm" onClick={() => setBranchModalOpen(true)}>
              <Plus size={16} /> Add Branch
            </Button>
          )}

          <div>
            <strong>{user?.fullName || user?.full_name || "Admin User"}</strong>
            <span>{user?.role || "User"}</span>
          </div>

          <Button variant="secondary" size="sm" onClick={logout}>
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </header>

      {error && <div className="branch-error">{error}</div>}

      <section className="branch-grid">
        {branches.length === 0 ? (
          <div className="branch-empty">
            No branch access found for your account.
          </div>
        ) : (
          branches.map((branch) => (
            <article
              key={branch.id}
              className="branch-card"
              onClick={() => handleSelectBranch(branch)}
            >
              <div className="branch-card-top">
                <div className="branch-icon">
                  <Building2 size={28} />
                </div>

                <span
                  className={`branch-status ${
                    branch.status === "active" ? "active" : "inactive"
                  }`}
                >
                  {branch.status || "active"}
                </span>
              </div>

              <div className="branch-card-content">
                <h2>{branch.name}</h2>
                <p>{branch.location || "No location added"}</p>
              </div>

              <div className="branch-stats">
                <div>
                  <Users size={17} />
                  <span>{getStudentCount(branch)} Students</span>
                </div>

                <div>
                  <Wallet size={17} />
                  <span>{formatCurrency(getBranchBalance(branch))}</span>
                </div>
              </div>

              <button type="button" className="branch-open-btn">
                Open Dashboard <ArrowRight size={17} />
              </button>
            </article>
          ))
        )}
      </section>

      <Modal
        open={branchModalOpen}
        title="Add New Branch"
        onClose={() => {
          setBranchModalOpen(false);
          resetBranchForm();
        }}
        size="md"
      >
        <form onSubmit={handleCreateBranch}>
          <Input
            label="Branch Name"
            name="name"
            value={branchForm.name}
            onChange={handleBranchFormChange}
            placeholder="Example: IT Centre"
            required
          />

          <Input
            label="Location"
            name="location"
            value={branchForm.location}
            onChange={handleBranchFormChange}
            placeholder="Example: Haji Ali Muhammad Campus 4"
          />

          <Select
            label="Status"
            name="status"
            value={branchForm.status}
            onChange={handleBranchFormChange}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setBranchModalOpen(false);
                resetBranchForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              Save Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BranchSelection;