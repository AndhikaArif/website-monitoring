"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUsers,
  FiMail,
  FiTrash,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { getOwners, deleteOwner } from "@/services/owner.service";
import { Owner } from "@/types/owner.type";
import ViewProfileModal from "@/components/modals/view-profile-modal";

export default function OwnerPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOwners(page);
      setOwners(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: unknown) {
      setOwners([]);
      setTotalPages(1);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 404) {
          // 404 berarti belum ada data klien, bukan error sistem
          setErrorMsg(null);
        } else if (status === 500) {
          // 🔥 Penanganan Error Database Down / Timeout
          const msg =
            "Server atau database sedang mengalami gangguan. Silakan coba beberapa saat lagi.";
          setErrorMsg(msg);
          toast.error("Error 500: Server bermasalah");
        } else {
          // Error lain (400, 401, 403, Koneksi Mati)
          const errorMessage =
            err.response?.data?.message || "Koneksi ke server gagal.";
          setErrorMsg(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        setErrorMsg("Terjadi kesalahan sistem yang tidak terduga.");
        console.error("Non-Axios Error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Yakin mau hapus data klien? (Data akan dipindahkan ke tong sampah)",
      )
    )
      return;
    try {
      await toast.promise(deleteOwner(id), {
        loading: "Menghapus data klien...",
        success: "Klien berhasil dihapus! 🗑️",
        error: "Gagal menghapus klien",
      });

      if (owners.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRowClick = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsViewModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
        <div className="max-w-7xl mx-auto">
          {/* TOP SECTION: TITLE & ACTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Manajemen Klien (Owner)
              </h1>
              <p className="text-gray-500 mt-1">
                Kelola data seluruh pemilik rumah / klien yang Anda tangani.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* TOMBOL TONG SAMPAH OWNER */}
              <button
                onClick={() => router.push("/mandor/owner/trashed")}
                className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-600 font-semibold px-5 py-2.5 rounded-xl transition-all border border-gray-200 active:scale-95 shadow-sm cursor-pointer"
                title="Lihat Sampah"
              >
                <FiTrash className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Tong Sampah</span>
              </button>

              <button
                onClick={() => router.push("/mandor/owner/create")}
                className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-200 cursor-pointer border-none"
              >
                <FiPlus className="mr-2 w-5 h-5" />
                Tambah Klien
              </button>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Klien Aktif
                </p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {owners.length}{" "}
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
                    <th className="p-5">Profil Klien</th>
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
                  ) : errorMsg ? (
                    <tr>
                      <td colSpan={4} className="text-center p-16">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <FiAlertCircle className="w-8 h-8 text-red-500" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">
                            Gagal Memuat Data
                          </h3>
                          <p className="text-gray-500 font-medium max-w-sm mb-6">
                            {errorMsg}
                          </p>
                          <button
                            onClick={fetchData}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-sm cursor-pointer"
                          >
                            <FiRefreshCw /> Coba Lagi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : owners.length > 0 ? (
                    owners.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-purple-50/30 transition-colors group"
                      >
                        <td
                          className="p-5 cursor-pointer"
                          onClick={() => handleRowClick(o)}
                          title="Klik untuk lihat detail profil"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-bold border border-purple-100">
                              {o.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {o.name}
                              </p>
                              <p className="text-xs text-gray-400 md:hidden">
                                {o.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 hidden lg:table-cell">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-mono lowercase">
                            @{o.username}
                          </span>
                        </td>
                        <td className="p-5 hidden md:table-cell text-gray-600">
                          <div className="flex items-center gap-2">
                            <FiMail className="text-gray-400" /> {o.email}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/mandor/owner/edit/${o.id}`);
                              }}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                              title="Edit"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(o.id);
                              }}
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
                            Belum ada data klien.
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

      <ViewProfileModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedOwner}
      />
    </>
  );
}
