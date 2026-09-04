import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthState } from "../types/auth";

interface AuthContextValue {
  auth: AuthState | null;
  setAuth: (auth: AuthState | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const role = localStorage.getItem("role") as AuthState["role"] | null;
    if (accessToken && refreshToken && role) {
      return { accessToken, refreshToken, role };
    }
    return null;
  });

  const setAuth = (next: AuthState | null) => {
    setAuthState(next);
    if (next) {
      localStorage.setItem("accessToken", next.accessToken);
      localStorage.setItem("refreshToken", next.refreshToken);
      localStorage.setItem("role", next.role);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("role");
    }
  };

  const logout = () => setAuth(null);

  const value = useMemo(() => ({ auth, setAuth, logout }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
