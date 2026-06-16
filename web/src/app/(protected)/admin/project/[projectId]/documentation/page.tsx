"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiTrash2,
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

import { useAuth } from "@/context/auth-context";

import {
  getProjectDocumentations,
  adminDeleteDocumentation,
} from "@/services/documentation.service";
import { getProjectDetail } from "@/services/project.service";
import type { GroupedDocumentation } from "@/types/documentation.type";

import { ProjectDetail } from "@/types/project.type";

import ScheduleHolidayModal from "@/components/modals/schedule-holiday-modal";
import UpcomingHolidays from "@/components/project/upcoming-holiday";
import HolidayHistory from "@/components/project/holiday-history";

interface ApiError {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

export default function AdminProjectDocumentationPage() {
  const params = useParams();
  const projectId = (params.projectId || params.id) as string;
  const router = useRouter();

  const { user: currentUser } = useAuth();
  const requestTimestampRef = useRef<number>(0);

  // 1. STATE UTAMA
  const [docs, setDocs] = useState<GroupedDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // State untuk menyimpan full data proyek dari API
  const [projectData, setProjectData] = useState<ProjectDetail | null>(null);

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

  // 4. STATE NAVIGASI TAB & MODAL HARI LIBUR
  const [activeTab, setActiveTab] = useState<"laporan" | "libur">("laporan");
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  // --- FUNGSI AMBIL DATA PROYEK (Bisa dipanggil ulang saat butuh refresh) ---
  const fetchProjectData =
    useCallback(async (): Promise<ProjectDetail | null> => {
      if (!projectId) return null;
      try {
        const res = await getProjectDetail(projectId);
        setProjectData(res.data);
        return res.data;
      } catch (error) {
        console.error("Gagal mengambil data proyek", error);
        toast.error("Gagal memuat konfigurasi proyek.");
        return null;
      }
    }, [projectId]);

  // --- INISIALISASI DETAIL PROYEK UNTUK BATAS TANGGAL & TAMPILAN AWAL ---
  useEffect(() => {
    const initializeProjectInfo = async () => {
      const data = await fetchProjectData();

      if (data) {
        const rawStartDate = data.startDate || data.createdAt;
        const rawEndDate = data.endDate;

        let start: Date | null = null;
        let end: Date | null = null;

        if (rawStartDate) {
          start = new Date(rawStartDate);
          setProjectStartDate(start);
        }

        if (rawEndDate) {
          end = new Date(rawEndDate);
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
          targetMonth = end.getMonth() + 1;
          targetYear = end.getFullYear();
        } else if (start && today.getTime() < start.getTime()) {
          targetMonth = start.getMonth() + 1;
          targetYear = start.getFullYear();
        }

        setSelectedMonth(targetMonth);
        setSelectedYear(targetYear);
        setDebouncedMonth(targetMonth);
        setDebouncedYear(targetYear);
      }
      setIsInitialized(true);
    };

    if (!isInitialized) {
      initializeProjectInfo();
    }
  }, [fetchProjectData, isInitialized]);

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
    const limitDate = projectEndDate ? projectEndDate : currentRealDate;

    const limitYear = limitDate.getFullYear();
    const limitMonth = limitDate.getMonth() + 1;

    if (selectedYear > limitYear) return true;
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
        router.push("/admin/project");
        return;
      }

      const res = await getProjectDocumentations({
        projectId,
        month: debouncedMonth,
        year: debouncedYear,
        order: sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
      });

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
          router.push("/admin/project");
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

