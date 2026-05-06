"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiChevronLeft,
  FiClock,
  FiMap,
  FiFileText,
  FiSearch,
  FiFilter,
  FiArrowDown,
  FiArrowUp,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

import { getProjectDocumentations } from "@/services/documentation.service";
import type { Documentation } from "@/types/documentation.type";

export default function ProjectDocumentationPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();

  // State Data & Status
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);

  // State Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<"reportDate" | "uploadedAt" | "session">(
    "reportDate",
  );
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // State Search dengan Debounce (Menunda pencarian agar API tidak dispam saat mengetik)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset ke halaman 1 setiap kali mencari kata baru
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProjectDocumentations({
        projectId,
        page,
        limit,
        sortBy,
        order,
        search: debouncedSearch || undefined,
      });

      setDocs(res.data);
      if (res.meta) setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal memuat laporan");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, page, limit, sortBy, order, debouncedSearch]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Fungsi Toggle Asc/Desc
  const toggleOrder = () => {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-5xl mx-auto">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.push(`/mandor/project/${projectId}`)}
          className="flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6 group bg-transparent border-none cursor-pointer"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Detail Proyek
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* HEADER BANNER */}
          <div className="bg-purple-600 px-6 py-8 md:px-10 md:py-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FiFileText /> Riwayat Laporan Harian
              </h1>
              <p className="text-purple-200 mt-2 text-sm md:text-base max-w-xl">
                Pantau progres proyek secara transparan melalui laporan yang
                diunggah secara rutin oleh Head Worker.
              </p>
            </div>
            {/* Dekorasi Background */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500 rounded-full opacity-50 blur-3xl"></div>
          </div>

          <div className="p-6 md:p-10">
            {/* TOOLBAR: SEARCH & SORTING */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari area kerja atau nama tugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
                />
              </div>

              {/* Sorting Controls */}
              <div className="flex gap-2">
                <div className="relative flex-1 md:w-48">
                  <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(
                        e.target.value as
                          | "reportDate"
                          | "uploadedAt"
                          | "session",
                      );
                      setPage(1);
                    }}
                    className="w-full pl-11 pr-8 py-3 bg-gray-50 border border-gray-100 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <option value="reportDate">Tanggal Kerja</option>
                    <option value="uploadedAt">Waktu Upload</option>
                    <option value="session">Sesi (Pagi/Sore)</option>
                  </select>
                </div>

                <button
                  onClick={toggleOrder}
                  className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center cursor-pointer"
                  title={
                    order === "asc"
                      ? "Urutan Naik (Lama ke Baru)"
                      : "Urutan Turun (Baru ke Lama)"
                  }
                >
                  {order === "asc" ? (
                    <FiArrowUp size={20} />
                  ) : (
                    <FiArrowDown size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* LIST LAPORAN */}
            <div className="space-y-4">
              {loading && docs.length === 0 ? (
                <div className="flex justify-center py-12">
                  <FiLoader className="animate-spin text-purple-600 text-3xl" />
                </div>
              ) : docs.length > 0 ? (
                docs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() =>
                      router.push(
                        `/mandor/project/${projectId}/documentation/${doc.id}`,
                      )
                    }
                    className="border border-gray-100 rounded-2xl p-5 hover:border-purple-300 hover:shadow-md transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-5 group cursor-pointer"
                  >
                    {/* Info Utama */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          <FiClock size={12} /> Sesi {doc.session}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">
                          {new Date(doc.reportDate).toLocaleDateString(
                            "id-ID",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">
                        {doc.task}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1.5">
                        <FiMap className="text-gray-400" /> {doc.workArea}
                      </p>
                    </div>

                    {/* Badge Pelapor (Menerapkan Opsi 1 Optional Chaining) */}
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl shrink-0">
                      <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm shadow-inner">
                        {doc.createdBy?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Dilaporkan Oleh
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {doc.createdBy?.name || "Tidak diketahui"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Diunggah:{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString(
                            "id-ID",
                            { month: "short", day: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                  <FiFileText className="mx-auto text-5xl text-gray-300 mb-4" />
                  <p className="text-gray-600 font-bold text-lg">
                    Laporan tidak ditemukan
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {debouncedSearch
                      ? `Tidak ada hasil untuk pencarian "${debouncedSearch}"`
                      : "Head Worker belum mengirimkan dokumentasi untuk proyek ini."}
                  </p>
                </div>
              )}
            </div>

            {/* PAGINATION CONTROLS */}
            {!loading && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-10 pt-6 border-t border-gray-100 gap-4">
                <p className="text-sm text-gray-500 font-medium">
                  Menampilkan Halaman{" "}
                  <span className="font-bold text-purple-600">{page}</span> dari{" "}
                  {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-purple-600 transition-all bg-white shadow-sm"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-purple-600 transition-all bg-white shadow-sm"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
