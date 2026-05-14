"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiBriefcase,
  FiMapPin,
  FiFilter,
  FiUser,
  FiUsers,
  FiRefreshCw,
  FiEye,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { getAllProjectsForAdmin } from "@/services/project.service";
import type { AdminProject } from "@/types/project.type";

import TransferMandorModal from "@/components/modals/transfer-mandor-modal";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("");

  // Pengendali modal pemindahan Mandor
  const [selectedProject, setSelectedProject] = useState<AdminProject | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllProjectsForAdmin(page, 10, status);
      setProjects(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setProjects([]);
          setTotalPages(1);
          return;
        }
        toast.error(
          err.response?.data?.message || "Gagal mengambil data proyek sistem",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pemicu buka modal
  const handleOpenTransferModal = (project: AdminProject) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Penutup modal dan penyegar data
  const handleCloseModal = (shouldRefresh?: boolean) => {
    setIsModalOpen(false);
    setSelectedProject(null);
    if (shouldRefresh) {
      fetchData(); // Muat ulang tabel jika mutasi di backend sukses
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Pusat Kendali Proyek
            </h1>
            <p className="text-gray-500 mt-1">
              Pantau seluruh portofolio proyek dan struktur kepemimpinan
              lapangan.
            </p>
          </div>
        </div>

        {/* STATS & FILTER */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 flex-1">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
              <FiBriefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Proyek Terdaftar
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {projects.length} Proyek
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3 lg:w-2/3">
            <div className="flex items-center gap-2 text-gray-400 px-2 shrink-0">
              <FiFilter />
              <span className="text-xs font-semibold text-gray-500">
                Filter Status:
              </span>
            </div>

            {/* Filter Status */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="AKTIF">AKTIF</option>
              <option value="LIBUR">LIBUR</option>
              <option value="SELESAI">SELESAI</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-5">Proyek & Lokasi</th>
                  <th className="p-5">Mandor Penanggung Jawab</th>
                  <th className="p-5">Klien / Owner</th>
                  <th className="p-5 text-center">Kepala Tukang</th>
                  <th className="p-5 text-center">Status</th>
                  <th className="p-5 text-right">Aksi Kendali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="p-8 bg-gray-50/20" />
                    </tr>
                  ))
                ) : projects.length > 0 ? (
                  projects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                      // Admin tetap bisa membuka halaman rincian (*read-only*) dengan mengklik barisnya
                      onClick={() =>
                        router.push(`/admin/project/${p.id}/documentation`)
                      }
                    >
                      {/* KOLOM 1: IDENTITAS PROYEK */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <FiBriefcase />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 line-clamp-1">
                              {p.projectName}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                              <FiMapPin className="shrink-0" /> {p.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* KOLOM 2: MANDOR AKTIF */}
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <FiUser size={12} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs truncate max-w-30">
                              {p.mandor?.name || "Tanpa Nama"}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate max-w-30">
                              @{p.mandor?.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* KOLOM 3: KLIEN PEMILIK */}
                      <td className="p-5">
                        {p.owner ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                              <FiUser size={12} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700 text-xs truncate max-w-30">
                                {p.owner.name}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate max-w-30">
                                @{p.owner.username}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-medium rounded-md border border-gray-100">
                            Belum di-assign
                          </span>
                        )}
                      </td>

                      {/* KOLOM 4: STATISTIK TIM TUKANG */}
                      <td className="p-5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100">
                          <FiUsers className="text-gray-400" />
                          {p._count?.kepalaTukang || 0}
                        </span>
                      </td>

                      {/* KOLOM 5: STATUS */}
                      <td className="p-5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "AKTIF"
                              ? "bg-green-100 text-green-700"
                              : p.status === "LIBUR"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* KOLOM 6: AKSI KENDALI */}
                      <td className="p-5 text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()} // Mencegat rambatan klik ke baris tabel
                        >
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/project/${p.id}/documentation`,
                              )
                            }
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Rincian Detail"
                          >
                            <FiEye size={16} />
                          </button>

                          {/* Tombol pemicu pemindahan Mandor */}
                          <button
                            onClick={() => handleOpenTransferModal(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-lg transition-all cursor-pointer border-none"
                            title="Pindah Tangankan Proyek ke Mandor Lain"
                          >
                            <FiRefreshCw size={13} className="shrink-0" />
                            <span className="hidden sm:inline">
                              Ganti Mandor
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-20 text-gray-400">
                      Belum ada catatan proyek di dalam pangkalan data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION AREA */}
          <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
              Halaman <span className="text-indigo-600 font-bold">{page}</span>{" "}
              dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={page === totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER MODAL PEMINDAHAN MANDOR */}
      {isModalOpen && selectedProject && (
        <TransferMandorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          project={selectedProject}
        />
      )}
    </div>
  );
}
