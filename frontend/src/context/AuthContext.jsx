import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api/axios";
import { normalizeRole } from "../utils/constants";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("sbb_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    return { ...parsed, role: normalizeRole(parsed.role) };
  } catch {
    localStorage.removeItem("sbb_user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sbb_token");
    if (!token) {
      setInitializing(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        const nextUser = data?.user ? { ...data.user, role: normalizeRole(data.user.role) } : null;
        if (nextUser) {
          localStorage.setItem("sbb_user", JSON.stringify(nextUser));
          setUser(nextUser);
        } else {
          setUser(readStoredUser());
        }
      })
      .catch(() => {
        setUser(readStoredUser());
      })
      .finally(() => {
        setAuthReady(true);
        setInitializing(false);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const nextUser = { ...data.user, role: normalizeRole(data.user.role) };
      localStorage.setItem("sbb_token", data.token);
      localStorage.setItem("sbb_user", JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      const nextUser = { ...data.user, role: normalizeRole(data.user.role) };
      localStorage.setItem("sbb_token", data.token);
      localStorage.setItem("sbb_user", JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("sbb_token");
      if (token) {
        await api.post("/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      console.warn("Logout request failed", error);
    } finally {
      localStorage.removeItem("sbb_token");
      localStorage.removeItem("sbb_user");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, initializing: initializing || !authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
