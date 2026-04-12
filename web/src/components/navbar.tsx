"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { IoMenu, IoClose, IoLogOutOutline } from "react-icons/io5";
import { usePathname } from "next/navigation";

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
    case "HEAD_WORKER":
      return {
        primary: "bg-emerald-600",
        text: "text-emerald-600",
        hover: "hover:text-emerald-500",
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
    case "HEAD_WORKER":
      return "/head/worker";
    default:
      return "/login";
  }
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  const theme = getRoleTheme(user?.role);
  const role = user?.role;

  return (
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
          {role === "MANDOR" && (
            <>
              <Link
                href="/mandor/head-worker"
                className={
                  pathname.includes("/head-worker")
                    ? `${theme.text} font-bold`
                    : `text-gray-600 ${theme.hover}`
                }
              >
                Head Worker
              </Link>
              <Link
                href="/mandor/project"
                className={
                  pathname.includes("/project")
                    ? `${theme.text} font-bold`
                    : `text-gray-600 ${theme.hover}`
                }
              >
                Dokumentasi
              </Link>
            </>
          )}

          {role === "HEAD_WORKER" && (
            <Link
              href="/upload"
              className={
                pathname === "/upload"
                  ? `${theme.text} font-bold`
                  : `text-gray-600 ${theme.hover}`
              }
            >
              Upload File
            </Link>
          )}

          <div className="h-6 w-px bg-gray-200 mx-2" />

          {loading ? (
            <div className="h-4 w-12 bg-gray-100 animate-pulse rounded" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[12px] font-bold text-gray-900 leading-none">
                  {user.name}
                </p>
                <p
                  className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider mt-1`}
                >
                  {user.role?.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={logout}
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
          className={`md:hidden text-2xl z-50 ${isOpen ? "text-red-500" : "text-gray-700"} cursor-pointer`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <IoClose /> : <IoMenu />}
        </button>
      </div>

      {/* Overlay Background */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`
        fixed top-0 right-0 h-screen w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-60 md:hidden
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="p-6 flex flex-col gap-6 pt-20">
          {/* Link Dinamis berdasarkan Role di Mobile */}
          {role === "MANDOR" && (
            <>
              <Link
                href="/mandor/head-worker"
                onClick={() => setIsOpen(false)}
                className="text-gray-600 font-medium"
              >
                Head Worker
              </Link>
              <Link
                href="/mandor/project"
                onClick={() => setIsOpen(false)}
                className="text-gray-600 font-medium"
              >
                Dokumentasi
              </Link>
            </>
          )}

          {role === "HEAD_WORKER" && (
            <Link
              href="/upload"
              onClick={() => setIsOpen(false)}
              className="text-gray-600 font-medium"
            >
              Upload File
            </Link>
          )}

          <div className="mt-auto border-t pt-4">
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
        </div>
      </div>
    </nav>
  );
}
