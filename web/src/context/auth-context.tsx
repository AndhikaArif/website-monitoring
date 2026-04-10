"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface IUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANDOR" | "HEAD_WORKER";
  workerId?: string | null;
}

interface IAuthContext {
  user: IUser | null;
  loading: boolean;
  isRefreshing: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | null>(null);

// ✅ axios instance biar clean
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_DOMAIN,
  withCredentials: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshUser() {
    if (isRefreshing) return; // cegah overlap

    try {
      setIsRefreshing(true);

      const res = await api.get("/api/me");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await api.get("/api/me");
        if (isMounted) setUser(res.data);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isRefreshing,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
