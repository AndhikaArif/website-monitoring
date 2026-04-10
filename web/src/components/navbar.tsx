"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { IoMenu, IoClose } from "react-icons/io5";
import { GoHome } from "react-icons/go";
import { IoImagesOutline } from "react-icons/io5";
import { IoPeopleOutline } from "react-icons/io5";
import { IoCloudUploadOutline } from "react-icons/io5";

function getHomeByRole(role?: string) {
  switch (role) {
    case "ADMIN":
      return "/admin/mandor";
    case "MANDOR":
      return "/mandor/head-worker";
    case "HEAD_WORKER":
      return "/upload";
    default:
      return "/login";
  }
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const role = user?.role;

  return (
    <nav className="flex justify-between items-center py-4 px-6 border-b">
      {/* Logo */}
      <Link href={getHomeByRole(role)} className="text-xl font-semibold">
        Monitoring Proyek
      </Link>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-6">
        <Link href={getHomeByRole(role)}>Dashboard</Link>

        {role === "ADMIN" && <Link href="/admin/mandor">Kelola Mandor</Link>}

        {role === "MANDOR" && (
          <>
            <Link href="/projects">Dokumentasi Proyek</Link>
          </>
        )}

        {role === "HEAD_WORKER" && (
          <Link href="/upload">Upload Dokumentasi</Link>
        )}

        {/* Auth */}
        {loading ? (
          <span>...</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span
              className={`font-bold px-2 py-0.5 rounded-lg ${
                user.role === "ADMIN"
                  ? "text-blue-600 bg-blue-50"
                  : user.role === "MANDOR"
                    ? "text-purple-600 bg-purple-50"
                    : "text-emerald-600 bg-emerald-50"
              }`}
            >
              {user.name}
            </span>
            <button onClick={logout} className="text-red-500 cursor-pointer">
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>

      {/* Mobile Button */}
      <button
        className="sm:hidden text-2xl cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <IoClose /> : <IoMenu />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 right-4 bg-white text-black shadow p-4 flex flex-col gap-3 sm:hidden">
          <Link href={getHomeByRole(role)}>Dashboard</Link>

          {role === "ADMIN" && <Link href="/admin/mandor">Kelola Mandor</Link>}

          {role === "MANDOR" && (
            <>
              <Link href="/projects">Dokumentasi</Link>
              <Link href="/mandor/head-worker">Head Worker</Link>
            </>
          )}

          {role === "HEAD_WORKER" && <Link href="/upload">Upload</Link>}

          {user && (
            <button onClick={logout} className="text-red-500 cursor-pointer">
              Logout
            </button>
          )}
        </div>
      )}

      {/* Bottom Mobile Nav */}
      <div className="fixed bottom-0 text-black w-full flex justify-around py-3 border-t sm:hidden bg-white">
        <Link href={getHomeByRole(role)}>
          <GoHome className="text-xl" />
        </Link>

        {role === "MANDOR" && (
          <Link href="/projects">
            <IoImagesOutline className="text-xl" />
          </Link>
        )}

        {role === "HEAD_WORKER" && (
          <Link href="/upload">
            <IoCloudUploadOutline className="text-xl" />
          </Link>
        )}

        {role === "ADMIN" && (
          <Link href="/admin/mandor">
            <IoPeopleOutline className="text-xl" />
          </Link>
        )}
      </div>
    </nav>
  );
}