  // --- EKSEKUSI HAPUS LAPORAN (ADMIN ONLY) ---
  const handleDelete = async (docId: string) => {
    const isConfirmed = window.confirm(
      "PENGHAPUSAN MUTLAK: Apakah Anda yakin ingin menghapus laporan ini beserta lampiran medianya dari server? Tindakan ini mengabaikan batas waktu dan tidak dapat dibatalkan.",
    );

    if (!isConfirmed) return;

    try {
      await adminDeleteDocumentation(docId);
      fetchDocs();
      toast.success("Laporan berhasil dihapus dari sistem");
    } catch (error) {
      const err = error as ApiError;
      if (err?.response?.status === 500) {
        toast.error(
          "Gagal terhubung ke server atau database. Pembersihan arsip dibatalkan.",
        );
      } else {
        toast.error(
          err?.response?.data?.message ||
            "Gagal mengeksekusi pembersihan laporan target",
        );
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 text-black">
        <FiLoader className="animate-spin text-indigo-600 text-4xl mb-4" />
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
          onClick={() => router.push(`/admin/project`)}
          className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors mb-6 group bg-transparent border-none cursor-pointer font-medium text-sm"
        >
          <FiChevronLeft
            className="mr-1 group-hover:-translate-x-1 transition-transform"
            size={18}
          />
          Kembali ke Daftar Proyek
        </button>

        {/* HEADER SECTION */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-4 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-indigo-500">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Dokumentasi Proyek
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {currentUser?.name
                  ? `Halo ${currentUser.name}, kelola progres harian dan konfigurasi operasional.`
                  : "Kelola laporan progres harian dan konfigurasi kalender proyek."}
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

          {/* NAVIGASI SWITCHER TAB */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto self-end">
            <button
              type="button"
              onClick={() => setActiveTab("laporan")}
              className={`flex-1 xl:flex-none px-5 py-2.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
                activeTab === "laporan"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Laporan Progres
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("libur")}
              className={`flex-1 xl:flex-none px-5 py-2.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
                activeTab === "libur"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Manajemen Hari Libur
            </button>
          </div>
        </div>

        {/* KONTEN TAB 1: LAPORAN PROGRES */}
        {activeTab === "laporan" && (
          <>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between">
                {/* INPUT PENCARIAN */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <FiSearch size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari area / aktivitas..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 text-black placeholder-slate-400 transition-all"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
                    }
                    className="flex items-center justify-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Urutan:{" "}
                    <span className="ml-1 text-indigo-600 font-bold">
                      {sortOrder === "desc" ? "Terbaru" : "Terlama"}
                    </span>
                  </button>

                  <div className="flex items-center justify-between gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      disabled={isPrevMonthDisabled()}
                      className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
                      className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight size={20} className="text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* DAFTAR WADAH LAPORAN PER TANGGAL */}
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
                      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                          <FiCalendar size={20} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800">
                          {displayDate}
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* SESI PAGI */}
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2.5 py-1 rounded border border-amber-200/40 tracking-wider">
                              SESI PAGI
                            </span>
                          </div>
                          {dateGroup.sessions.PAGI.length > 0 ? (
                            <div className="space-y-3">
                              {dateGroup.sessions.PAGI.map((docItem) => (
                                <div
                                  key={docItem.id}
                                  onClick={() =>
                                    router.push(
                                      `/admin/project/${projectId}/documentation/${docItem.id}`,
                                    )
                                  }
                                  className="group relative flex gap-4 bg-slate-50/50 border border-slate-200 rounded-xl p-3 hover:border-indigo-400 hover:bg-white hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                                >
                                  <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(docItem.id);
                                      }}
                                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all cursor-pointer border-none flex items-center gap-1.5 text-xs font-bold"
                                    >
                                      <FiTrash2 size={13} />
                                    </button>
                                  </div>
                                  <div className="w-24 h-20 bg-slate-200 rounded-lg relative overflow-hidden shrink-0">
                                    {docItem.files?.[0]?.fileType ===
                                    "VIDEO" ? (
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
                                  <div className="flex flex-col justify-between min-w-0 pr-6 sm:pr-0">
                                    <div>
                                      <h3 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
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
                                          "Tim Lapangan"}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : dateGroup.existingSessions?.PAGI ? (
                            <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-[11px] text-center px-4 italic">
                              Laporan pagi ada (Disembunyikan)
                            </div>
                          ) : (
                            <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs italic">
                              Belum ada laporan
                            </div>
                          )}
                        </div>

                        {/* SESI SORE */}
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200/40 tracking-wider">
                              SESI SORE
                            </span>
                          </div>
                          {dateGroup.sessions.SORE.length > 0 ? (
                            <div className="space-y-3">
                              {dateGroup.sessions.SORE.map((docItem) => (
                                <div
                                  key={docItem.id}
                                  onClick={() =>
                                    router.push(
                                      `/admin/project/${projectId}/documentation/${docItem.id}`,
                                    )
                                  }
                                  className="group relative flex gap-4 bg-slate-50/50 border border-slate-200 rounded-xl p-3 hover:border-indigo-400 hover:bg-white hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                                >
                                  <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(docItem.id);
                                      }}
                                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all cursor-pointer border-none flex items-center gap-1.5 text-xs font-bold"
                                    >
                                      <FiTrash2 size={13} />
                                    </button>
                                  </div>
                                  <div className="w-24 h-20 bg-slate-200 rounded-lg relative overflow-hidden shrink-0">
                                    {docItem.files?.[0]?.fileType ===
                                    "VIDEO" ? (
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
                                  <div className="flex flex-col justify-between min-w-0 pr-6 sm:pr-0">
                                    <div>
                                      <h3 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
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
                                          "Tim Lapangan"}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : dateGroup.existingSessions?.SORE ? (
                            <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-[11px] text-center px-4 italic">
                              Laporan sore ada (Disembunyikan)
                            </div>
                          ) : (
                            <div className="w-full h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs italic">
                              Belum ada laporan
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
                    : "Tim lapangan belum mengunggah laporan progres untuk bulan ini."}
                </p>
              </div>
            )}
          </>
        )}

        {/* KONTEN TAB 2: MANAJEMEN HARI LIBUR */}
        {activeTab === "libur" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Kalender Libur Operasional Proyek
                </h2>
                <p className="text-slate-500 text-xs">
                  Atur hari libur agar sistem tahu tanggal penonaktifan laporan
                  harian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(true)}
                className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all border-none cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-indigo-100"
              >
                <FiCalendar size={14} /> Atur Tanggal Libur Baru
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* KOLOM KIRI: UPCOMING */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Hari Libur Mendatang
                </h3>
                <UpcomingHolidays
                  projectId={projectId}
                  projectStatus={projectData?.status ?? "AKTIF"}
                  holidays={projectData?.projectHolidays || []}
                  onRefresh={async () => {
                    await fetchProjectData();
                  }}
                />
              </div>

              {/* KOLOM KANAN: HISTORY */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  Riwayat Libur Berlalu
                </h3>
                <HolidayHistory
                  pastHistories={projectData?.pastHistories || []}
                  limit={24}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <ScheduleHolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        projectId={projectId}
        onSuccess={async () => {
          await fetchProjectData(); // Refresh data libur di background
          setIsHolidayModalOpen(false); // Tutup modal setelah API hit sukses
        }}
      />
    </div>
  );
}
