"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiFileText,
  FiCalendar,
  FiX,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Image from "next/image";
import axios from "axios";

// Service & Types
import { getProjectDocumentations } from "@/services/documentation.service";
import type { Documentation } from "@/types/documentation.type";

export default function OwnerProjectDocumentationPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PENCARIAN & PAGINASI ---
  const [searchInput, setSearchInput] = useState(""); // Menampung ketikan langsung
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Menampung hasil delay
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8; // Menampilkan 8 card per halaman (grid 4x2 di desktop)

  // --- LOGIKA DEBOUNCE (DELAY PENCARIAN 500ms) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Otomatis kembali ke halaman 1 setiap ada pencarian baru
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const paramsNext = useParams();

  const targetProjectId = (paramsNext.projectId || paramsNext.id) as string;

  // --- GET DATA DOKUMENTASI PROYEK SPESIFIK ---
  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);

      if (!targetProjectId) {
        toast.error("ID Proyek tidak valid.");
        router.push("/owner");
        return;
      }

      const res = await getProjectDocumentations({
        projectId: targetProjectId,
        limit,
        page,
        // Menggunakan debouncedSearch agar API tidak dispam
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      setDocs(res.data);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (error: unknown) {
      // 1. Cek apakah ini error dari Axios (API)
      if (axios.isAxiosError(error)) {
        // 2. Cek apakah Server Mati atau Internet Putus (Tidak ada response)
        if (!error.response) {
          toast.error(
            "Gagal terhubung ke server. Periksa koneksi internet Anda.",
            { id: "network-error" },
          );
          return;
        }

        const status = error.response.status;
        const message =
          error.response.data?.message || "Terjadi kesalahan sistem.";

        // 3. Tangani berdasarkan Status Code spesifik
        if (status === 401) {
          toast.error("Sesi Anda telah berakhir. Silakan login kembali.", {
            id: "auth-error",
          });
          router.replace("/login");
          return;
        } else if (status === 403) {
          toast.error(`Akses Ditolak: ${message}`, { id: "forbidden-error" });
          router.push("/owner");
          return;
        } else if (status === 404 || status === 400) {
          toast.error("Proyek atau data laporan tidak ditemukan.", {
            id: "not-found-error",
          });
          router.push("/owner");
          return;
        } else if (status === 500) {
          toast.error("Server sedang bermasalah. Silahkan coba lagi.", {
            id: "server-error",
          });
          return;
        } else {
          toast.error(message, { id: "general-error" });
          return;
        }
      } else {
        // 4. Jika error berasal dari React/JavaScript (bukan API)
        toast.error("Terjadi kesalahan yang tidak terduga di browser Anda.", {
          id: "unknown-error",
        });
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, debouncedSearch, page, router]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* TOMBOL KEMBALI */}
        <button
          onClick={() => router.push(`/owner`)}
          className="flex items-center text-gray-500 hover:text-amber-600 transition-colors mb-6 group bg-transparent border-none cursor-pointer font-medium text-sm"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar Proyek
        </button>

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Riwayat Laporan Harian
            </h1>
            <p className="text-slate-500 text-sm mt-1 mb-4 sm:mb-0 max-w-lg">
              Pantau progres proyek rumah Anda secara transparan melalui bukti
              lapangan yang diunggah oleh tim.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* SEARCH BAR TEKS */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari area atau task..."
                value={searchInput || ""}
                onChange={(e) => setSearchInput(e.target.value)}
                className="block w-full text-black pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 sm:text-sm transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* FILTER TANGGAL (KALENDER SAJA) */}
            <div className="relative w-full sm:w-auto">
              <input
                type="date"
                title="Pilih tanggal dari kalender"
                value={
                  searchInput && /^\d{2}-\d{2}-\d{4}$/.test(searchInput)
                    ? searchInput.split("-").reverse().join("-")
                    : ""
                }
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  if ("showPicker" in HTMLInputElement.prototype) {
                    e.currentTarget.showPicker();
                  }
                }}
                onChange={(e) => {
                  const rawDate = e.target.value;
                  if (rawDate) {
                    const [year, month, day] = rawDate.split("-");
                    setSearchInput(`${day}-${month}-${year}`);
                  } else {
                    setSearchInput("");
                  }
                }}
                className="block w-full text-black px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 sm:text-sm transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* LIST DOKUMENTASI (GRID) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        ) : docs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() =>
                    router.push(
                      `/owner/project/${projectId}/documentation/${doc.id}`,
                    )
                  }
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-amber-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group relative cursor-pointer"
                >
                  {/* IMAGE HEADER */}
                  <div className="relative h-48 w-full bg-slate-100 border-b border-slate-100 overflow-hidden">
                    {doc.files && doc.files.length > 0 ? (
                      <>
                        {doc.files[0].fileType === "VIDEO" ? (
                          <video
                            src={doc.files[0].fileUrl}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            controls
                            preload="metadata"
                            playsInline
                            onClick={(e) => e.stopPropagation()} // Mencegah rambatan klik video
                          />
                        ) : (
                          <Image
                            src={doc.files[0].fileUrl}
                            alt="preview"
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/400x300.png?text=Gambar+Hilang";
                              e.currentTarget.srcset = "";
                            }}
                          />
                        )}
                        {doc.files.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                            +{doc.files.length - 1} File
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                        <FiFileText size={32} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">
                          Tidak ada media
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CARD CONTENT */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider ${
                              doc.session === "PAGI"
                                ? "bg-amber-100 text-amber-700 border border-amber-200/50"
                                : "bg-indigo-100 text-indigo-700 border border-indigo-200/50"
                            }`}
                          >
                            {doc.session}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <FiCalendar size={12} className="text-slate-400" />
                            {new Date(doc.reportDate)
                              .toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                              .replace(/\//g, "-")}
                          </span>
                        </div>
                      </div>

                      <h3
                        className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-1 group-hover:text-amber-600 transition-colors"
                        title={doc.workArea}
                      >
                        {doc.workArea}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.task}
                      </p>

                      {/* Menampilkan Target dan Progress berdampingan */}
                      {(doc.target || doc.progress) && (
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                          {doc.target && (
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                                Target
                              </p>
                              <p
                                className="text-xs text-slate-800 font-medium truncate"
                                title={doc.target}
                              >
                                {doc.target}
                              </p>
                            </div>
                          )}

                          {doc.progress && (
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                                Progres / Kendala
                              </p>
                              <p
                                className="text-xs text-slate-800 font-medium truncate"
                                title={doc.progress}
                              >
                                {doc.progress}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* FOOTER CARD: INFO PELAPOR ASLI */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-amber-50/30 -mx-5 -mb-5 p-3 rounded-b-2xl">
                      <div className="flex items-center gap-1.5 truncate">
                        <FiUser className="text-amber-500 shrink-0" size={13} />
                        <span className="font-medium truncate text-slate-700">
                          {doc.createdBy?.name || "Tim Lapangan"}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                        @{doc.createdBy?.username}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10 mb-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  <FiChevronLeft /> Sebelumnya
                </button>
                <span className="text-sm font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                  Hal {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  Selanjutnya <FiChevronRight />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              {debouncedSearch ? (
                <FiSearch className="w-10 h-10 text-slate-400" />
              ) : (
                <FiFileText className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              {debouncedSearch
                ? "Laporan Tidak Ditemukan"
                : "Belum Ada Laporan"}
            </h3>
            <p className="text-slate-500 text-center max-w-sm mb-0">
              {debouncedSearch
                ? `Tidak ada hasil untuk pencarian "${debouncedSearch}".`
                : "Tim lapangan belum mengirimkan dokumentasi progres untuk proyek ini."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
