"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface IUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  role: string;
  referralCode: string;
  profilePicture: string | null;
  createdAt: string;

  pointBalance: number;
  coupon: {
    code: string;
    discount: number;
    expiredAt: string;
  } | null;
}

interface IAuthContext {
  user: IUser | null;
  loading: boolean;
  userImage: string;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Fetch user on first load ----
  async function refreshUser() {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_DOMAIN}/api/user/get-current-user`,
        { withCredentials: true }
      );

      setUser(res.data);
    } catch {
      setUser(null);
    }
  }

  // ---- Logout ----
  async function logout() {
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_DOMAIN}/api/auth/logout`, {
        withCredentials: true,
      });
    } catch {}
    setUser(null);
  }

  useEffect(() => {
    async function init() {
      await refreshUser();
      setLoading(false);
    }
    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
        userImage:
          user?.profilePicture ||
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgsaRe2zqH_BBicvUorUseeTaE4kxPL2FmOQ&s",
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
