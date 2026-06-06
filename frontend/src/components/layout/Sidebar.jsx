import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  CreditCard,
  Receipt,
  HeartHandshake,
  FileText,
  Award,
  ArrowLeftRight,
  PanelLeftClose,
  Menu,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const Sidebar = () => {
  const { hasAnyPermission, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const selectedPortal = localStorage.getItem("selectedPortal") || "vocational";

  const vocationalItems = [
    {
      label: "Dashboard",
      path: "/app/dashboard",
      icon: LayoutDashboard,
      permissions: ["dashboard.view"],
    },
    {
      label: "Students",
      path: "/app/students",
      icon: Users,
      permissions: ["students.view"],
    },
    {
      label: "Non-Active Students",
      path: "/app/students/non-active",
      icon: Users,
      permissions: ["students.view_non_active", "students.view"],
    },
    {
      label: "Employees",
      path: "/app/employees",
      icon: UserCog,
      permissions: ["employees.view"],
    },
    {
      label: "Expenses",
      path: "/app/expenses",
      icon: Receipt,
      permissions: ["expenses.view"],
    },
    {
      label: "Courses & Shifts",
      path: "/app/courses",
      icon: BookOpen,
      permissions: ["courses.view", "shifts.view"],
    },
    {
      label: "Certificates",
      path: "/app/certificates",
      icon: Award,
      permissions: ["certificates.view"],
    },
    {
      label: "Reports",
      path: "/app/reports",
      icon: FileText,
      permissions: ["reports.view", "reports.students.view"],
    },
  ];

  const welfareItems = [
    {
      label: "Dashboard",
      path: "/app/welfare",
      icon: HeartHandshake,
      permissions: ["welfare.view", "welfare.dashboard.view"],
    },
    {
      label: "Donors",
      path: "/app/welfare/donors",
      icon: Users,
      permissions: ["welfare.donor.view"],
    },
    {
      label: "Donations",
      path: "/app/welfare/donations",
      icon: CreditCard,
      permissions: ["welfare.donation.view"],
    },
    {
      label: "Applications",
      path: "/app/welfare/applications",
      icon: FileText,
      permissions: ["welfare.application.view"],
    },
    {
      label: "Beneficiaries",
      path: "/app/welfare/charities",
      icon: HeartHandshake,
      permissions: ["welfare.charity.view"],
    },
    {
      label: "Expenses",
      path: "/app/expenses",
      icon: Receipt,
      permissions: ["welfare.expense.view", "expenses.view"],
    },
    {
      label: "Welfare Reports",
      path: "/app/reports",
      icon: FileText,
      permissions: ["reports.welfare.view"],
    },
  ];

  const items = selectedPortal === "welfare" ? welfareItems : vocationalItems;
  const isActiveRoute = (itemPath) => {
    const currentPath = location.pathname;

    if (itemPath === "/app/welfare") {
      return currentPath === "/app/welfare";
    }

    if (itemPath === "/app/students") {
      return currentPath === "/app/students";
    }

    if (itemPath === "/app/reports") {
      return currentPath === "/app/reports";
    }

    return currentPath === itemPath;
  };

  const switchPortal = () => {
    navigate("/portal-selection");
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        {!collapsed && (
          <>
            <div>KK</div>

            <span>
              {selectedPortal === "welfare" ? "Welfare Portal" : "KK Portal"}
            </span>
          </>
        )}

        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu size={20} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav>
        {items
          .filter((item) => hasAnyPermission(item.permissions))
          .map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() =>
                  `sidebar-link ${isActiveRoute(item.path) ? "active" : ""}`
                }
                title={collapsed ? item.label : ""}
              >
                <Icon size={19} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
      </nav>
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user-card">
            <span>Signed in as</span>
            <strong>{user?.fullName || user?.full_name || "User"}</strong>
            <p>{user?.role || "user"}</p>
          </div>
        )}

        {user?.role === "super_admin" && (
          <button
            className="sidebar-switch-btn"
            onClick={switchPortal}
            title={collapsed ? "Switch Portal" : ""}
          >
            <ArrowLeftRight size={18} />
            {!collapsed && <span>Switch Portal</span>}
          </button>
        )}

        <button
          className="sidebar-logout-btn"
          onClick={logout}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;