"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiUserPlus,
  FiSearch,
  FiChevronLeft,
  FiCheck,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getProjectDetail, assignHeadWorker } from "@/services/project.service";
import { getHeadWorkers } from "@/services/head-worker.service";
import { ProjectDetailResponse } from "@/types/project.type";
import { HeadWorker, HeadWorkerResponse } from "@/types/head-worker.type";
import axios from "axios";

export default function AssignWorkerPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();

  const [availableWorkers, setAvailableWorkers] = useState<HeadWorker[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectRes, workersRes] = await Promise.all([
        getProjectDetail(projectId) as Promise<ProjectDetailResponse>,
        getHeadWorkers(1, 50) as Promise<HeadWorkerResponse>,
      ]);

      // Ambil ID yang sudah terdaftar di project
      const assignedIds = projectRes.data.headWorkers.map(
        (w: HeadWorker) => w.id,
      );

      // Filter: Hanya yang BELUM ada di project ini
      const available = workersRes.data.filter(
        (worker: HeadWorker) => !assignedIds.includes(worker.id),
      );

      setAvailableWorkers(available);
    } catch {
      toast.error("Gagal memuat data pekerja");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleWorker = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0)
      return toast.error("Pilih minimal satu pekerja");

    try {
      setSubmitting(true);
      await assignHeadWorker(projectId, { headWorkerIds: selectedIds });
      toast.success(`${selectedIds.length} Pekerja berhasil ditambahkan`);
      router.push(`/mandor/project/${projectId}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gagal menambahkan pekerja");
      } else {
        toast.error("Terjadi kesalahan sistem");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWorkers = availableWorkers.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-purple-600 mb-6 bg-transparent border-none cursor-pointer group"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Detail Proyek
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FiUserPlus className="text-purple-600" /> Tambah Head Worker
            </h1>
            {selectedIds.length > 0 && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                {selectedIds.length} Terpilih
              </span>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Worker List */}
          <div className="space-y-3 max-h-100 overflow-y-auto mb-8 pr-2 custom-scrollbar">
            {filteredWorkers.length > 0 ? (
              filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  onClick={() => toggleWorker(worker.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                    selectedIds.includes(worker.id)
                      ? "border-purple-600 bg-purple-50 shadow-sm"
                      : "border-transparent bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shadow-inner">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{worker.name}</p>
                      <p className="text-xs text-gray-500">
                        @{worker.username}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedIds.includes(worker.id)
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-gray-200"
                    }`}
                  >
                    {selectedIds.includes(worker.id) && <FiCheck size={14} />}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">
                  {availableWorkers.length === 0
                    ? "Semua pekerja sudah ditugaskan ke proyek ini."
                    : "Pekerja tidak ditemukan."}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleAssign}
            disabled={selectedIds.length === 0 || submitting}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold disabled:bg-gray-200 disabled:text-gray-400 hover:bg-purple-700 active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" /> Memproses...
              </>
            ) : (
              `Assign ${selectedIds.length} Pekerja`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
