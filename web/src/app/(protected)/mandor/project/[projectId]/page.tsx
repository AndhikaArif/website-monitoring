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
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getProjectDetail,
  unassignHeadWorker,
} from "@/services/project.service";
import { ProjectDetail } from "@/types/project.type";

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();

  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
    headWorkerId: string,
    headWorkerName: string,
  ) => {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${headWorkerName} sebagai penanggung jawab proyek ini?`,
    );

    if (!isConfirmed) return;

    try {
      await unassignHeadWorker(projectId, { headWorkerIds: [headWorkerId] });

      toast.success(`${headWorkerName} berhasil dihapus dari proyek`);

      // Refresh data project agar list head worker langsung terupdate di UI
      await fetchDetail();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal menghapus pekerja");
      } else if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
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
                <button
                  onClick={() => router.push(`/mandor/project/edit/${data.id}`)}
                  className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-purple-50 hover:text-purple-600 transition-all border-none cursor-pointer"
                >
                  <FiEdit size={20} />
                </button>
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
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiCalendar className="text-purple-600" /> Timeline
              </h3>
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

                {/* Tampilkan Tanggal Selesai hanya jika data.endDate sudah terisi (Proyek SELESAI) */}
                {data.endDate && (
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
                )}

                {/* Info tambahan jika masih aktif */}
                {!data.endDate && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Tanggal Selesai
                    </p>
                    <p className="text-sm font-medium text-gray-500 italic">
                      Proyek sedang berjalan
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* HEAD WORKERS CARD */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FiUsers className="text-purple-600" /> Head Worker
                </h3>
                <button
                  onClick={() =>
                    router.push(`/mandor/project/${data.id}/assign`)
                  }
                  className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all border-none cursor-pointer"
                >
                  <FiUserPlus size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {data.headWorkers.length > 0 ? (
                  data.headWorkers.map((hw) => (
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

                      {/* TOMBOL DELETE (UNASSIGN) */}
                      <button
                        onClick={() => handleUnassign(hw.id, hw.name)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all border-none cursor-pointer"
                        title={`Hapus ${hw.name} dari proyek`}
                      >
                        <FiTrash2 size={16} />
                      </button>
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
    </div>
  );
}
