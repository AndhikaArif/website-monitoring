"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiEdit2,
  FiPlus,
  FiBriefcase,
  FiMapPin,
  FiFilter,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { deleteProject, getMyProjects } from "@/services/project.service";
import { Project } from "@/types/project.type";

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("startDate");

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyProjects(page, 10, status, sortBy);
      setProjects(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
      setTotalProjects(res.meta.total || 0);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          toast.error("Gagal terhubung ke server.", { id: "network-error" });
          return;
        }

        const status = err.response.status;
        const message =
          err.response.data?.message || "Gagal mengambil data proyek sistem.";

        if (status === 404) {
          // 404 di sini berarti tabel kosong. Biarkan user di halaman ini dan kosongkan state.
          setProjects([]);
          setTotalPages(1);
          setTotalProjects(0);
          return;
        } else if (status === 401) {
          toast.error("Sesi telah berakhir. Silakan login kembali.", {
            id: "auth-error",
          });
          router.replace("/login");
          return;
        } else if (status === 403) {
          // 🎯 Satukan ID toast dengan ProtectedLayout agar tidak bertumpuk jika bocor 1 milidetik
          toast.error(`Akses Ditolak: ${message}`, {
            id: "unauthorized-route",
          });
          router.replace("/");
          return;
        } else if (status === 500) {
          toast.error("Server sedang bermasalah. Silakan coba lagi.", {
            id: "server-error",
          });
          return;
        } else {
          toast.error(message, { id: "general-error" });
          return;
        }
      } else {
        toast.error("Terjadi kesalahan yang tidak terduga.", {
          id: "unknown-error",
        });
      }
      setProjects([]);
      setTotalPages(1);
      setTotalProjects(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, sortBy, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus proyek "${name}"?`,
    );

    if (!isConfirmed) return;
    try {
      await deleteProject(id);

      toast.success("Proyek berhasil dihapus");
      fetchData(); // Refresh list
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal menghapus proyek");
      } else {
        toast.error("Terjadi kesalahan saat menghapus proyek");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Proyek Saya
            </h1>
            <p className="text-gray-500 mt-1">
              Kelola progress pembangunan di lokasi.
            </p>
          </div>
          <div className="flex gap-3">
            {/* Tombol ke halaman Trash */}
            <button
              onClick={() => router.push("/mandor/project/trashed")}
              className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer border-none"
            >
              <FiTrash2 className="mr-2" /> Riwayat
            </button>

            <button
              onClick={() => router.push("/mandor/project/create")}
              className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-200 cursor-pointer border-none"
            >
              <FiPlus className="mr-2 w-5 h-5" /> Tambah Proyek
            </button>
          </div>
        </div>

        {/* STATS & FILTER */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 flex-1">
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <FiBriefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Proyek</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {totalProjects} Proyek
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
              className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
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
              className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <option value="startDate">Tanggal Mulai</option>
              <option value="projectName">Nama Proyek</option>
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
                  <th className="p-5">Tanggal Mulai</th>
                  <th className="p-5">Klien / Owner</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-20 text-center animate-pulse text-gray-400"
                    >
                      Memproses data proyek...
                    </td>
                  </tr>
                ) : projects.length > 0 ? (
                  projects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-purple-50/30 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/mandor/project/${p.id}`)}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
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

                      {/* Tanggal Mulai Proyek */}
                      <td className="p-5">
                        <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                          {new Date(p.startDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* DATA KLIEN / OWNER */}
                      <td className="p-5">
                        {p.owner ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                              <FiUser size={12} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700 text-xs">
                                {p.owner.name}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate max-w-30">
                                {p.owner.username.startsWith("deleted_") ? (
                                  <span className="text-red-400 italic">
                                    Akun Nonaktif
                                  </span>
                                ) : (
                                  `@${p.owner.username}`
                                )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-medium rounded-md border border-gray-100">
                            Belum di-assign
                          </span>
                        )}
                      </td>

                      <td className="p-5">
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
                      <td className="p-5 text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* e.stopPropagation agar klik tombol tidak memicu navigasi detail row */}
                          <button
                            onClick={() =>
                              router.push(`/mandor/project/edit/${p.id}`)
                            }
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg bg-transparent border-none cursor-pointer"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.projectName)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg bg-transparent border-none cursor-pointer"
                          >
                            {/* Ganti FiMoreVertical jadi icon hapus supaya lebih jelas */}
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-20 text-gray-400">
                      Proyek tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* PAGINATION AREA */}
          <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
              Halaman <span className="text-purple-600">{page}</span> dari{" "}
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
