"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiCalendar,
  FiX,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";

import { useAuth } from "@/context/auth-context";

// Service & Types
import { getProjectDocumentations } from "@/services/documentation.service";
import { getProjectDetail } from "@/services/project.service";
import type { GroupedDocumentation } from "@/types/documentation.type";

export default function MandorProjectDocumentationPage() {
  const params = useParams();
  const projectId = (params.projectId || params.id) as string;
  const router = useRouter();

  const { user: currentUser } = useAuth();
  const requestTimestampRef = useRef<number>(0);

  // 1. STATE UTAMA
  const [docs, setDocs] = useState<GroupedDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 2. STATE FILTER WAKTU & PENCARIAN
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [debouncedMonth, setDebouncedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [debouncedYear, setDebouncedYear] = useState(currentDate.getFullYear());
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // 3. STATE UNTUK TANGGAL MULAI PROYEK DAN HARI INI
  const [currentRealDate] = useState(new Date());
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(null);
  const [projectEndDate, setProjectEndDate] = useState<Date | null>(null);

  // --- AMBIL DETAIL PROYEK UNTUK BATAS TANGGAL ---
  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        if (!projectId) return;
        const res = await getProjectDetail(projectId);
        const rawStartDate = res.data?.startDate || res.data?.createdAt;
        const rawEndDate = res.data?.endDate;

        let start: Date | null = null;
        let end: Date | null = null;

        if (rawStartDate) {
          start = new Date(rawStartDate);
          setProjectStartDate(start);
        }

        if (rawEndDate) {
          end = new Date(rawEndDate);
          // Opsi validasi tambahan: cegah 'Invalid Date' jika string tanggal rusak
          if (!isNaN(end.getTime())) {
            setProjectEndDate(end);
          } else {
            end = null;
          }
        }

        // Menentukan Bulan & Tahun Tampilan Awal
        const today = new Date();
        let targetMonth = today.getMonth() + 1;
        let targetYear = today.getFullYear();

        if (end && today.getTime() > end.getTime()) {
          // Kasus A: Proyek sudah selesai di masa lalu -> Buka bulan terakhir proyek aktif
          targetMonth = end.getMonth() + 1;
          targetYear = end.getFullYear();
        } else if (start && today.getTime() < start.getTime()) {
          // Kasus B: Proyek belum mulai -> Buka bulan awal proyek
          targetMonth = start.getMonth() + 1;
          targetYear = start.getFullYear();
        }

        setSelectedMonth(targetMonth);
        setSelectedYear(targetYear);
        setDebouncedMonth(targetMonth);
        setDebouncedYear(targetYear);
      } catch (error) {
        console.error("Gagal mengambil data proyek", error);
        toast.error("Gagal memuat konfigurasi tanggal proyek.");
      } finally {
        setIsInitialized(true);
      }
    };

    fetchProjectInfo();
  }, [projectId]);

  // --- LOGIKA PENGUNCIAN TOMBOL NAVIGASI BULAN ---
  const isPrevMonthDisabled = () => {
    if (!projectStartDate) return false;
    const startYear = projectStartDate.getFullYear();
    const startMonth = projectStartDate.getMonth() + 1;

    if (selectedYear < startYear) return true;
    if (selectedYear === startYear && selectedMonth <= startMonth) return true;

    return false;
  };

  const isNextMonthDisabled = () => {
    // Tentukan batas maksimal navigasi kalender
    const limitDate = projectEndDate ? projectEndDate : currentRealDate;

    const limitYear = limitDate.getFullYear();
    const limitMonth = limitDate.getMonth() + 1;

    // Kunci tombol next jika tahun yang dipilih lebih besar dari batas
    if (selectedYear > limitYear) return true;

    // Kunci tombol next jika tahun sama, dan bulan yang dipilih sudah mencapai atau melewati batas
    if (selectedYear === limitYear && selectedMonth >= limitMonth) return true;

    return false;
  };

  // --- LOGIKA DEBOUNCE PENCARIAN ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- LOGIKA DEBOUNCE BULAN & TAHUN ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMonth(selectedMonth);
      setDebouncedYear(selectedYear);
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedMonth, selectedYear]);

  // --- GET DATA BERDASARKAN BULAN, TAHUN & KEYWORD ---
  const fetchDocs = useCallback(async () => {
    if (!isInitialized) return;

    const currentTimestamp = Date.now();
    requestTimestampRef.current = currentTimestamp;

    try {
      setLoading(true);

      if (!projectId) {
        toast.error("ID Proyek tidak valid.");
        router.push("/mandor/project");
        return;
      }

      const res = await getProjectDocumentations({
        projectId,
        month: debouncedMonth,
        year: debouncedYear,
        order: sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      // VALIDASI: Abaikan jika request sudah usang
      if (currentTimestamp !== requestTimestampRef.current) {
        return;
      }

      setDocs(res.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          toast.error(
            "Gagal terhubung ke server. Periksa koneksi internet Anda.",
          );
          return;
        }

        const status = error.response.status;
        const message = error.response.data?.message || "Terjadi kesalahan.";

        if (status === 401) {
          toast.error("Sesi berakhir. Silakan login kembali.");
          router.replace("/login");
        } else if (status === 403 || status === 404 || status === 400) {
          toast.error(message);
          router.push("/mandor/project");
        } else {
          toast.error(message);
        }
      } else {
        toast.error("Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
      if (currentTimestamp === requestTimestampRef.current) {
        setLoading(false);
      }
    }
  }, [
    projectId,
    debouncedSearch,
    debouncedMonth,
    debouncedYear,
    sortOrder,
    router,
    isInitialized,
  ]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // --- NAVIGASI BULAN & TAHUN ---
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Tahan render utama jika inisialisasi tanggal proyek belum selesai
  if (!isInitialized) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 text-black">
        <FiLoader className="animate-spin text-purple-600 text-4xl mb-4" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Memuat data proyek...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* TOMBOL KEMBALI */}
        <button
          onClick={() => router.push(`/mandor/project/${projectId}`)}
          className="flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6 group bg-transparent border-none cursor-pointer font-medium text-sm"
        >
          <FiChevronLeft
            className="mr-1 group-hover:-translate-x-1 transition-transform"
            size={18}
          />
          Kembali ke Detail Proyek
        </button>

        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-purple-500">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Riwayat Laporan Harian
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {currentUser?.name
                  ? `Halo Mandor ${currentUser.name}, Pantau progres kerja lapangan`
                  : "Selamat datang."}
              </p>
            </div>

            {/* BADGE TANGGAL PROYEK */}
            {projectStartDate && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-900 rounded-lg text-sm font-medium border border-gray-100 w-fit">
                <FiCalendar size={16} className="shrink-0" />
                <span>
                  {projectStartDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  —{" "}
                  {projectEndDate
                    ? projectEndDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Sekarang (Berjalan)"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            {/* INPUT PENCARIAN */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <FiSearch size={18} />
              </span>
              <input
                type="text"
                placeholder="Cari area / aktivitas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-black placeholder-slate-400 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* TOMBOL FILTER TERBARU/TERLAMA */}
            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
              }
              className="flex items-center justify-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              title="Ubah Urutan"
            >
              Urutan:{" "}
              <span className="ml-1 text-purple-600 font-bold">
                {sortOrder === "desc" ? "Terbaru" : "Terlama"}
              </span>
            </button>

            {/* BUNGKUSAN NAVIGASI BULAN */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={isPrevMonthDisabled()}
                  className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title="Bulan Sebelumnya"
                >
                  <FiChevronLeft size={20} className="text-slate-600" />
                </button>
                <div className="px-4 py-1.5 font-bold text-sm text-slate-700 min-w-35 text-center bg-white rounded-lg shadow-sm border border-slate-100">
                  {new Date(selectedYear, selectedMonth - 1).toLocaleString(
                    "id-ID",
                    { month: "long", year: "numeric" },
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isNextMonthDisabled()}
                  className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title="Bulan Selanjutnya"
                >
                  <FiChevronRight size={20} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= DAFTAR WADAH LAPORAN PER TANGGAL ================= */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        ) : docs.length > 0 ? (
          <div className="flex flex-col gap-6">
            {docs.map((dateGroup) => {
              const dateObj = new Date(dateGroup.reportDate);
              const displayDate = dateObj.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              });

              return (
                <div
                  key={dateGroup.reportDate}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* HEADER TANGGAL */}
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                      <FiCalendar size={20} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">
                      {displayDate}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* ================= KOTAK SESI PAGI ================= */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2.5 py-1 rounded border border-amber-200/40 tracking-wider">
                          SESI PAGI
                        </span>
                      </div>

                      {dateGroup.sessions.PAGI.length > 0 ? (
                        <div className="space-y-3">
                          {dateGroup.sessions.PAGI.map((docItem) => (
                            <Link
                              key={docItem.id}
                              href={`/mandor/project/${projectId}/documentation/${docItem.id}`}
                              className="block group"
                            >
                              <div className="flex gap-4 bg-slate-50/50 border border-slate-200 rounded-xl p-3 hover:border-purple-400 hover:bg-white hover:shadow-sm transition-all">
                                <div className="w-24 h-20 bg-slate-200 rounded-lg relative overflow-hidden shrink-0">
                                  {docItem.files?.[0]?.fileType === "VIDEO" ? (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold">
                                      VIDEO
                                    </div>
                                  ) : (
                                    <Image
                                      src={
                                        docItem.files?.[0]?.fileUrl ||
                                        "/placeholder.png"
                                      }
                                      alt="progres"
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col justify-between min-w-0">
                                  <div>
                                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-purple-600 transition-colors">
                                      {docItem.workArea}
                                    </h3>
                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                      {docItem.task}
                                    </p>
                                  </div>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2 truncate">
                                    <FiUser size={12} className="shrink-0" />
                                    <span className="truncate">
                                      {docItem.createdBy?.name ||
                                        "Kepala Tukang"}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : /* KONDISI KOSONG (READ-ONLY) */
                      dateGroup.existingSessions?.PAGI ? (
                        <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-[11px] text-center px-4 italic">
                          Laporan pagi ada (Disembunyikan oleh pencarian)
                        </div>
                      ) : (
                        <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs italic">
                          Belum ada laporan pagi
                        </div>
                      )}
                    </div>

                    {/* ================= KOTAK SESI SORE ================= */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200/40 tracking-wider">
                          SESI SORE
                        </span>
                      </div>

                      {dateGroup.sessions.SORE.length > 0 ? (
                        <div className="space-y-3">
                          {dateGroup.sessions.SORE.map((docItem) => (
                            <Link
                              key={docItem.id}
                              href={`/mandor/project/${projectId}/documentation/${docItem.id}`}
                              className="block group"
                            >
                              <div className="flex gap-4 bg-slate-50/50 border border-slate-200 rounded-xl p-3 hover:border-purple-400 hover:bg-white hover:shadow-sm transition-all">
                                <div className="w-24 h-20 bg-slate-200 rounded-lg relative overflow-hidden shrink-0">
                                  {docItem.files?.[0]?.fileType === "VIDEO" ? (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold">
                                      VIDEO
                                    </div>
                                  ) : (
                                    <Image
                                      src={
                                        docItem.files?.[0]?.fileUrl ||
                                        "/placeholder.png"
                                      }
                                      alt="progres"
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col justify-between min-w-0">
                                  <div>
                                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-purple-600 transition-colors">
                                      {docItem.workArea}
                                    </h3>
                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                      {docItem.task}
                                    </p>
                                  </div>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2 truncate">
                                    <FiUser size={12} className="shrink-0" />
                                    <span className="truncate">
                                      {docItem.createdBy?.name ||
                                        "Kepala Tukang"}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : /* KONDISI KOSONG (READ-ONLY) */
                      dateGroup.existingSessions?.SORE ? (
                        <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-[11px] text-center px-4 italic">
                          Laporan sore ada (Disembunyikan oleh pencarian)
                        </div>
                      ) : (
                        <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs italic">
                          Belum ada laporan sore
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="bg-slate-50 p-5 rounded-full mb-5">
              <FiSearch size={36} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {debouncedSearch
                ? "Laporan Tidak Ditemukan"
                : "Belum Ada Laporan"}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              {debouncedSearch
                ? `Tidak ada hasil laporan yang cocok dengan kata kunci "${debouncedSearch}".`
                : "Kepala tukang belum mengunggah laporan progres untuk bulan ini."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
