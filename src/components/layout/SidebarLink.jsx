import { NavLink } from "react-router-dom";

export default function SidebarLink({ to, label, icon: Icon, collapsed }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={collapsed ? label : ""}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${
          isActive
            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }
        ${collapsed ? "justify-center" : ""}`
      }
    >
      {Icon && <Icon className="w-5 h-5 shrink-0" />}
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </NavLink>
  );
}