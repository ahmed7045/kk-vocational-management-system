import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowRight,
  LogOut,
  Users,
  Wallet,
  ArrowLeft,
} from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import "./branchSelection.css";

const BranchSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleSelectBranch = (branch) => {
    localStorage.setItem("selectedPortal", "vocational");
    localStorage.setItem("selectedBranchId", branch.id);
    localStorage.setItem("selectedBranchName", branch.name);
    localStorage.setItem("selectedBranchStatus", branch.status || "active");

    navigate("/app/dashboard");
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

          <div>
            <strong>{user?.fullName || "Admin User"}</strong>
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
                  <span>{Number(branch.total_students || 0)} Students</span>
                </div>

                <div>
                  <Wallet size={17} />
                  <span>
                    Rs {Number(branch.monthly_revenue || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <button className="branch-open-btn">
                Open Dashboard <ArrowRight size={17} />
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default BranchSelection;