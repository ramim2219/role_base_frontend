// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from "react";
// at the top
import { setLoggingOut } from "../Axios/axiosConfig";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// ─── helpers ──────────────────────────────────────────
const getToken = () => localStorage.getItem("auth_token");

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const firstError = data?.errors && Object.values(data.errors)[0]?.[0];
    throw new Error(firstError || data?.message || `Request failed (${res.status})`);
  }
  return data;
}

// ─── provider ─────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [menus, setMenus] = useState(() => {
    const stored = localStorage.getItem("auth_menus");
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(false);
  const [menusLoading, setMenusLoading] = useState(false);

  // Persist user whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  // Persist menus whenever they change
  useEffect(() => {
    if (menus?.length) {
      localStorage.setItem("auth_menus", JSON.stringify(menus));
    } else {
      localStorage.removeItem("auth_menus");
    }
  }, [menus]);

  // ─── load assigned menus ────────────────────────────
  const loadMenus = useCallback(async () => {
    if (!getToken()) {
      setMenus([]);
      return [];
    }

    setMenusLoading(true);
    try {
      // No args — backend uses the logged-in user's id + user_type_id
      const res = await apiFetch("/MenuAllocation/get_assigned_menus");
      const tree = res?.data || [];
      setMenus(tree);
      return tree;
    } catch (e) {
      console.warn("Failed to load assigned menus:", e.message);
      setMenus([]);
      return [];
    } finally {
      setMenusLoading(false);
    }
  }, []);

  // ─── login ──────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const { user: apiUser, token } = res.data;

      localStorage.setItem("auth_token", token);
      setUser(apiUser);

      // Pull the assigned menus right after login
      await loadMenus();

      return apiUser;
    } finally {
      setLoading(false);
    }
  }, [loadMenus]);

  // ─── logout ─────────────────────────────────────────
  const logout = useCallback(async () => {
  setLoggingOut(true);   // ← add this line first

    try {
      if (getToken()) {
        await apiFetch("/auth/logout", { method: "POST" });
      }
    } catch (e) {
      console.warn("Logout API failed:", e.message);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_menus");
      setUser(null);
      setMenus([]);
    }
  }, []);

  // ─── rehydrate on first load ────────────────────────
  useEffect(() => {
    if (!getToken()) return;

    (async () => {
      // Fetch menus even if user is already in localStorage
      await loadMenus();
    })();
  }, [loadMenus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        menus,
        menusLoading,
        loadMenus,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}