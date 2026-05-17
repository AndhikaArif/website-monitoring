"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "../../components/loading-screen";
import Navbar from "@/components/navbar";
import toast from "react-hot-toast";

const roleRootMap: Record<string, string> = {
  ADMIN: "/admin",
  MANDOR: "/mandor",
  OWNER: "/owner",
  KEPALA_TUKANG: "/head-worker",
};

const roleLandingMap: Record<string, string> = {
  ADMIN: "/admin/mandor",
  MANDOR: "/mandor/project",
  OWNER: "/owner",
  KEPALA_TUKANG: "/head-worker",
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    // Pintu Pemeriksaan Akses (Role-Based Access Control)
    if (!loading && user) {
      const allowedRoot = roleRootMap[user.role];
      const landingPage = roleLandingMap[user.role];

      // Jika URL yang dikunjungi BUKAN milik Role tersebut
      if (allowedRoot && !pathname.toLowerCase().startsWith(allowedRoot)) {
        // Jika user berada di root "/" (baru selesai login), arahkan dengan senyap tanpa memarahi
        if (pathname === "/") {
          router.replace(landingPage);
        } else {
          // Jika benar-benar menyusup ke folder role lain (Misal: Owner maksa masuk ke /admin)
          toast.error("Akses Ditolak: Anda mencoba memasuki area terlarang.", {
            id: "unauthorized-route",
          });
          router.replace(landingPage);
        }
      }
    }
  }, [loading, user, router, pathname]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
