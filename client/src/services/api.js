import axios from "axios";

const fallbackBaseURL = () => `http://${window.location.hostname}:5001/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackBaseURL()
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem("token");
  if (!token) {
    try {
      const rawUser = localStorage.getItem("user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      token = parsedUser?.token || "";
      if (token) {
        localStorage.setItem("token", token);
      }
    } catch {
      token = "";
    }
  }
  if (token) {
    if (!config.headers) config.headers = {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error?.config;
    if (!cfg || error?.response || cfg.__retriedWithAltHost) {
      return Promise.reject(error);
    }

    try {
      const current = new URL(cfg.baseURL || api.defaults.baseURL || fallbackBaseURL());
      const altHost = current.hostname === "localhost" ? "127.0.0.1" : "localhost";
      const altBaseURL = `${current.protocol}//${altHost}:${current.port || "5001"}${current.pathname}`;
      cfg.baseURL = altBaseURL;
      cfg.__retriedWithAltHost = true;
      return api(cfg);
    } catch {
      return Promise.reject(error);
    }
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    if (status === 401 && !url.includes("/auth/login") && !url.includes("/auth/register")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
