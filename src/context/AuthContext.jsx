import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async ({ email, password, remember }) => {
    // 🔌 Replace this with your real API call later
    await new Promise((r) => setTimeout(r, 800));

    if (!email || !password) throw new Error("Email and password are required");
    if (password.length < 6)
      throw new Error("Password must be at least 6 characters");

    const fakeUser = {
      id: 1,
      name: "John Doe",
      email,
      avatar: "https://i.pravatar.cc/40?img=12",
    };

    setUser(fakeUser);
    if (remember) {
      localStorage.setItem("auth_user", JSON.stringify(fakeUser));
    }
    return fakeUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
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