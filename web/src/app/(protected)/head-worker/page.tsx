"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FiBriefcase, FiMapPin, FiFilter, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

import { getAssignedProjects } from "@/services/project.service";
import { AssignedProject } from "@/types/project.type";

export default function AssignedProjectsPage() {
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Jika Backend kamu support filter status untuk Assigned Project, kita aktifkan
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("startDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Pastikan service getAssignedProjects menerima parameter ini
      const res = await getAssignedProjects(page, 10, status, sortBy, order);
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
          err.response?.data?.message || "Gagal mengambil data proyek",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, sortBy, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Tugas Proyek Saya
            </h1>
            <p className="text-gray-500 mt-1">
              Pilih proyek di bawah ini untuk mengelola dokumentasi harian.
            </p>
          </div>
        </div>

        {/* STATS & FILTER */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 flex-1">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <FiBriefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Tugas</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {projects.length} Proyek
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3 lg:w-2/3">
            <div className="flex items-center gap-2 text-gray-400 px-2">
              <FiFilter />
            </div>

            {/* Filter Status */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="AKTIF">AKTIF</option>
              <option value="LIBUR">LIBUR</option>
              <option value="SELESAI">SELESAI</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="startDate">Tanggal Mulai</option>
              <option value="projectName">Nama Proyek</option>
            </select>

            {/* Order Button */}
            <button
              onClick={() => {
                setOrder(order === "asc" ? "desc" : "asc");
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all border-none cursor-pointer"
            >
              {order === "asc" ? "A-Z ↓" : "Z-A ↓"}
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
                  <th className="p-5">Tanggal Mulai</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="p-8 bg-gray-50/20" />
                    </tr>
                  ))
                ) : projects.length > 0 ? (
                  projects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                      // Arahkan ke halaman dokumentasi untuk project ini
                      onClick={() =>
                        router.push(
                          `/head-worker/project/${p.id}/documentation`,
                        )
                      }
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <FiBriefcase />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                              {p.projectName}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <FiMapPin className="w-3 h-3" /> {p.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-gray-600 font-medium">
                        {new Date(p.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "AKTIF"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          className="inline-flex items-center justify-center p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
                          title="Kelola Dokumentasi"
                        >
                          <span className="mr-2 text-xs font-semibold hidden sm:inline">
                            Kelola
                          </span>
                          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-20 text-gray-400">
                      Belum ada proyek yang ditugaskan kepada Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION AREA */}
          <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
              Halaman <span className="text-emerald-600">{page}</span> dari{" "}
              {totalPages}
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
    </div>
  );
}
