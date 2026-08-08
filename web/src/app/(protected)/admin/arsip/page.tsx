"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FiRefreshCcw,
  FiTrash2,
  FiMail,
  FiBriefcase,
  FiAlertTriangle,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";

// Import Services & Types
import {
  getTrashedHeadWorkers,
  restoreHeadWorker,
  hardDeleteHeadWorker,
} from "@/services/head-worker.service";
import {
  getTrashedOwners,
  restoreOwner,
  hardDeleteOwner,
} from "@/services/owner.service";
import { getMandors } from "@/services/mandor.service";

import type { HeadWorker } from "@/types/head-worker.type";
import type { Owner } from "@/types/owner.type";
import type { Mandor } from "@/types/mandor.type";

// Tipe gabungan untuk state agar mendukung kedua data
type ArchiveItem = HeadWorker | Owner;

export default function AdminArchivePage() {
  const [activeTab, setActiveTab] = useState<"head-worker" | "owner">(
    "head-worker",
  );

  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [mandorList, setMandorList] = useState<Mandor[]>([]);
  const [selectedMandor, setSelectedMandor] = useState<string>("");

  // Fetch List Mandor untuk Filter (Hanya dipanggil sekali saat mount)
  useEffect(() => {
    const fetchMandorList = async () => {
      try {
        // Ambil dengan limit besar agar semua mandor masuk ke dropdown
        const res = await getMandors(1, 50);
        setMandorList(res.data || []);
      } catch (err) {
        console.error("Gagal mengambil data filter mandor", err);
      }
    };
    fetchMandorList();
  }, []);

  const fetchArchiveData = useCallback(async () => {
    setLoading(true);
    setItems([]);

    try {
      const res =
        activeTab === "head-worker"
          ? await getTrashedHeadWorkers(page, 10, selectedMandor || undefined)
          : await getTrashedOwners(page, 10, selectedMandor || undefined);

      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: unknown) {
      console.error("DETAIL ERROR FETCH:", err);

      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal mengambil data riwayat",
        );
      } else {
        toast.error("Terjadi kesalahan sistem");
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, selectedMandor]);

  useEffect(() => {
    fetchArchiveData();
  }, [fetchArchiveData]);

  // Handle Aksi dengan Strict Error Handling
  const handleRestore = async (id: string, name: string) => {
    try {
      if (activeTab === "head-worker") {
        await restoreHeadWorker(id);
      } else {
        await restoreOwner(id);
      }

      toast.success(`${name} berhasil dipulihkan ke mandor asalnya`);
      fetchArchiveData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal memulihkan data");
      }
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `PERINGATAN: Hapus permanen "${name}"?\n\nAkun tidak akan bisa dipulihkan lagi.`,
    );
    if (!isConfirmed) return;

    try {
      const deletePromise =
        activeTab === "head-worker"
          ? hardDeleteHeadWorker(id)
          : hardDeleteOwner(id);

      await toast.promise(deletePromise, {
        loading: "Menghancurkan data...",
        success: "Data berhasil dihapus permanen dari sistem",
        error: (err) =>
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal menghapus permanen",
      });

      // Mundurkan halaman jika item terakhir di halaman dihapus
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchArchiveData();
      }
    } catch (err: unknown) {
      // Error sudah di-handle oleh toast.promise
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Pusat Riwayat Akun
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola data yang dihapus oleh seluruh Mandor di sistem.
          </p>
        </header>

        {/* TOOLBAR: TABS & FILTER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab("head-worker");
                setPage(1);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer border-none ${
                activeTab === "head-worker"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 bg-transparent"
              }`}
            >
              Kepala Tukang
            </button>
            <button
              onClick={() => {
                setActiveTab("owner");
                setPage(1);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer border-none ${
                activeTab === "owner"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 bg-transparent"
              }`}
            >
              Owner
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <FiFilter className="text-slate-400" />
            <select
              value={selectedMandor}
              onChange={(e) => {
                setSelectedMandor(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none text-sm font-medium outline-none text-slate-700 cursor-pointer min-w-37.5"
            >
              <option value="">Semua Mandor</option>
              {/* Mapping Dinamis dari State mandorList */}
              {mandorList.map((mandor) => (
                <option key={mandor.id} value={mandor.id}>
                  {mandor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABEL RIWAYAT */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-5">Informasi Akun</th>
                  <th className="p-5">Dihapus Dari (Mandor)</th>
                  <th className="p-5">Tanggal Hapus</th>
                  <th className="p-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-20 text-center animate-pulse text-slate-400"
                    >
                      Memproses data riwayat...
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5">
                        {/* Ikon Profil */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
                              activeTab === "head-worker"
                                ? "bg-linear-to-tr from-emerald-100 to-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-linear-to-tr from-amber-100 to-amber-50 text-amber-600 border-amber-100"
                            }`}
                          >
                            {item.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Teks Nama & Email */}
                          <div>
                            <p className="font-bold text-slate-800">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <FiMail /> {item.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <FiBriefcase className="text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              {item.mandor?.name || "Global"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              @{item.mandor?.username || "admin"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-xs text-slate-500 font-medium">
                        {item.deletedAt
                          ? new Date(item.deletedAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRestore(item.id, item.name)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg font-bold hover:bg-green-100 transition-all border-none cursor-pointer text-xs"
                          >
                            <FiRefreshCcw size={14} /> Pulihkan
                          </button>
                          <button
                            onClick={() => handleHardDelete(item.id, item.name)}
                            className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border-none cursor-pointer"
                            title="Hard Delete (Permanen)"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <FiAlertTriangle
                          size={40}
                          className="mb-2 opacity-20"
                        />
                        <p className="font-bold">
                          Tidak ada riwayat akun ditemukan
                        </p>
                        <p className="text-xs">
                          Data terhapus akan muncul di sini sesuai filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer text-black"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer text-black"
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
