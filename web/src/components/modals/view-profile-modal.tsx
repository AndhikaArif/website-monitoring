"use client";

import { IoClose } from "react-icons/io5";
import { FiMapPin, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { ProfileTarget } from "@/types/profile.type";

interface ViewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileTarget | null;
}

function getModalTheme(role?: string) {
  switch (role) {
    case "ADMIN":
      return {
        avatarBg: "from-blue-100 to-blue-50 border-blue-100",
        avatarText: "text-blue-600",
        button: "bg-indigo-600 hover:bg-indigo-700",
      };
    case "MANDOR":
      return {
        avatarBg: "from-purple-100 to-purple-50 border-purple-100",
        avatarText: "text-purple-600",
        button: "bg-purple-600 hover:bg-purple-700",
      };
    case "KEPALA_TUKANG":
      return {
        avatarBg: "from-emerald-100 to-emerald-50 border-emerald-100",
        avatarText: "text-emerald-600",
        button: "bg-emerald-600 hover:bg-emerald-700",
      };
    case "OWNER":
      return {
        avatarBg: "from-amber-100 to-amber-50 border-amber-100",
        avatarText: "text-amber-600",
        button: "bg-amber-500 hover:bg-amber-600",
      };
    default:
      return {
        avatarBg: "from-gray-100 to-gray-50 border-gray-100",
        avatarText: "text-gray-600",
        button: "bg-slate-800 hover:bg-slate-900",
      };
  }
}

// Fungsi untuk memastikan format nomor valid untuk wa.me
function formatWhatsAppNumber(phone?: string | null) {
  if (!phone) return ""; // !phone akan menangkap undefined, null, maupun string kosong ("")
  let cleaned = phone.replace(/\D/g, ""); // Buang semua karakter selain angka (spasi, strip, +)

  // Jika diawali 0, ubah jadi 62
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  return cleaned;
}

export default function ViewProfileModal({
  isOpen,
  onClose,
  user: targetUser,
}: ViewProfileModalProps) {
  if (!isOpen || !targetUser) return null;

  // Asumsi role targetUser ada di properti role, jika tidak ada, fallback ke tema default
  const theme = getModalTheme(targetUser.role);

  const waNumber = formatWhatsAppNumber(targetUser.phoneNumber);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Detail Profil</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
              {/* Proteksi Username jika tidak tersedia */}
              {targetUser.username ? (
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-mono lowercase">
                  @{targetUser.username}
                </span>
              ) : (
                <span className="text-xs text-gray-400 italic">
                  ID tidak tersedia
                </span>
              )}
            </div>
          </div>

          {/* List Informasi Detail */}
          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <FiMail className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Email</p>
                {/* Proteksi Email jika tidak tersedia */}
                <p
                  className={`font-medium ${targetUser.email ? "text-gray-800" : "text-gray-400 italic"}`}
                >
                  {targetUser.email || "Tidak tersedia"}
                </p>
              </div>
            </div>

            {/* Nomor HP dengan WhatsApp Link */}
            <div className="flex items-start gap-3">
              <FaWhatsapp className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Nomor HP</p>
                {targetUser.phoneNumber ? (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 transition-colors"
                    title="Chat via WhatsApp"
                  >
                    {targetUser.phoneNumber}
                    {/* Opsional: Teks indikator kecil */}
                    <span className="text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600">
                      Hubungi WA
                    </span>
                  </a>
                ) : (
                  <p className="font-medium text-gray-400 italic">
                    Belum diisi
                  </p>
                )}
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
            className={`px-5 py-2 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer ${theme.button}`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
