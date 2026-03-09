"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "../../components/loading-screen";

type Props = { children: React.ReactNode };

export default function ProtectedLayout({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return <>{children}</>;
}
