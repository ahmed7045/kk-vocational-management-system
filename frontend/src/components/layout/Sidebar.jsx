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
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const Sidebar = () => {
  const { hasAnyPermission } = useAuth();
  const navigate = useNavigate();

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
      label: "Courses & Shifts",
      path: "/app/courses",
      icon: BookOpen,
      permissions: ["courses.view", "shifts.view"],
    },
    {
      label: "Payments",
      path: "/app/payments",
      icon: CreditCard,
      permissions: ["payments.view"],
    },
    {
      label: "Expenses",
      path: "/app/expenses",
      icon: Receipt,
      permissions: ["expenses.view"],
    },
    {
      label: "Reports",
      path: "/app/reports",
      icon: FileText,
      permissions: ["reports.view", "reports.students.view"],
    },
    {
      label: "Certificates",
      path: "/app/certificates",
      icon: Award,
      permissions: ["certificates.view"],
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
      label: "Beneficiaries",
      path: "/app/welfare/charities",
      icon: HeartHandshake,
      permissions: ["welfare.charity.view"],
    },
    {
      label: "Charity Records",
      path: "/app/welfare/charity-records",
      icon: Receipt,
      permissions: ["welfare.charity.view"],
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
      label: "Welfare Reports",
      path: "/app/reports",
      icon: FileText,
      permissions: ["reports.welfare.view"],
    },
    {
      label: "Expenses",
      path: "/app/expenses",
      icon: Receipt,
      permissions: ["welfare.expense.view", "expenses.view"],
    },
  ];

  const items = selectedPortal === "welfare" ? welfareItems : vocationalItems;

  const switchPortal = () => {
    navigate("/portal-selection");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div>KK</div>
        <span>
          {selectedPortal === "welfare" ? "Welfare Portal" : "KK Portal"}
        </span>
      </div>

      <nav>
        {items
          .filter((item) => hasAnyPermission(item.permissions))
          .map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.path} to={item.path} className="sidebar-link">
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

        <button className="sidebar-switch-btn" onClick={switchPortal}>
          <ArrowLeftRight size={18} />
          <span>Switch Portal</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;