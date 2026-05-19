import { LogOut, Search } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={18} />
        <input placeholder="Search..." />
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