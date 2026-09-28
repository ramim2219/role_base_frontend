// src/Axios/axiosConfig.js
import axios from "axios";
import { getTokens, clearTokens } from "../Utils/tokenStorage";
import { showErrorToast } from "../Helper/TosterHelper";

const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ─── Module-scoped flags to avoid toast spam ────────────
let isLoggingOut = false;
let hasShownExpiredToast = false;

export const setLoggingOut = (v) => {
  isLoggingOut = !!v;
  if (v) hasShownExpiredToast = false; // reset when a new logout begins
};

// ─── Request interceptor: attach Bearer token ──────────
apiClient.interceptors.request.use(
  (config) => {
    const { token } = getTokens();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 + normalize errors ─
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    // Network / CORS / timeout
    if (!response) {
      return Promise.reject(
        new Error(error.message || "Network error. Please try again.")
      );
    }

    const url = config?.url || "";
    const isLoginRequest = url.includes("/auth/login");
    const isLogoutRequest = url.includes("/auth/logout");

    // 401 handling
    if (response.status === 401 && !isLoginRequest) {
      // Logout in progress → swallow silently, don't redirect or toast
      if (isLoggingOut || isLogoutRequest) {
        return Promise.reject(new Error("Unauthenticated."));
      }

      clearTokens();

      // Show the toast only once per session
      if (!hasShownExpiredToast) {
        hasShownExpiredToast = true;
        showErrorToast("Session expired. Please login again.");
      }

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(new Error("Session expired. Please login again."));
    }

    // Laravel validation errors: { message, errors: { field: [msg] } }
    const data = response.data;
    const firstError = data?.errors && Object.values(data.errors)[0]?.[0];

    return Promise.reject(
      new Error(
        firstError || data?.message || `Request failed (${response.status})`
      )
    );
  }
);

export default apiClient;