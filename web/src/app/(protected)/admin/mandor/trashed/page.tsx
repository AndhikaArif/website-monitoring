"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiRefreshCcw,
  FiArrowLeft,
  FiUser,
  FiMail,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getTrashedMandors,
  restoreMandor,
  hardDeleteMandor,
} from "@/services/mandor.service";
import { Mandor } from "@/types/mandor.type";

export default function TrashMandorPage() {
  const [users, setUsers] = useState<Mandor[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const router = useRouter();

  const fetchTrashed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrashedMandors(page);
      setUsers(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status !== 404) {
        toast.error("Gagal mengambil data sampah mandor");
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
      await restoreMandor(id);
      toast.success(`Akun Mandor "${name}" berhasil dipulihkan`);
      fetchTrashed();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal memulihkan mandor");
      }
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `PERINGATAN: Akun "${name}" akan dihapus permanen dari sistem. Lanjutkan?`,
      )
    )
      return;
    try {
      await hardDeleteMandor(id);
      toast.success(`Mandor "${name}" telah dihapus permanen`);
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
                Sampah Mandor
              </h1>
              <p className="text-gray-500 mt-1">
                Daftar akun mandor yang telah dinonaktifkan.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-5">Detail Mandor</th>
                  <th className="p-5">Username</th>
                  <th className="p-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="p-10 bg-gray-50/20" />
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <FiUser />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <FiMail /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 font-mono text-gray-600">
                        @{u.username}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRestore(u.id, u.name)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl font-bold transition-all border-none cursor-pointer"
                          >
                            <FiRefreshCcw /> Pulihkan
                          </button>
                          <button
                            onClick={() => handleHardDelete(u.id, u.name)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-xl border-none cursor-pointer transition-colors shadow-none"
                          >
                            <FiTrash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-20 text-gray-400">
                      <FiTrash2 className="mx-auto mb-2 opacity-20" size={48} />
                      <p>Tidak ada mandor di tong sampah.</p>
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
