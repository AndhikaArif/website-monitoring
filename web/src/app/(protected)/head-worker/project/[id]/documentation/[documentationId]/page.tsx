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
  FiEdit2,
  FiTrash2,
  FiLock,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

// Services & Types
import {
  getDocumentationById,
  deleteDocumentation,
} from "@/services/documentation.service";
import type { Documentation } from "@/types/documentation.type";

// Modal Component untuk Edit
import CreateDocumentationModal from "@/components/modals/documentation-modal";

import { useAuth } from "@/context/auth-context";

export default function HeadWorkerDocumentationDetailPage() {
  const params = useParams();
  const urlProjectId = (params.projectId || params.id) as string;
  const documentationId = params.documentationId as string;
  const router = useRouter();

  const { user: currentUser } = useAuth();

  // State Utama
  const [data, setData] = useState<Documentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // State Modal Edit
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- AMBIL DETAIL DOKUMENTASI ---
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
      } else {
        toast.error("Terjadi kesalahan sistem saat memuat data.");
      }
    } finally {
      setLoading(false);
    }
  }, [documentationId]);

  useEffect(() => {
    if (documentationId) {
      fetchDetail();
    }
  }, [documentationId, fetchDetail]);

  // --- LOGIKA HAPUS LAPORAN ---
  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus laporan harian ini? Tindakan ini tidak dapat dibatalkan.",
    );
    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      await deleteDocumentation(documentationId);
      toast.success("Laporan harian berhasil dihapus.");

      const finalProjectId = urlProjectId || data?.projectId;
      // Redirect kembali ke halaman daftar laporan utama milik head-worker
      router.push(`/head-worker/project/${finalProjectId}/documentation`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal menghapus laporan harian",
        );
      } else {
        toast.error("Terjadi kesalahan tak terduga.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoBack = () => {
    const finalProjectId = urlProjectId || data?.projectId;
    router.push(`/head-worker/project/${finalProjectId}/documentation`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-emerald-600 text-4xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <p className="text-gray-500 mb-4">
          Detail laporan tidak ditemukan atau telah dihapus.
        </p>
        <button
          onClick={handleGoBack}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Kembali ke Daftar Laporan
        </button>
      </div>
    );
  }

  // --- LOGIKA VALIDASI UX (FE) ---
  const isTimeValid = data.uploadedAt
    ? Date.now() - new Date(data.uploadedAt).getTime() < 24 * 60 * 60 * 1000
    : true;

  // Memeriksa apakah user yang sedang login adalah pembuat laporan ini
  const isCreator = data.createdById === currentUser?.id;

  // Tombol hanya aktif jika waktunya belum habis DAN dia adalah pembuatnya
  const canModify = isTimeValid && isCreator;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        {/* ================= BAR ATAS & ACTION BUTTONS ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-500 hover:text-emerald-600 font-medium transition-colors bg-transparent border-none cursor-pointer group text-sm"
          >
            <FiChevronLeft
              className="mr-1 group-hover:-translate-x-1 transition-transform"
              size={18}
            />
            Kembali ke Daftar Laporan
          </button>

          {/* TOMBOL EDIT DAN HAPUS */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isDeleting || !canModify}
              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !canModify
                  ? "Terkunci: Bukan milik Anda atau waktu habis"
                  : "Ubah Laporan"
              }
            >
              <FiEdit2
                size={16}
                className={canModify ? "text-emerald-600" : "text-slate-400"}
              />
              <span>Ubah</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || !canModify}
              className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100/70 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !canModify
                  ? "Terkunci: Bukan milik Anda atau waktu habis"
                  : "Hapus Laporan"
              }
            >
              {isDeleting ? (
                <FiLoader className="animate-spin" size={16} />
              ) : (
                <FiTrash2
                  size={16}
                  className={canModify ? "text-red-600" : "text-slate-400"}
                />
              )}
              <span>Hapus</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* ================= UX BANNER KUNCI KEPEMILIKAN / JIKA SUDAH LEWAT 24 JAM ================= */}
          {!canModify && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs sm:text-sm flex items-start sm:items-center gap-3 font-semibold shadow-sm animate-fadeIn">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                <FiLock size={20} />
              </div>
              <div>
                <p className="text-amber-900 font-bold">Laporan Terkunci</p>
                <p className="text-amber-700 font-normal text-xs mt-0.5">
                  {!isCreator
                    ? "Laporan ini dibuat oleh rekan kerja Anda sehingga tidak dapat Anda ubah atau hapus."
                    : "Laporan ini tidak dapat diubah atau dihapus kembali karena sudah melewati batas waktu 1x24 jam."}
                </p>
              </div>
            </div>
          )}

          {/* ================= KONTEN INFO DETAIL TUGAS ================= */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border tracking-wider ${
                  data.session === "PAGI"
                    ? "bg-amber-50 text-amber-700 border-amber-200/40"
                    : "bg-blue-50 text-blue-700 border-blue-200/40"
                }`}
              >
                {" "}
                <FiClock size={14} /> SESI {data.session}
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

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3 leading-tight tracking-tight">
              {data.task}
            </h1>

            <div className="flex items-center gap-2 text-gray-500 mb-8 bg-slate-50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
              <FiMap className="text-slate-400" />
              <span className="font-semibold text-sm text-slate-700">
                Area Pekerjaan: {data.workArea}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              {/* Seksi Target */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FiTarget className="text-indigo-500" /> Target Pekerjaan
                </h3>
                <p className="text-black text-sm leading-relaxed bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-2xl h-full">
                  {data.target || "Tidak ada rincian target yang dicantumkan."}
                </p>
              </div>

              {/* Seksi Progress */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FiActivity className="text-emerald-500" /> Progres / Kendala
                  Lapangan
                </h3>
                <p className="text-black text-sm leading-relaxed bg-emerald-50/30 border border-emerald-100/50 p-4 rounded-2xl h-full whitespace-pre-wrap">
                  {data.progress ||
                    "Tidak ada rincian progres atau kendala yang dicantumkan."}
                </p>
              </div>
            </div>
          </div>

          {/* ================= KARTU PEMBUAT LAPORAN ================= */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0">
                {data.createdBy?.name?.charAt(0).toUpperCase() || "T"}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Dilaporkan Oleh
                </p>
                <p className="text-base font-bold text-slate-800 leading-tight">
                  {data.createdBy?.name || "Rekan Kerja"}
                </p>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">
                  @{data.createdBy?.username || "tidak-tersedia"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Waktu Upload:{" "}
                  {data.uploadedAt
                    ? new Date(data.uploadedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Waktu tidak tercatat"}
                </p>
              </div>
            </div>
          </div>

          {/* ================= BUKTI MEDIA (LAMPIRAN FILE) ================= */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <FiImage className="text-emerald-600" /> Bukti Dokumentasi
              Lapangan
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.files && data.files.length > 0 ? (
                data.files.map((file, index) => (
                  <div
                    key={file.cloudinaryId || index}
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
                <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl bg-slate-50/50">
                  <FiImage className="mx-auto text-4xl text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500 font-medium">
                    Tidak ada foto atau video yang dilampirkan pada laporan ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= PEMANGGILAN MODAL EDIT ================= */}
        <CreateDocumentationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={urlProjectId}
          isFormLocked={false} // Diizinkan modifikasi jika sedang mode edit penuh
          initialDate={data.reportDate}
          initialSession={data.session}
          editingDoc={data} // Mengirim objek laporan utuh ke modal
          onSuccess={() => {
            setIsModalOpen(false);
            fetchDetail(); // Tarik ulang data detail terbaru setelah sukses update
          }}
        />
      </div>
    </div>
  );
}
