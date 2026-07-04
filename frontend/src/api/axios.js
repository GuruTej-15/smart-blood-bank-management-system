import axios from "axios";

const rawBase = String(import.meta.env.VITE_API_URL || "").trim();
const autoBase = typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:5000/api";

if (!rawBase && typeof window !== "undefined" && window.location.hostname !== "localhost") {
  console.error(
    "VITE_API_URL is not configured in production. Set VITE_API_URL in your frontend deployment to your backend origin."
  );
}

const baseRoot = rawBase ? rawBase.replace(/\/+$/, "") : autoBase.replace(/\/+$/, "");
const baseURL = baseRoot.endsWith("/api") ? baseRoot : `${baseRoot}/api`;

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sbb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const hasStoredUser = Boolean(localStorage.getItem("sbb_user"));
      const isAuthRequest = /\/auth\/(login|me|register)/.test(err.config?.url || "");
      if (!isAuthRequest && !hasStoredUser) {
        localStorage.removeItem("sbb_token");
        localStorage.removeItem("sbb_user");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
