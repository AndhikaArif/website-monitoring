"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiUserPlus,
  FiSearch,
  FiChevronLeft,
  FiCheck,
  FiLoader,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

import { getProjectDetail, assignOwner } from "@/services/project.service";
import { getOwners } from "@/services/owner.service";
import { ProjectDetailResponse } from "@/types/project.type";
import { Owner, OwnerResponse } from "@/types/owner.type";

export default function AssignOwnerPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();

  const [availableOwners, setAvailableOwners] = useState<Owner[]>([]);
  // Menggunakan string tunggal, bukan array, karena 1 proyek = 1 klien
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectRes, ownersRes] = await Promise.all([
        getProjectDetail(projectId) as Promise<ProjectDetailResponse>,
        getOwners(1, 50) as Promise<OwnerResponse>, // Mengambil hingga 50 klien
      ]);

      // Ambil ID Klien yang SAAT INI sudah terdaftar di project (jika ada)
      const currentOwnerId = projectRes.data.owner?.id;

      // Filter: Jangan tampilkan klien yang memang sudah ter-assign di proyek ini
      const available = ownersRes.data.filter(
        (owner: Owner) => owner.id !== currentOwnerId,
      );

      setAvailableOwners(available);
    } catch {
      toast.error("Gagal memuat data klien");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fungsi pilih hanya 1 (menimpa pilihan sebelumnya)
  const selectOwner = (id: string) => {
    setSelectedId(id);
  };

  const handleAssign = async () => {
    if (!selectedId) return toast.error("Pilih satu klien terlebih dahulu");

    try {
      setSubmitting(true);
      await assignOwner(projectId, { ownerId: selectedId });
      toast.success("Klien berhasil ditugaskan ke proyek");
      router.push(`/mandor/project/${projectId}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal menambahkan klien");
      } else {
        toast.error("Terjadi kesalahan sistem");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOwners = availableOwners.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/mandor/project/${projectId}`)}
          className="flex items-center text-gray-500 hover:text-purple-600 mb-6 bg-transparent border-none cursor-pointer group"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Detail Proyek
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FiUserPlus className="text-purple-600" /> Pilih Klien (Owner)
            </h1>
            {selectedId && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                1 Terpilih
              </span>
            )}
          </div>

          <div className="mb-6 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
            <p className="text-sm text-orange-800 flex items-start gap-2 leading-relaxed">
              <span className="mt-0.5 font-bold">💡</span> Satu proyek hanya
              dapat dimiliki oleh satu klien. Memilih klien baru akan menimpa
              klien yang sudah ada (jika ada).
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama klien atau username..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Owner List */}
          <div className="space-y-3 max-h-100 overflow-y-auto mb-8 pr-2 custom-scrollbar">
            {filteredOwners.length > 0 ? (
              filteredOwners.map((owner) => (
                <div
                  key={owner.id}
                  onClick={() => selectOwner(owner.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                    selectedId === owner.id
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-transparent bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shadow-inner">
                      {owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{owner.name}</p>
                      <p className="text-xs text-gray-500">
                        @{owner.username} • {owner.email}
                      </p>
                    </div>
                  </div>

                  {/* Indicator Lingkaran Single Select */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedId === owner.id
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {selectedId === owner.id && <FiCheck size={14} />}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 flex flex-col items-center">
                <FiUser className="text-4xl text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">
                  {availableOwners.length === 0
                    ? "Belum ada data klien yang bisa dipilih."
                    : "Klien tidak ditemukan."}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleAssign}
            disabled={!selectedId || submitting}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold disabled:bg-gray-200 disabled:text-gray-400 hover:bg-purple-700 active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" /> Memproses...
              </>
            ) : (
              "Assign Klien ke Proyek"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
