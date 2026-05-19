import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const Sidebar = () => {
  const { hasAnyPermission } = useAuth();

  const items = [
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
      label: "Employees",
      path: "/app/employees",
      icon: UserCog,
      permissions: ["employees.view"],
    },
    {
      label: "Courses",
      path: "/app/courses",
      icon: BookOpen,
      permissions: ["courses.view"],
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
      label: "Welfare",
      path: "/app/welfare",
      icon: HeartHandshake,
      permissions: ["welfare.dashboard.view", "welfare.view"],
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

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div>KK</div>
        <span>KK Portal</span>
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
      </nav>
    </aside>
  );
};

export default Sidebar;