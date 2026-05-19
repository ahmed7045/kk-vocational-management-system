import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, HeartHandshake, LogOut } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import "./portalSelection.css";

const PortalSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPortals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/portal/portals");
      setPortals(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch portals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  const handleOpenPortal = (portalKey) => {
    localStorage.setItem("selectedPortal", portalKey);

    if (portalKey === "vocational") {
      navigate("/branch-selection");
      return;
    }

    if (portalKey === "welfare") {
      navigate("/app/welfare");
      return;
    }
  };

  const getPortalIcon = (key) => {
    if (key === "welfare") return <HeartHandshake size={32} />;
    return <Building2 size={32} />;
  };

  if (loading) {
    return <Loader fullPage text="Loading portals..." />;
  }

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div>
          <div className="portal-brand">KK</div>
          <h1>Choose Your Portal</h1>
          <p>
            Select the management system you want to access.
          </p>
        </div>

        <div className="portal-user-box">
          <div>
            <strong>{user?.fullName || "Admin User"}</strong>
            <span>{user?.role || "User"}</span>
          </div>

          <Button variant="secondary" size="sm" onClick={logout}>
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </header>

      {error && <div className="portal-error">{error}</div>}

      <section className="portal-grid">
        {portals.length === 0 ? (
          <Card>
            <p className="portal-empty">
              No portal access found for your account.
            </p>
          </Card>
        ) : (
          portals.map((portal) => (
            <div
              key={portal.key}
              className="portal-card"
              onClick={() => handleOpenPortal(portal.key)}
            >
              <div className="portal-icon">{getPortalIcon(portal.key)}</div>

              <div>
                <h2>{portal.name}</h2>
                <p>{portal.description}</p>
              </div>

              <button>
                Open Portal
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default PortalSelection;