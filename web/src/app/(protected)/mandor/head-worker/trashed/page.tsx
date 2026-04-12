"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiRefreshCcw,
  FiArrowLeft,
  FiUserCheck,
  FiTrash2,
  FiMail,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getTrashedHeadWorkers,
  restoreHeadWorker,
  hardDeleteHeadWorker,
} from "@/services/head-worker.service";
import { HeadWorker } from "@/types/head-worker.type";

export default function TrashHeadWorkerPage() {
  const [workers, setWorkers] = useState<HeadWorker[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const router = useRouter();

  const fetchTrashed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrashedHeadWorkers(page);
      setWorkers(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status !== 404) {
        toast.error("Gagal mengambil data sampah head worker");
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTrashed();
  }, [fetchTrashed]);

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreHeadWorker(id);
      toast.success(`Head Worker "${name}" berhasil dipulihkan`);
      fetchTrashed();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal memulihkan head worker",
        );
      }
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Hapus permanen "${name}"? Data pekerjaan yang terkait mungkin akan terpengaruh.`,
      )
    )
      return;
    try {
      await hardDeleteHeadWorker(id);
      toast.success(`Head Worker "${name}" dihapus permanen`);
      fetchTrashed();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal menghapus permanen");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors border-none cursor-pointer bg-transparent text-gray-600"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Sampah Head Worker
            </h1>
            <p className="text-gray-500 mt-1">
              Pulihkan kepala tukang yang sebelumnya Anda hapus.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-5">Nama & Email</th>
                  <th className="p-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr className="animate-pulse">
                    <td colSpan={2} className="p-10 bg-gray-50/20" />
                  </tr>
                ) : workers.length > 0 ? (
                  workers.map((w) => (
                    <tr
                      key={w.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <FiUserCheck />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{w.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <FiMail /> {w.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleRestore(w.id, w.name)}
                          className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl font-bold border-none cursor-pointer transition-all flex items-center gap-2"
                        >
                          <FiRefreshCcw /> Pulihkan
                        </button>
                        <button
                          onClick={() => handleHardDelete(w.id, w.name)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-xl border-none cursor-pointer transition-colors shadow-none"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center p-20 text-gray-400">
                      Tempat sampah kosong.
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
