import React, { createContext, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUserRaw = localStorage.getItem("user");
      if (!storedUserRaw) return null;

      const parsedUser = JSON.parse(storedUserRaw);
      const token = localStorage.getItem("token");
      const fallbackToken = parsedUser?.token;

      if (!token && fallbackToken) {
        localStorage.setItem("token", fallbackToken);
      }

      if (!token && !fallbackToken) return null;
      return parsedUser;
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
