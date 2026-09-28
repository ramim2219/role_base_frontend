// src/components/layout/Sidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as Lucide from "lucide-react";
import { X, ChevronDown, LogOut } from "lucide-react";
import SidebarLink from "../../pages/SidebarLink";
import { useAuth } from "../../context/AuthContext";

// ─── helpers ─────────────────────────────────────────
const toPath = (menu_url) => {
  const u = String(menu_url || "").trim().replace(/^\/+/, "");
  return u ? `/${u}` : "/";
};

const isFaClass = (v) =>
  typeof v === "string" && /^fa[rsbdl]?\s+fa-/.test(v.trim());

/** Universal icon renderer — never treats a string as an HTML tag. */
function IconRenderer({ value, size = "w-5 h-5" }) {
  // Font Awesome class string
  if (isFaClass(value)) {
    return (
      <i
        className={`${value.trim()} ${size} text-center shrink-0`}
        aria-hidden="true"
      />
    );
  }
  // Lucide (or any) React component
  if (typeof value === "function") {
    const Cmp = value;
    return <Cmp className={`${size} shrink-0`} />;
  }
  // Lucide by name string (e.g. "Home")
  if (typeof value === "string" && Lucide[value]) {
    const Cmp = Lucide[value];
    return <Cmp className={`${size} shrink-0`} />;
  }
  // Nothing to render — keep the layout stable
  return <span className={`${size} shrink-0`} aria-hidden="true" />;
}

// Adapt API node → sidebar shape
const adaptMenu = (node) => {
  const children = [
    ...(Array.isArray(node.submenu) ? node.submenu : []),
    ...(Array.isArray(node.access) ? node.access : []),
  ].filter((c) => String(c.type || "").toLowerCase() !== "access");

  return {
    id: node.id,
    name: node.menu,
    path: toPath(node.menu_url),
    icon: node.icon,
    children: children.map(adaptMenu),
  };
};

// ─── Submenu item ────────────────────────────────────
function SubmenuItem({ item, collapsed }) {
  const location = useLocation();
  const hasActiveChild = item.children?.some((c) =>
    location.pathname.startsWith(c.path)
  );
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  const firstChildPath = item.children?.[0]?.path || item.path || "/";

  if (collapsed) {
    return (
      <NavLink
        to={firstChildPath}
        title={item.name}
        className={() =>
          `flex items-center justify-center px-3 py-2.5 rounded-lg transition-colors
          ${
            hasActiveChild
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`
        }
      >
        <IconRenderer value={item.icon} size="w-5 h-5" />
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          ${
            hasActiveChild
              ? "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/20"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
      >
        <IconRenderer value={item.icon} size="w-5 h-5" />
        <span className="flex-1 text-left whitespace-nowrap">{item.name}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="ml-5 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-1">
          {item.children.map((child) => (
            <li key={child.path}>
              <NavLink
                to={child.path}
                end={child.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                  }`
                }
              >
                <IconRenderer value={child.icon} size="w-4 h-4" />
                <span className="whitespace-nowrap">{child.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────
export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}) {
  const { menus, menusLoading, logout } = useAuth();

  const navItems = useMemo(() => (menus || []).map(adaptMenu), [menus]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              A
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menusLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-gray-100 dark:bg-gray-700/40 animate-pulse"
                />
              ))}
            </div>
          ) : navItems.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-6 text-center">
              No menus assigned.
            </div>
          ) : (
            navItems.map((item) =>
              item.children?.length > 0 ? (
                <SubmenuItem
                  key={item.id || item.path || item.name}
                  item={item}
                  collapsed={collapsed}
                />
              ) : (
                <SidebarLink
                  key={item.id || item.path}
                  to={item.path}
                  label={item.name}
                  icon={item.icon}
                  collapsed={collapsed}
                />
              )
            )
          )}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
              ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}