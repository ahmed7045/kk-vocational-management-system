import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const Sidebar = () => {
  const { hasAnyPermission } = useAuth();
  const navigate = useNavigate();

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

  const switchPortal = () => {
    navigate("/portal-selection");
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div>KK</div>

        {!collapsed && (
          <span>
            {selectedPortal === "welfare" ? "Welfare Portal" : "KK Portal"}
          </span>
        )}

        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
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
                className="sidebar-link"
                title={collapsed ? item.label : ""}
              >
                <Icon size={19} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}

        <button
          className="sidebar-switch-btn"
          onClick={switchPortal}
          title={collapsed ? "Switch Portal" : ""}
        >
          <ArrowLeftRight size={18} />
          {!collapsed && <span>Switch Portal</span>}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;