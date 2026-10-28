//path: frontend/src/api/api.ts

import axios from "axios";
import { useAuth } from "../store/useAuth";

// ==========================================
// BASE API INSTANCE
// ==========================================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 0
});

// ==========================================
// REQUEST INTERCEPTOR
// Auto attach Bearer token
// ==========================================
api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (!config.headers) {
      config.headers = {};
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// Auto logout if token expired / invalid
// ==========================================
api.interceptors.response.use(
  (response) => response,

  async (error) => {

    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // ===============================
    // TRAINING LOCK
    // ===============================
    if (status === 423) {

      console.warn("Training running → system locked");

      alert("⚙️ System is locked because training is running.");

      return Promise.reject(error);
    }

    // =====================================
    // NOT 401 → normal error handling
    // =====================================
    if (status !== 401) {
      return Promise.reject(error);
    }

    // =====================================
    // ENDPOINTS THAT SHOULD NOT AUTO LOGOUT
    // =====================================

    if (
      requestUrl.includes("/auth/token") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/public/") ||

      // 🔹 SYSTEM RESET
      requestUrl.includes("/admin/system/reset") ||
      requestUrl.includes("/admin/system/reset-preview")
    ) {
      return Promise.reject(error);
    }

    console.warn("⚠️ 401 Unauthorized → Auto logout");

    // =====================================
    // CLEAR AUTH STATE
    // =====================================
    try {

      const auth = useAuth.getState();

      auth.logout();

    } catch (_) {
      // store belum siap (safe ignore)
    }

    localStorage.removeItem("token");

    // =====================================
    // REDIRECT TO LOGIN
    // =====================================

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);

export default api;