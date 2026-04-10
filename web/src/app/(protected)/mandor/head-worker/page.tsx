"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FiEdit2, FiTrash2, FiPlus, FiUsers, FiMail } from "react-icons/fi";
import toast from "react-hot-toast";

import {
  getHeadWorkers,
  deleteHeadWorker,
} from "@/services/head-worker.service";
import { HeadWorker } from "@/types/head-worker.type";

export default function HeadWorkerPage() {
  const [headWorkers, setHeadWorkers] = useState<HeadWorker[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHeadWorkers(page);
      setHeadWorkers(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setHeadWorkers([]);
          setTotalPages(1);
          return;
        }

        toast.error(
          err.response?.data?.message || "Gagal mengambil data head worker",
        );
      } else {
        console.error("Unknown Error:", err);
      }

      setHeadWorkers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus head worker?")) return;
    try {
      await toast.promise(deleteHeadWorker(id), {
        loading: "Menghapus head worker...",
        success: "Head worker berhasil dihapus! 🗑️",
        error: "Gagal menghapus head worker",
      });

      if (headWorkers.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        {/* TOP SECTION: TITLE & ACTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Manajemen Head Worker
            </h1>
            <p className="text-gray-500 mt-1">
              Kelola data seluruh kepala tukang di bawah koordinasi Anda.
            </p>
          </div>
          <button
            onClick={() => router.push("/mandor/head-worker/create")}
            className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-200 cursor-pointer border-none"
          >
            <FiPlus className="mr-2 w-5 h-5" />
            Tambah Head Worker
          </button>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Head Worker
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {headWorkers.length}{" "}
                <span className="text-sm font-normal text-gray-400">org</span>
              </h3>
            </div>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-5">Profil Head Worker</th>
                  <th className="p-5 hidden lg:table-cell">Username</th>
                  <th className="p-5 hidden md:table-cell">Kontak</th>
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
                ) : headWorkers.length > 0 ? (
                  headWorkers.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-purple-50/30 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-bold border border-purple-100">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{m.name}</p>
                            <p className="text-xs text-gray-400 md:hidden">
                              {m.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 hidden lg:table-cell">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-mono lowercase">
                          @{m.username}
                        </span>
                      </td>
                      <td className="p-5 hidden md:table-cell text-gray-600">
                        <div className="flex items-center gap-2">
                          <FiMail className="text-gray-400" /> {m.email}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              router.push(`/mandor/head-worker/edit/${m.id}`)
                            }
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                            title="Edit"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                            title="Hapus"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-20">
                      <div className="flex flex-col items-center">
                        <FiUsers className="w-12 h-12 text-gray-200 mb-4" />
                        <p className="text-gray-400 font-medium">
                          Belum ada data head worker.
                        </p>
                      </div>
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
