import { LogOut, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const Topbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>

        <div className="topbar-search">
          <Search size={18} />
          <input placeholder="Search..." />
        </div>
      </div>

      <div className="topbar-user">
        <div>
          <strong>{user?.fullName || user?.full_name || "User"}</strong>
          <span>{user?.role}</span>
        </div>

        <button onClick={logout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;