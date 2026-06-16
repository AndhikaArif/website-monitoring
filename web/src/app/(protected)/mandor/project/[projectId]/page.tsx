"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiChevronLeft,
  FiEdit,
  FiUserPlus,
  FiClock,
  FiTrash2,
  FiUser,
  FiLock,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getProjectDetail,
  unassignHeadWorker,
  unassignOwner,
  updateProject,
  deleteProjectHoliday,
} from "@/services/project.service";
import { ProjectDetail } from "@/types/project.type";
import ScheduleHolidayModal from "@/components/modals/schedule-holiday-modal";

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();

  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(
    null,
  );

  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await getProjectDetail(projectId);
      setData(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal memuat data");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]); // fetchDetail hanya berubah jika projectId berubah

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUnassign = async (
    kepalaTukangId: string,
    kepalaTukangName: string,
  ) => {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${kepalaTukangName} sebagai kepala tukang proyek ini?`,
    );

    if (!isConfirmed) return;

    try {
      await unassignHeadWorker(projectId, {
        kepalaTukangIds: [kepalaTukangId],
      });

      toast.success(`${kepalaTukangName} berhasil dihapus dari proyek`);

      // Refresh data project agar list kepala tukang langsung terupdate di UI
      await fetchDetail();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal menghapus pekerja");
      } else if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  const handleUnassignOwner = async () => {
    if (!data?.owner) return;
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin melepas klien "${data.owner.name}" dari proyek ini?`,
    );

    if (!isConfirmed) return;

    try {
      await unassignOwner(projectId);
      toast.success(`Klien berhasil dilepas dari proyek`);
      await fetchDetail();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal melepas klien");
      }
    }
  };

  const handleSelesaikanProyek = async () => {
    const confirmSelesai = window.confirm(
      "PERINGATAN: Mengubah status menjadi SELESAI berarti proyek telah berakhir secara resmi. Lanjutkan?",
    );

    if (confirmSelesai) {
      try {
        await updateProject(projectId, { status: "SELESAI" });
        toast.success("Proyek telah selesai!");
        await fetchDetail();
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          toast.error(
            err.response?.data?.message || "Gagal menyelesaikan proyek",
          );
        }
      }
    }
  };

  const handleDeleteHoliday = async (
    holidayId: string,
    dateString: string,
    formattedDate: string,
  ) => {
    if (deletingHolidayId !== null) return;

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus hari libur pada tanggal ${formattedDate}?`,
    );

    if (!isConfirmed) return;

    setDeletingHolidayId(holidayId);

    try {
      // Parsing string ISO dari DB ke objek Date
      const d = new Date(dateString);

      // Ambil Day, Month, Year lalu pad dengan '0' jika satuan
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0"); // Bulan di JS mulai dari 0
      const year = d.getFullYear();

      // Satukan menjadi format DD-MM-YYYY sesuai request Backend
      const cleanDateParam = `${day}-${month}-${year}`;

      await deleteProjectHoliday(projectId, cleanDateParam);
      await fetchDetail();

      toast.success(`Hari libur tanggal ${formattedDate} berhasil dihapus`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal menghapus hari libur",
        );
      }
    } finally {
      setDeletingHolidayId(null); // Matikan loading setelah selesai (sukses/gagal)
    }
  };

  // Fungsi untuk memilih / membatalkan pilihan checkbox individual
  const handleToggleSelectHoliday = (id: string) => {
    setSelectedHolidayIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Fungsi untuk Pilih Semua / Batal Pilih Semua
  const handleSelectAllHolidays = () => {
    if (!data?.projectHolidays) return;

    // Cek apakah semua libur sudah terpilih
    const isAllSelected =
      selectedHolidayIds.length === data.projectHolidays.length;

    if (isAllSelected) {
      // Jika sudah terpilih semua, kosongkan state (Batal Pilih)
      setSelectedHolidayIds([]);
    } else {
      // Jika belum, ambil semua ID libur dan masukkan ke state
      const allHolidayIds = data.projectHolidays.map((holiday) => holiday.id);
      setSelectedHolidayIds(allHolidayIds);
    }
  };

  // Fungsi eksekusi hapus massal
  const handleBulkDeleteHolidays = async () => {
    if (selectedHolidayIds.length === 0) return;

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedHolidayIds.length} hari libur yang terpilih?`,
    );

    if (!isConfirmed) return;

    setIsBulkDeleting(true);

    try {
      // Filter data libur dari state utama yang ID-nya masuk daftar centang
      const targets = (data?.projectHolidays || []).filter((h) =>
        selectedHolidayIds.includes(h.id),
      );

      // Kirim request ke backend secara bersamaan (paralel)
      await Promise.all(
        targets.map(async (holiday) => {
          const d = new Date(holiday.date);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          const cleanDateParam = `${day}-${month}-${year}`;

          return deleteProjectHoliday(projectId, cleanDateParam);
        }),
      );

      await fetchDetail(); // Refresh UI

      toast.success(`${selectedHolidayIds.length} hari libur berhasil dihapus`);
      setSelectedHolidayIds([]); // Reset daftar centang jika sukses
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error("Gagal menghapus beberapa hari libur");
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-5xl mx-auto">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/mandor/project")}
          className="flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6 group bg-transparent border-none cursor-pointer"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar Proyek
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: MAIN INFO */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      data.status === "AKTIF"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {data.status}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mt-3">
                    {data.projectName}
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2 mt-2">
                    <FiMapPin className="text-purple-500" /> {data.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Tombol Selesaikan Proyek (Hanya muncul jika belum selesai) */}
                  {data.status !== "SELESAI" && (
                    <>
                      <button
                        onClick={handleSelesaikanProyek}
                        className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 hover:text-red-700 transition-all font-bold text-sm border-none cursor-pointer"
                      >
                        Selesaikan Proyek
                      </button>

                      {/* Tombol Edit Project */}
                      <button
                        onClick={() =>
                          router.push(`/mandor/project/edit/${data.id}`)
                        }
                        className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-purple-50 hover:text-purple-600 transition-all border-none cursor-pointer"
                        title="Edit Informasi Proyek"
                      >
                        <FiEdit size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-50 pt-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Deskripsi Proyek
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {data.description ||
                    "Tidak ada deskripsi tambahan untuk proyek ini."}
                </p>
              </div>
            </div>

            {/* DOCUMENTATION STATS */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FiFileText className="text-purple-600" /> Dokumentasi
                </h3>
                <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-xl text-sm font-bold">
                  {data._count.documentations} Laporan
                </span>
              </div>

              {data.latestDocumentation ? (
                <div className="bg-gray-50 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-600">
                      <FiClock />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Laporan Terakhir
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          data.latestDocumentation.reportDate,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        • Sesi {data.latestDocumentation.session}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/mandor/project/${data.id}/documentation`)
                    }
                    className="text-purple-600 font-bold text-sm hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Lihat Semua
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-gray-400 text-sm">
                    Belum ada dokumentasi yang diunggah.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR INFO */}
          <div className="space-y-6">
            {/* TIMELINE CARD */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiCalendar className="text-purple-600" /> Timeline
                </h3>

                {/* TOMBOL POP-UP LIBUR (Hilang jika proyek SELESAI) */}
                {data.status !== "SELESAI" && (
                  <button
                    onClick={() => setIsHolidayModalOpen(true)}
                    className="text-xs font-bold px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all border-none cursor-pointer flex items-center gap-1"
                    title="Atur Hari Libur"
                  >
                    <FiCalendar size={12} /> Set Libur
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Tanggal Mulai
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {new Date(data.startDate).toLocaleDateString("id-ID", {
                      dateStyle: "full",
                    })}
                  </p>
                </div>

                {/* Tampilkan Tanggal Selesai jika data.endDate sudah terisi (Proyek SELESAI) */}
                {data.endDate ? (
                  <div>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                      Tanggal Selesai
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(data.endDate).toLocaleDateString("id-ID", {
                        dateStyle: "full",
                      })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Tanggal Selesai
                    </p>
                    <p className="text-sm font-medium text-gray-500 italic">
                      Proyek sedang berjalan
                    </p>
                  </div>
                )}

                {/* LIST HARI LIBUR MENDATANG */}
                <div className="border-t border-gray-100 pt-4 mt-2">
                  {/* Header Section dengan Judul Dinamis & Tombol Aksi Massal */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Hari Libur{" "}
                        {selectedHolidayIds.length > 0 &&
                          `(${selectedHolidayIds.length})`}
                      </p>

                      {/* Tombol Pilih Semua (Hanya muncul jika ada data libur & proyek belum SELESAI) */}
                      {data.projectHolidays &&
                        data.projectHolidays.length > 0 &&
                        data.status !== "SELESAI" && (
                          <button
                            onClick={handleSelectAllHolidays}
                            disabled={
                              isBulkDeleting || deletingHolidayId !== null
                            }
                            className="text-[10px] text-purple-600 font-bold hover:text-purple-700 bg-transparent border-none cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            {selectedHolidayIds.length ===
                            data.projectHolidays.length
                              ? "Batal Pilih"
                              : "Pilih Semua"}
                          </button>
                        )}
                    </div>

                    {/* Tombol Hapus Terpilih */}
                    {selectedHolidayIds.length > 0 && (
                      <button
                        onClick={handleBulkDeleteHolidays}
                        disabled={isBulkDeleting || deletingHolidayId !== null}
                        className="text-[10px] text-red-600 font-bold hover:text-red-700 bg-transparent border-none cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {isBulkDeleting ? (
                          <>
                            <FiLoader className="animate-spin" size={10} />{" "}
                            Menghapus...
                          </>
                        ) : (
                          "Hapus Terpilih"
                        )}
                      </button>
                    )}
                  </div>

                  {data.projectHolidays && data.projectHolidays.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {data.projectHolidays.map((holiday) => {
                        const dateObj = new Date(holiday.date);
                        const formatted = dateObj.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });

                        const isCurrentlyIndividualLoading =
                          deletingHolidayId === holiday.id;
                        const isAnyLoading =
                          isBulkDeleting || deletingHolidayId !== null;

                        return (
                          <div
                            key={holiday.id}
                            className="group flex items-center justify-between p-2 bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-colors text-xs gap-2"
                          >
                            {/* Bagian Kiri: Checkbox + Tanggal */}
                            <div className="flex items-center gap-2">
                              {data.status !== "SELESAI" && (
                                <input
                                  type="checkbox"
                                  checked={selectedHolidayIds.includes(
                                    holiday.id,
                                  )}
                                  onChange={() =>
                                    handleToggleSelectHoliday(holiday.id)
                                  }
                                  disabled={isAnyLoading}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer h-3.5 w-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                              )}
                              <span className="font-semibold text-purple-700">
                                {formatted}
                              </span>
                            </div>

                            {/* Bagian Kanan: Tombol Tong Sampah Satuan */}
                            {data.status !== "SELESAI" && (
                              <button
                                onClick={() =>
                                  handleDeleteHoliday(
                                    holiday.id,
                                    holiday.date,
                                    formatted,
                                  )
                                }
                                disabled={isAnyLoading}
                                className={`p-1 text-red-400 rounded-md transition-all border-none bg-transparent ${
                                  isCurrentlyIndividualLoading
                                    ? "opacity-100 cursor-wait"
                                    : isAnyLoading
                                      ? "opacity-20 cursor-not-allowed text-gray-300"
                                      : "opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                }`}
                                title={
                                  isAnyLoading
                                    ? "Mohon tunggu..."
                                    : "Hapus Hari Libur"
                                }
                              >
                                {isCurrentlyIndividualLoading ? (
                                  <FiLoader
                                    size={14}
                                    className="animate-spin text-purple-600"
                                  />
                                ) : (
                                  <FiTrash2 size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Tidak ada jadwal libur mendatang.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* OWNER CARD (KLIEN) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FiUser className="text-purple-600" /> Klien (Owner)
                </h3>
                {/* PROTEKSI UI: Tampilkan tombol tambah hanya jika owner belum di-assign DAN proyek belum selesai */}{" "}
                {!data.owner && (
                  <button
                    onClick={() =>
                      router.push(`/mandor/project/${data.id}/assign-owner`)
                    }
                    className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all border-none cursor-pointer"
                    title="Tambah Klien"
                  >
                    <FiUserPlus size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {data.owner ? (
                  <div className="group flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {data.owner.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 leading-tight">
                          {data.owner.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          @{data.owner.username}
                        </p>
                      </div>
                    </div>

                    {/* PROTEKSI UI: Tombol Unnasign jika belum SELESAI dan milik milik Mandor yang tepat */}
                    {data.status === "SELESAI" ? (
                      <span></span>
                    ) : data.owner.mandorId === data.mandorId ? (
                      <button
                        onClick={handleUnassignOwner}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all border-none cursor-pointer"
                        title="Lepas klien dari proyek"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    ) : (
                      <span
                        className="text-[10px] text-amber-500 bg-amber-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all font-semibold"
                        title="Hanya Mandor Utama yang bisa melepas klien ini"
                      >
                        <FiLock size={16} />
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    Belum ada klien yang ditugaskan.
                  </p>
                )}
              </div>
            </div>

            {/* KEPALA TUKANG CARD */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FiUsers className="text-purple-600" /> Kepala Tukang
                </h3>

                {/* PROTEKSI UI: Tampilkan tombol tambah hanya jika proyek belum selesai */}
                {data.status !== "SELESAI" && (
                  <button
                    onClick={() =>
                      router.push(`/mandor/project/${data.id}/assign`)
                    }
                    className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all border-none cursor-pointer"
                  >
                    <FiUserPlus size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {data.kepalaTukang.length > 0 ? (
                  data.kepalaTukang.map((hw) => (
                    <div
                      key={hw.id}
                      className="group flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {hw.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-tight">
                            {hw.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            @{hw.username}
                          </p>
                        </div>
                      </div>

                      {/* PROTEKSI UI: Tombol hapus hanya muncul jika proyek belum selesai */}
                      {data.status !== "SELESAI" && (
                        <button
                          onClick={() => handleUnassign(hw.id, hw.name)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all border-none cursor-pointer"
                          title={`Hapus ${hw.name} dari proyek`}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    Belum ada pekerja yang ditugaskan.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CALL SEPARATED MODAL */}
      <ScheduleHolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        projectId={projectId}
        onSuccess={fetchDetail} // panggil fetchDetail untuk refresh data setelah simpan libur
      />
    </div>
  );
}
