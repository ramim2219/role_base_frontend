// src/pages/SidebarLink.jsx
import { NavLink } from "react-router-dom";
import * as Lucide from "lucide-react";

const isFaClass = (v) =>
  typeof v === "string" && /^fa[rsbdl]?\s+fa-/.test(v.trim());

export default function SidebarLink({ to, label, icon, collapsed }) {
  const renderIcon = () => {
    // Font Awesome class string ("fas fa-home")
    if (isFaClass(icon)) {
      return (
        <i
          className={`${icon.trim()} w-5 text-center shrink-0`}
          aria-hidden="true"
        />
      );
    }

    // Lucide (or any React component) passed as a function
    if (typeof icon === "function") {
      const Cmp = icon;
      return <Cmp className="w-5 h-5 shrink-0" />;
    }

    // Lucide by name string (e.g. "Home")
    if (typeof icon === "string" && Lucide[icon]) {
      const Cmp = Lucide[icon];
      return <Cmp className="w-5 h-5 shrink-0" />;
    }

    // Nothing — keep the slot empty to preserve alignment
    return <span className="w-5 h-5 shrink-0" aria-hidden="true" />;
  };

  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={collapsed ? label : ""}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }
        ${collapsed ? "justify-center" : ""}`
      }
    >
      {renderIcon()}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}