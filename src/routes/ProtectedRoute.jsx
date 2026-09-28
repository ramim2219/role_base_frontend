// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── helpers ─────────────────────────────────────────
const normalize = (p) =>
  "/" + String(p || "").replace(/^\/+|\/+$/g, "");

// Collect every menu_url path from the assigned tree
const collectPaths = (nodes, out = []) => {
  (nodes || []).forEach((n) => {
    if (n.menu_url) out.push(normalize(n.menu_url));
    if (Array.isArray(n.submenu)) collectPaths(n.submenu, out);
    if (Array.isArray(n.access)) collectPaths(n.access, out);
  });
  return out;
};

// Routes that any authenticated user may always access,
// even if they're not in the menu list (e.g. profile, dashboard)
const ALWAYS_ALLOWED = [
  "/dashboard",
  "/profile",
  "/settings",
];

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, menus, menusLoading } = useAuth();
  const location = useLocation();

  // 1. Not authenticated → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Menus still loading → render a spinner instead of redirecting
  if (menusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    );
  }

  // 3. Permission check on the current path
  const currentPath = normalize(location.pathname);
  const allowedPaths = collectPaths(menus);

  const isAllowed =
    ALWAYS_ALLOWED.includes(currentPath) ||
    allowedPaths.some(
      (p) => currentPath === p || currentPath.startsWith(p + "/")
    );

  if (!isAllowed) {
    return <Navigate to="/403" replace />;
  }

  return children;
}