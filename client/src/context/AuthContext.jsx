import React, { createContext, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

const readStoredAuth = () => {
  const sources = [sessionStorage, localStorage];
  for (const store of sources) {
    try {
      const storedUserRaw = store.getItem("user");
      const token = store.getItem("token");
      if (!storedUserRaw) continue;

      const parsedUser = JSON.parse(storedUserRaw);
      const fallbackToken = parsedUser?.token;
      const finalToken = token || fallbackToken;

      if (!finalToken) continue;
      if (!token && fallbackToken) {
        store.setItem("token", fallbackToken);
      }

      return { user: parsedUser, token: finalToken, store };
    } catch {
      // If corrupted, clear and continue to the next storage.
      store.removeItem("user");
      store.removeItem("token");
    }
  }
  return { user: null, token: "", store: null };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredAuth().user);

  const login = async (email, password, remember = false) => {
    const { data } = await api.post("/auth/login", { email, password });
    clearAuthStorage();
    const store = remember ? localStorage : sessionStorage;
    store.setItem("token", data.token);
    store.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
