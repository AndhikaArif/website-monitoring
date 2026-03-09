"use client";

import { useTheme } from "@/context/theme-context";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";
import { IoMenu } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { IoSunny } from "react-icons/io5";
import { IoMoon } from "react-icons/io5";
import { IoSearch } from "react-icons/io5";
import { GoHome } from "react-icons/go";
import { IoCreateOutline } from "react-icons/io5";
import { BsCalendar4Event } from "react-icons/bs";
import { LuTicket } from "react-icons/lu";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, logout, userImage } = useAuth();
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const isCustomer = user?.role === "CUSTOMER";
  const isEO = user?.role === "EVENT_ORGANIZER";

  const handleSearch = () => {
    if (!keyword.trim()) return;

    router.push(`/events?search=${encodeURIComponent(keyword)}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Top Navbar */}
      <nav
        className={`flex justify-between items-center py-4 px-4 md:px-8 w-full border-b border-gray-300 transition-colors duration-300 ${
          isDark ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="text-2xl font-semibold tracking-wide">
          Pojok Property
        </Link>

        {/* Search bar */}
        <div
          className={`flex items-center w-62.5 md:w-125 border rounded-2xl pl-4 pr-2 py-1.5 transition-colors duration-300 ${
            isDark
              ? "bg-gray-700 border-gray-500 text-white"
              : "bg-gray-100 border-gray-300 text-gray-500"
          }`}
        >
          <input
            type="text"
            placeholder="Search event..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className={`flex-1 bg-transparent outline-none text-sm ${
              isDark ? "placeholder-gray-300" : "placeholder-gray-500"
            }`}
          />

          <button onClick={handleSearch}>
            <IoSearch
              className={`text-xl cursor-pointer transition-colors duration-300 ${
                isDark ? "text-white" : "text-black"
              }`}
            />
          </button>
        </div>

        {/* Hamburger (mobile only) */}
        <button
          className="text-3xl cursor-pointer hover:opacity-50 sm:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? (
            <IoClose className="text-3xl" />
          ) : (
            <IoMenu className="text-3xl" />
          )}
        </button>

        {/* Mobile dropdown menu */}
        {isOpen && (
          <div
            ref={menuRef}
            className={`absolute top-16 right-4 px-4 py-4 w-50 sm:hidden flex flex-col gap-4 shadow-xl transition duration-300 ${
              isDark ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
            }`}
          >
            <div className="flex flex-col gap-4 ">
              {loading ? (
                <div className="opacity-50 text-sm">...</div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <Link href="/profile">
                    <div className="relative h-9 w-9 cursor-pointer">
                      <Image
                        src={userImage}
                        className="rounded-full border object-cover"
                        fill
                        alt="Photo Profile"
                      />
                    </div>
                  </Link>

                  <button
                    onClick={logout}
                    className="text-red-400 hover:underline cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="transition-colors duration-300 hover:text-blue-400"
                  >
                    Register
                  </Link>

                  <Link
                    href="/login"
                    className="transition-colors duration-300 hover:text-blue-400"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="border border-gray-200 w-41.25"></div>
              <div className="flex justify-between">
                <button
                  onClick={toggleTheme}
                  className="text-md hover:text-blue-400 transition-transform duration-150 cursor-pointer"
                >
                  {isDark ? "Light Mode" : "Dark Mode"}
                </button>

                <button
                  onClick={toggleTheme}
                  className="text-xl hover:scale-120 transition-transform duration-150 cursor-pointer"
                >
                  {isDark ? (
                    <IoSunny className="text-yellow-400" />
                  ) : (
                    <IoMoon className="text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dekstop Navigation */}
        <div className="hidden sm:flex items-center gap-12">
          {!user && (
            <Link
              href="/events/create"
              className="transition-colors duration-300 hover:text-blue-400"
            >
              Create
            </Link>
          )}

          {user && isEO && (
            <Link
              href="/events/create"
              className="transition-colors duration-300 hover:text-blue-400"
            >
              Create
            </Link>
          )}

          {user && isCustomer && (
            <Link
              href="/tickets"
              className="transition-colors duration-300 hover:text-blue-400"
            >
              My Tickets
            </Link>
          )}

          <Link
            href="./events"
            className="transition-colors duration-300 hover:text-blue-400"
          >
            Events
          </Link>

          <div className="flex gap-3 items-center">
            {loading ? (
              <div className="opacity-50 text-sm">...</div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <div className="relative h-9 w-9 cursor-pointer">
                    <Image
                      src={userImage}
                      className="rounded-full border object-cover"
                      fill
                      alt="Photo Profile"
                    />
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="text-red-400 hover:underline cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="transition-colors duration-300 hover:text-blue-400"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="transition-colors duration-300 hover:text-blue-400"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="hidden sm:flex text-xl hover:scale-120 transition-transform duration-150 cursor-pointer"
          >
            {isDark ? (
              <IoSunny className="text-yellow-400" />
            ) : (
              <IoMoon className="text-gray-600" />
            )}
          </button>
        </div>
      </nav>

      {/* Bottom Navbar */}
      <nav
        className={`fixed bottom-0 h-20 flex justify-between items-center px-15 w-full border-t border-gray-300 transition-colors duration-300 sm:hidden ${
          isDark ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <Link href="/" className="hover:scale-110 duration-300">
          <div className="flex flex-col items-center gap-1">
            <GoHome className="text-2xl" />
            <h3 className="text-sm">Home</h3>
          </div>
        </Link>

        {user && isCustomer ? (
          <Link href="/tickets" className="hover:scale-110 duration-300">
            <div className="flex flex-col items-center gap-1">
              <LuTicket className="text-2xl" />
              <h3 className="text-sm">My Tickets</h3>
            </div>
          </Link>
        ) : (
          <Link href="/events/create" className="hover:scale-110 duration-300">
            <div className="flex flex-col items-center gap-1">
              <IoCreateOutline className="text-2xl" />
              <h3 className="text-sm">Create</h3>
            </div>
          </Link>
        )}

        <Link href="/events" className="hover:scale-110 duration-300">
          <div className="flex flex-col items-center gap-1">
            <BsCalendar4Event className="text-lg" />
            <h3 className="text-sm">Events</h3>
          </div>
        </Link>
      </nav>
    </>
  );
}
