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

export default function EditProfileModal({
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setLoadingFetch(true);
      getMyProfile()
        .then((data) => {
          // Nama pasti sudah ada dari database, langsung kita pasang sebagai default value
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setMessage(null);

    // Validasi ekstra: Jangan izinkan user mengosongkan nama
    if (!name.trim()) {
      setMessage({ type: "error", text: "Nama lengkap tidak boleh kosong." });
      setLoadingSubmit(false);
      return;
    }

    try {
      await updateMyProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        address: address.trim() || undefined,
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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn">
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
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all"
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
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all"
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
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all resize-none"
                />
              </div>
            </>
          )}

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
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingSubmit ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
