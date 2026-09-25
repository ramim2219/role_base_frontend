import { createContext, useContext, useState, useCallback, useEffect } from "react";
import toast from "../Helper/TosterHelper";

const ToastContext = createContext();

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastPayload) => {
      const id = ++idCounter;
      const newToast = {
        id,
        type: "info",
        duration: 3000,
        ...toastPayload,
      };
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration > 0) {
        setTimeout(() => removeToast(id), newToast.duration);
      }

      return id;
    },
    [removeToast]
  );

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // 🔌 Wire the singleton helper to this provider
  useEffect(() => {
    toast.register({ addToast, removeToast, updateToast, toasts });
    return () => toast.unregister();
  }, [addToast, removeToast, updateToast, toasts]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used inside ToastProvider");
  return ctx;
}