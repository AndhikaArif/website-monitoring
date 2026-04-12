"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiRefreshCcw,
  FiArrowLeft,
  FiBriefcase,
  FiMapPin,
  FiTrash2,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getMyTrashedProjects,
  hardDeleteProject,
  restoreProject,
} from "@/services/project.service";
import { Project } from "@/types/project.type";

export default function TrashProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // State untuk Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const router = useRouter();

  const fetchTrashed = useCallback(async () => {
    setLoading(true);
    try {
      // Mengirimkan parameter ke service
      const res = await getMyTrashedProjects(page, 10, "", sortBy, order);
      setProjects(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status !== 404) {
        toast.error("Gagal mengambil data sampah");
      }
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, order]); // Trigger re-fetch saat param berubah

  useEffect(() => {
    fetchTrashed();
  }, [fetchTrashed]);

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreProject(id);
      toast.success(`Proyek "${name}" berhasil dipulihkan`);
      fetchTrashed();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal memulihkan proyek");
      }
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `PERINGATAN: Proyek "${name}" akan dihapus selamanya dan tidak bisa dikembalikan. Lanjutkan?`,
    );

    if (!isConfirmed) return;

    try {
      await hardDeleteProject(id);
      toast.success(`Proyek "${name}" telah dihapus permanen`);
      fetchTrashed(); // Refresh list
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal menghapus permanen");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors border-none cursor-pointer bg-transparent text-gray-600"
            >
              <FiArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Tong Sampah
              </h1>
              <p className="text-gray-500 mt-1">
                Pulihkan proyek yang dihapus.
              </p>
            </div>
          </div>

          {/* FILTER TOOLBAR */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-400 px-2">
              <FiFilter />
            </div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2 text-gray-700 outline-none cursor-pointer"
            >
              <option value="createdAt">Terbaru</option>
              <option value="projectName">Nama Proyek</option>
            </select>
            <button
              onClick={() => {
                setOrder(order === "asc" ? "desc" : "asc");
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 hover:bg-purple-50 transition-all border-none cursor-pointer"
            >
              {order === "asc" ? "Z-A ↑" : "A-Z ↓"}
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-5">Proyek & Lokasi</th>
                  <th className="p-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={2} className="p-10 bg-gray-50/20" />
                    </tr>
                  ))
                ) : projects.length > 0 ? (
                  projects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                            <FiBriefcase />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              {p.projectName}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <FiMapPin /> {p.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRestore(p.id, p.projectName)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl font-bold transition-all border-none cursor-pointer"
                          >
                            <FiRefreshCcw /> Pulihkan
                          </button>

                          <button
                            onClick={() =>
                              handleHardDelete(p.id, p.projectName)
                            }
                            className="p-2 text-red-400 hover:bg-red-50 rounded-xl border-none cursor-pointer transition-colors"
                            title="Hapus Permanen"
                          >
                            <FiTrash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center p-20 text-gray-400">
                      <FiTrash2 className="mx-auto mb-2 opacity-20" size={48} />
                      <p>Tempat sampah kosong.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-500 font-medium uppercase">
                Halaman <span className="text-purple-600">{page}</span> dari{" "}
                {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages || loading}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
