import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api"
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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
