"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  FiChevronLeft,
  FiClock,
  FiMap,
  FiTarget,
  FiActivity,
  FiImage,
  FiVideo,
  FiLoader,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

// Tambahkan impor adminDeleteDocumentation
import {
  getDocumentationById,
  adminDeleteDocumentation,
} from "@/services/documentation.service";
import type { Documentation } from "@/types/documentation.type";

export default function AdminDocumentationDetailPage() {
  const params = useParams();
  const urlProjectId = (params.projectId || params.id) as string;
  const documentationId = params.documentationId as string;

  const router = useRouter();

  const [data, setData] = useState<Documentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDocumentationById(documentationId);
      setData(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal memuat detail laporan",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [documentationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // --- EKSEKUSI HAPUS LAPORAN (ADMIN ONLY) ---
  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      "PENGHAPUSAN MUTLAK: Apakah Anda yakin ingin menghapus laporan ini beserta lampiran medianya dari server? Tindakan ini mengabaikan batas waktu dan tidak dapat dibatalkan.",
    );

    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      await adminDeleteDocumentation(documentationId);
      toast.success("Laporan berhasil dibumihanguskan dari sistem");

      // Jika sukses, tendang Admin kembali ke halaman daftar laporan proyek
      const finalProjectId = urlProjectId || data?.projectId;
      router.push(`/admin/project/${finalProjectId}/documentation`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message ||
            "Gagal mengeksekusi pembersihan laporan target",
        );
      } else {
        toast.error("Terjadi kesalahan sistem saat menghapus data.");
      }
      setIsDeleting(false); // Reset state jika gagal
    }
  };

  // Fallback navigasi mundur
  const handleGoBack = () => {
    const finalProjectId = urlProjectId || data?.projectId;
    if (finalProjectId) {
      router.push(`/admin/project/${finalProjectId}/documentation`);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }

  // UI state kosong
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <p className="text-gray-500 mb-4">Detail laporan tidak ditemukan.</p>
        <button
          onClick={handleGoBack}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer border-none"
        >
          Kembali ke Daftar Laporan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        {/* NAVIGASI & AKSI KHUSUS ADMIN */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors group bg-transparent border-none cursor-pointer font-medium text-sm"
          >
            <FiChevronLeft
              className="mr-1 group-hover:-translate-x-1 transition-transform"
              size={18}
            />
            Kembali ke Daftar Laporan Harian
          </button>

          {/* Tombol Hapus Paksa di Dalam Halaman Detail */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold text-sm cursor-pointer border border-red-100 hover:border-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Bumihanguskan Laporan Sepihak"
          >
            {isDeleting ? (
              <FiLoader className="animate-spin" size={16} />
            ) : (
              <FiTrash2 size={16} />
            )}
            {isDeleting ? "Menghapus..." : "Hapus Laporan Paksa"}
          </button>
        </div>

        <div className="space-y-6">
          {/* INFO DETAIL TUGAS */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border tracking-wider ${
                  data.session === "PAGI"
                    ? "bg-amber-50 text-amber-700 border-amber-200/40"
                    : "bg-blue-50 text-blue-700 border-blue-200/40"
                }`}
              >
                <FiClock size={14} /> Sesi {data.session}
              </span>
              <span className="text-gray-500 text-sm font-medium">
                {new Date(data.reportDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {data.task}
            </h1>

            <div className="flex items-center gap-2 text-gray-500 mb-8 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
              <FiMap className="text-gray-400" />
              <span className="font-medium text-sm">Area: {data.workArea}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FiTarget className="text-indigo-500" /> Target Pekerjaan
                </h3>
                <p className="text-gray-700 leading-relaxed bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl h-full">
                  {data.target || "Tidak ada rincian target yang dicantumkan."}
                </p>
              </div>

              {/* Progress Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FiActivity className="text-blue-500" /> Progres / Kendala
                </h3>
                <p className="text-gray-700 leading-relaxed bg-blue-50/50 border border-blue-100 p-4 rounded-2xl h-full whitespace-pre-wrap">
                  {data.progress ||
                    "Tidak ada rincian progres atau kendala yang dicantumkan."}
                </p>
              </div>
            </div>
          </div>

          {/* PELAPOR CARD */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0">
                {data.createdBy?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Dilaporkan Oleh
                </p>
                {/* Nama Lengkap (Utama) */}
                <p className="text-lg font-bold text-gray-800 leading-tight">
                  {data.createdBy?.name || "Tidak diketahui"}
                </p>
                {/* Username (Sekunder) */}
                <p className="text-xs font-medium text-indigo-600 mt-0.5">
                  @{data.createdBy?.username || "tidak-tersedia"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Waktu Upload:{" "}
                  {data.uploadedAt
                    ? new Date(data.uploadedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric", // ✅ PERBAIKAN 5: Tambah format tahun
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Waktu tidak tercatat"}
                </p>
              </div>
            </div>
          </div>

          {/* LAMPIRAN FILE */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
              <FiImage className="text-indigo-600" /> Bukti Dokumentasi Lapangan
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.files && data.files.length > 0 ? (
                data.files.map((file, index) => (
                  <div
                    key={file.cloudinaryId}
                    className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-40 md:h-48 w-full shadow-sm"
                  >
                    {file.fileType === "VIDEO" ? (
                      <div className="relative w-full h-full bg-black">
                        <video
                          src={file.fileUrl}
                          controls
                          preload="metadata"
                          playsInline
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm z-10 pointer-events-none">
                          <FiVideo /> VIDEO
                        </div>
                      </div>
                    ) : (
                      <div
                        className="relative w-full h-full cursor-pointer"
                        onClick={() => window.open(file.fileUrl, "_blank")}
                      >
                        <Image
                          src={file.fileUrl}
                          alt={`Bukti Dokumentasi ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                  <FiImage className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">
                    Tidak ada foto atau video yang dilampirkan pada laporan ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
