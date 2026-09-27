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

    // Don't touch the login request — let Login page show the real message
    const isLoginRequest = config?.url?.includes("/auth/login");

    if (response.status === 401 && !isLoginRequest) {
      clearTokens();
      showErrorToast("Session expired. Please login again.");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(
        new Error("Session expired. Please login again.")
      );
    }

    // Laravel validation errors: { message, errors: { field: [msg] } }
    const data = response.data;
    const firstError =
      data?.errors && Object.values(data.errors)[0]?.[0];

    return Promise.reject(
      new Error(
        firstError || data?.message || `Request failed (${response.status})`
      )
    );
  }
);

export default apiClient;