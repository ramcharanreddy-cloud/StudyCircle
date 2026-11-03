import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthentication = () => {
    localStorage.removeItem("studycircle_user");
    localStorage.removeItem("studycircle_token");
    setUser(null);
  };

  useEffect(() => {
    let active = true;
    const expireSession = () => {
      if (active) clearAuthentication();
    };
    window.addEventListener("studycircle:session-expired", expireSession);

    const restoreSession = async () => {
      const token = localStorage.getItem("studycircle_token");
      if (!token) {
        localStorage.removeItem("studycircle_user");
        if (active) setLoading(false);
        return;
      }
      try {
        const response = await api.get("/auth/me");
        if (active) {
          const currentUser = response.data.user;
          localStorage.setItem("studycircle_user", JSON.stringify(currentUser));
          setUser(currentUser);
        }
      } catch {
        localStorage.removeItem("studycircle_user");
        localStorage.removeItem("studycircle_token");
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      active = false;
      window.removeEventListener("studycircle:session-expired", expireSession);
    };
  }, []);

  const saveAuthentication = (data) => {
    localStorage.setItem("studycircle_token", data.token);
    localStorage.setItem("studycircle_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    saveAuthentication(response.data);
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    saveAuthentication(response.data);
    return response.data;
  };

  const setProfile = (profile) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...profile, id: profile.id || current.id };
      localStorage.setItem("studycircle_user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => clearAuthentication();

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: Boolean(user),
      login, register, setProfile, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
