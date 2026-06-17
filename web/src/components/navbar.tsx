"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  IoMenu,
  IoClose,
  IoLogOutOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { usePathname } from "next/navigation";
import EditProfileModal from "@/components/modals/edit-profile-modal";

// Helper tema warna
function getRoleTheme(role?: string) {
  switch (role) {
    case "ADMIN":
      return {
        primary: "bg-blue-600",
        text: "text-blue-600",
        hover: "hover:text-blue-500",
      };
    case "MANDOR":
      return {
        primary: "bg-purple-600",
        text: "text-purple-600",
        hover: "hover:text-purple-500",
      };
    case "KEPALA_TUKANG":
      return {
        primary: "bg-emerald-600",
        text: "text-emerald-600",
        hover: "hover:text-emerald-500",
      };
    case "OWNER":
      return {
        primary: "bg-amber-600",
        text: "text-amber-600",
        hover: "hover:text-amber-500",
      };
    default:
      return {
        primary: "bg-gray-600",
        text: "text-gray-600",
        hover: "hover:text-gray-500",
      };
  }
}

function getHomeByRole(role?: string) {
  switch (role) {
    case "ADMIN":
      return "/admin/mandor";
    case "MANDOR":
      return "/mandor/project";
    case "KEPALA_TUKANG":
      return "/head-worker";
    case "OWNER":
      return "/owner";
    default:
      return "/login";
  }
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  const theme = getRoleTheme(user?.role);
  const role = user?.role;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link href={getHomeByRole(role)} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 ${theme.primary} rounded-lg flex items-center justify-center text-white font-bold`}
            >
              P
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block tracking-tight">
              Pojok Property
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {/* 🔵 MENU KHUSUS ADMIN */}
            {role === "ADMIN" && (
              <>
                <Link
                  href="/admin/mandor"
                  className={
                    pathname.includes("/admin/mandor")
                      ? `${theme.text} font-bold`
                      : `text-gray-600 ${theme.hover}`
                  }
                >
                  Mandor
                </Link>

                {/* Tautan baru menuju Proyek */}
                <Link
                  href="/admin/project"
                  className={
                    pathname.includes("/admin/project")
                      ? `${theme.text} font-bold`
                      : `text-gray-600 ${theme.hover}`
                  }
                >
                  Proyek
                </Link>

                <Link
                  href="/admin/arsip"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Arsip
                </Link>

                <Link
                  href="/admin/users"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Users
                </Link>
              </>
            )}

            {/* 🟣 MENU KHUSUS MANDOR */}
            {role === "MANDOR" && (
              <>
                <Link
                  href="/mandor/project"
                  className={
                    pathname.includes("/project")
                      ? `${theme.text} font-bold`
                      : `text-gray-600 ${theme.hover}`
                  }
                >
                  Proyek
                </Link>

                <Link
                  href="/mandor/head-worker"
                  className={
                    pathname.includes("/head-worker")
                      ? `${theme.text} font-bold`
                      : `text-gray-600 ${theme.hover}`
                  }
                >
                  Kepala Tukang
                </Link>

                <Link
                  href="/mandor/owner"
                  className={
                    pathname.includes("/owner")
                      ? `${theme.text} font-bold`
                      : `text-gray-600 ${theme.hover}`
                  }
                >
                  Owner
                </Link>
              </>
            )}

            <div className="h-6 w-px bg-gray-200 mx-2" />

            {loading ? (
              <div className="h-4 w-12 bg-gray-100 animate-pulse rounded" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="text-[12px] font-bold text-gray-900 leading-none">
                    {user.name}
                  </p>
                  <p
                    className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider mt-1`}
                  >
                    {user.role?.replace("_", " ")}
                  </p>
                </div>

                {/* Tombol Buka Modal Profil */}
                {user.role !== "ADMIN" && (
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    title="Profil Saya"
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <IoPersonOutline size={20} />
                  </button>
                )}

                <button
                  onClick={logout}
                  title="Keluar"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <IoLogOutOutline size={22} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`${theme.primary} text-white px-5 py-2 rounded-xl hover:opacity-90 transition-all`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            className={`md:hidden text-2xl relative z-55 ${isOpen ? "text-red-500" : "text-gray-700"} cursor-pointer`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <IoClose /> : <IoMenu />}
          </button>
        </div>

        {/* Overlay Background */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar Menu */}
        <div
          className={`
          fixed top-0 right-0 h-screen w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        >
          <div className="p-6 flex flex-col gap-6 pt-20 h-full">
            {/* 🔵 MENU MOBILE KHUSUS ADMIN */}
            {role === "ADMIN" && (
              <>
                <Link
                  href="/admin/mandor"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Mandor
                </Link>

                <Link
                  href="/admin/project"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Proyek
                </Link>

                <Link
                  href="/admin/arsip"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Arsip
                </Link>

                <Link
                  href="/admin/users"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Users
                </Link>
              </>
            )}

            {/* 🟣 MENU MOBILE KHUSUS MANDOR */}
            {role === "MANDOR" && (
              <>
                <Link
                  href="/mandor/project"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Proyek
                </Link>

                <Link
                  href="/mandor/head-worker"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Kepala Tukang
                </Link>

                <Link
                  href="/mandor/owner"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 font-medium"
                >
                  Owner
                </Link>
              </>
            )}

            {/* Menu Profil & Logout di Mobile */}
            {user && (
              <div className="mt-auto border-t pt-4 space-y-4">
                {user.role !== "ADMIN" && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="text-gray-700 font-medium flex items-center gap-2 w-full text-left"
                  >
                    <IoPersonOutline size={20} /> Profil Saya
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="text-red-500 font-bold flex items-center gap-2 w-full text-left"
                >
                  <IoLogOutOutline size={20} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Pasang Modal Edit Profile di luar hierarki navigasi agar z-index optimal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
