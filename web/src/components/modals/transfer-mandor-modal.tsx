"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiX, FiRefreshCw, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";

// Impor Service & Type
import { adminTransferMandor } from "@/services/project.service";
import type { AdminProject } from "@/types/project.type";

// Impor skema Zod dari berkas validasi Frontend
import {
  adminTransferMandorSchema,
  type AdminTransferMandorFormValues,
} from "@/validation/project.validation";

interface TransferMandorModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  project: AdminProject;
}

interface MandorCandidate {
  id: string;
  name: string;
  username: string;
}

export default function TransferMandorModal({
  isOpen,
  onClose,
  project,
}: TransferMandorModalProps) {
  const [mandors, setMandors] = useState<MandorCandidate[]>([]);
  const [loadingMandors, setLoadingMandors] = useState(true);

  // Inisialisasi React Hook Form terintegrasi dengan Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AdminTransferMandorFormValues>({
    resolver: zodResolver(adminTransferMandorSchema),
    defaultValues: {
      newMandorId: "",
      keepKepalaTukang: true, // Sesuai default Zod kita: pertahankan tim lama
    },
  });

  // Memanggil API untuk mengambil daftar kandidat Mandor aktif dari Backend
  const fetchMandorCandidates = useCallback(async () => {
    setLoadingMandors(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN || "";
      // Asumsi rute BE untuk mengambil user berstatus MANDOR
      const res = await axios.get(`${API_URL}/api/auth/mandor`, {
        withCredentials: true,
      });

      // Saring agar Mandor yang sedang memegang proyek ini tidak masuk daftar pilihan
      const allMandors: MandorCandidate[] = res.data?.data || res.data || [];
      const eligibleMandors = allMandors.filter(
        (m) => m.id !== project.mandor.id,
      );

      setMandors(eligibleMandors);
    } catch (error) {
      console.error("Gagal memuat daftar Mandor:", error);
      toast.error("Gagal memuat daftar pilihan Mandor");
    } finally {
      setLoadingMandors(false);
    }
  }, [project.mandor.id]);

  useEffect(() => {
    if (isOpen) {
      fetchMandorCandidates();
      reset({
        newMandorId: "",
        keepKepalaTukang: true,
      });
    }
  }, [isOpen, fetchMandorCandidates, reset]);

  // Eksekusi pengiriman form pemindahan
  const onSubmit = async (data: AdminTransferMandorFormValues) => {
    try {
      // 1. Tangkap response yang dikembalikan oleh fungsi service
      const result = await adminTransferMandor(project.id, {
        newMandorId: data.newMandorId,
        keepKepalaTukang: data.keepKepalaTukang,
      });

      // 2. Ekstrak pesan dinamis dengan aman (antisipasi struktur response langsung atau response.data)
      const successMessage =
        result?.message ||
        result?.data?.message ||
        "Mandor penanggung jawab berhasil dipindahtugaskan!";

      // 3. Tampilkan pesan spesifik dari Backend lewat toast
      toast.success(successMessage);

      onClose(true); // Tutup modal dan instruksikan dasbor untuk menyegarkan tabel
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Gagal memproses pemindahan Mandor",
        );
      } else {
        toast.error("Terjadi kesalahan sistem saat memproses permintaan");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* MENGADOPSI GAYA KARTU MODERN: rounded-3xl, shadow-xl, border bersih */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden">
        {/* HEADER MODAL */}
        <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <FiRefreshCw size={14} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base leading-tight">
                Transfer Mandor Proyek
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Pusat Kendali Otoritas Lapangan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all border-none cursor-pointer bg-transparent"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* INFO PROYEK SAAT INI (Diambil dari Props) */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/80 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Proyek Target
                </p>
                <p className="text-sm font-bold text-gray-800 mt-0.5 line-clamp-1">
                  {project.projectName}
                </p>
              </div>
              <span className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100 shadow-2xs">
                {project.status}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1.5">
                <FiUser className="text-gray-400" /> Mandor Lama:
              </span>
              <span className="font-semibold text-gray-700 truncate max-w-45">
                {project.mandor.name}
              </span>
            </div>
          </div>

          {/* PILIHAN MANDOR BARU */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Pilih Mandor Pengganti <span className="text-red-500">*</span>
            </label>
            <select
              {...register("newMandorId")}
              disabled={loadingMandors || isSubmitting}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Pilih Mandor Lapangan --</option>
              {loadingMandors ? (
                <option value="" disabled>
                  Memuat daftar Mandor...
                </option>
              ) : mandors.length > 0 ? (
                mandors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (@{m.username})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Tidak ada Mandor lain yang tersedia
                </option>
              )}
            </select>
            {errors.newMandorId && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">
                {errors.newMandorId.message}
              </p>
            )}
          </div>

          {/* OPSI KEPALA TUKANG */}
          {project._count.kepalaTukang > 0 && (
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
              <label className="relative flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("keepKepalaTukang")}
                  disabled={isSubmitting}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">
                    Pertahankan Tim Kepala Tukang
                  </span>
                  <span className="text-[11px] text-indigo-900/70 block mt-0.5 leading-relaxed">
                    Jika dicentang, {project._count.kepalaTukang} Kepala Tukang
                    aktif akan otomatis dipindahtugaskan ke bawah pengawasan
                    Mandor baru.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* FOOTER TOMBOL AKSI */}
          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all border-none cursor-pointer text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingMandors}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100 border-none cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Konfirmasi Transfer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
