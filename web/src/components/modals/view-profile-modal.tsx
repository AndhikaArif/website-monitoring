"use client";

import { IoClose } from "react-icons/io5";
import { FiPhone, FiMapPin, FiMail } from "react-icons/fi";
import { Mandor } from "@/types/mandor.type";
import { useAuth } from "@/context/auth-context";

interface ViewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Mandor | null;
}

function getModalTheme(role?: string) {
  switch (role) {
    case "ADMIN":
      return {
        avatarBg: "from-blue-100 to-blue-50 border-blue-100",
        avatarText: "text-blue-600",
      };
    case "MANDOR":
      return {
        avatarBg: "from-purple-100 to-purple-50 border-purple-100",
        avatarText: "text-purple-600",
      };
    case "KEPALA_TUKANG":
      return {
        avatarBg: "from-emerald-100 to-emerald-50 border-emerald-100",
        avatarText: "text-emerald-600",
      };
    case "OWNER":
      return {
        avatarBg: "from-amber-100 to-amber-50 border-amber-100",
        avatarText: "text-amber-600",
      };
    default:
      return {
        avatarBg: "from-gray-100 to-gray-50 border-gray-100",
        avatarText: "text-gray-600",
      };
  }
}

export default function ViewProfileModal({
  isOpen,
  onClose,
  user: targetUser,
}: ViewProfileModalProps) {
  const { user: currentUser } = useAuth();

  if (!isOpen || !targetUser) return null;

  const theme = getModalTheme(currentUser?.role);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Detail Profil</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-5">
          {/* Bagian Avatar & Nama */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
            <div
              className={`w-14 h-14 rounded-full bg-linear-to-tr ${theme.avatarBg} flex items-center justify-center ${theme.avatarText} font-extrabold text-xl border`}
            >
              {targetUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">
                {targetUser.name}
              </h4>
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-mono lowercase">
                @{targetUser.username}
              </span>
            </div>
          </div>

          {/* List Informasi Detail */}
          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <FiMail className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className="font-medium text-gray-800">{targetUser.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiPhone className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Nomor HP</p>
                <p
                  className={`font-medium ${targetUser.phoneNumber ? "text-gray-800" : "text-gray-400 italic"}`}
                >
                  {targetUser.phoneNumber || "Belum diisi"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiMapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">
                  Alamat Domisili
                </p>
                <p
                  className={`font-medium ${targetUser.address ? "text-gray-800" : "text-gray-400 italic"}`}
                >
                  {targetUser.address || "Belum diisi"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
