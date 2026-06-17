"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiEdit2,
  FiMail,
  FiBriefcase,
  FiAlertTriangle,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { getHeadWorkers } from "@/services/head-worker.service";
import { getOwners } from "@/services/owner.service";
import { getMandors } from "@/services/mandor.service";

import type { HeadWorker } from "@/types/head-worker.type";
import type { Owner } from "@/types/owner.type";
import type { Mandor } from "@/types/mandor.type";

// Tipe gabungan untuk akun aktif
type UserItem = HeadWorker | Owner;

export default function AdminUserManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"head-worker" | "owner">(
    "head-worker",
  );

  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [mandorList, setMandorList] = useState<Mandor[]>([]);
  const [selectedMandor, setSelectedMandor] = useState<string>("");

  // Fetch List Mandor untuk Filter (Hanya dipanggil sekali saat mount)
  useEffect(() => {
    const fetchMandorList = async () => {
      try {
        const res = await getMandors(1, 50);
        setMandorList(res.data || []);
      } catch (err) {
        console.error("Gagal mengambil data filter mandor", err);
      }
    };
    fetchMandorList();
  }, []);

  const fetchActiveUsers = useCallback(async () => {
    setLoading(true);
    setItems([]);

    try {
      // Memanggil API khusus akun aktif (deletedAt: null)
      const res =
        activeTab === "head-worker"
          ? await getHeadWorkers(page, 10, selectedMandor || undefined)
          : await getOwners(page, 10, selectedMandor || undefined);

      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: unknown) {
      console.error("DETAIL ERROR FETCH ACTIVE USERS:", err);

      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Gagal mengambil data pengguna",
        );
      } else {
        toast.error("Terjadi kesalahan sistem");
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, selectedMandor]);

  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola data operasional Kepala Tukang dan Owner aktif yang terdaftar
            di sistem.
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
              {mandorList.map((mandor) => (
                <option key={mandor.id} value={mandor.id}>
                  {mandor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABEL PENGGUNA AKTIF */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-5">Informasi Akun</th>
                  <th className="p-5">Terhubung Ke (Mandor)</th>
                  <th className="p-5">Tanggal Terdaftar</th>
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
                      Memuat data pengguna aktif...
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5">
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
                              {item.mandor?.name || "Global / Tidak Ada"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {item.mandor?.username
                                ? `@${item.mandor.username}`
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 text-xs text-slate-500 font-medium">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString(
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
                          {/* Tombol Edit Mengarah ke Form Edit */}
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/users/${activeTab === "head-worker" ? "head-worker" : "owner"}/edit/${item.id}`,
                              )
                            }
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-all border-none cursor-pointer text-xs"
                          >
                            <FiEdit2 size={14} /> Edit Akun
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
                          Tidak ada data pengguna aktif ditemukan
                        </p>
                        <p className="text-xs">
                          Akun yang aktif akan muncul di sini sesuai dengan
                          filter.
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
