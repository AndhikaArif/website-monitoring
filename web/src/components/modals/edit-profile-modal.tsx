"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import { getMyProfile, updateMyProfile } from "@/services/profile.service";
import { useAuth } from "@/context/auth-context";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getModalTheme(role?: string) {
  switch (role) {
    case "ADMIN":
      return {
        button: "bg-blue-600 hover:bg-blue-700",
        focus: "focus:border-blue-500 focus:ring-blue-500/20",
      };
    case "MANDOR":
      return {
        button: "bg-purple-600 hover:bg-purple-700",
        focus: "focus:border-purple-500 focus:ring-purple-500/20",
      };
    case "KEPALA_TUKANG":
      return {
        button: "bg-emerald-600 hover:bg-emerald-700",
        focus: "focus:border-emerald-500 focus:ring-emerald-500/20",
      };
    case "OWNER":
      return {
        button: "bg-amber-500 hover:bg-amber-600",
        focus: "focus:border-amber-500 focus:ring-amber-500/20",
      };
    default:
      return {
        button: "bg-slate-800 hover:bg-slate-900",
        focus: "focus:border-slate-500 focus:ring-slate-500/20",
      };
  }
}

export default function EditProfileModal({
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const { user: currentUser, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const theme = getModalTheme(currentUser?.role);

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setLoadingFetch(true);
      getMyProfile()
        .then((data) => {
          setName(data.name || "");
          setPhoneNumber(data.phoneNumber || "");
          setAddress(data.address || "");
        })
        .catch((err) => {
          console.error("Gagal memuat profil:", err);
          setMessage({
            type: "error",
            text: "Gagal memuat data profil saat ini.",
          });
        })
        .finally(() => {
          setLoadingFetch(false);
        });
    } else {
      // Bersihkan state saat modal ditutup agar tidak membekas saat dibuka lagi
      setName("");
      setPhoneNumber("");
      setAddress("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: "error", text: "Nama lengkap tidak boleh kosong." });
      setLoadingSubmit(false);
      return;
    }

    try {
      await updateMyProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || null,
        address: address.trim() || null,
      });

      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      await refreshUser();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Terjadi kesalahan saat memperbarui profil.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn"
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Profil Saya</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-xl text-sm font-medium text-center ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          {loadingFetch ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-gray-100 rounded-xl w-full" />
              <div className="h-10 bg-gray-100 rounded-xl w-full" />
              <div className="h-20 bg-gray-100 rounded-xl w-full" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama"
                  className={`w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all ${theme.focus}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Nomor HP
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className={`w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all ${theme.focus}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Alamat
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat domisili"
                  className={`w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all resize-none ${theme.focus}`}
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingSubmit}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingFetch || loadingSubmit}
              className={`flex-1 py-2.5 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer ${theme.button}`}
            >
              {loadingSubmit ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
