"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiCalendar,
  FiX,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Image from "next/image";

// Service & Types
import {
  getProjectDocumentations,
  deleteDocumentation,
  createDocumentation,
  updateDocumentation,
  uploadDocumentationFiles,
  deleteCloudinaryFile,
} from "@/services/documentation.service";
import type {
  Documentation,
  DocumentationFile,
} from "@/types/documentation.type";

// Validation Schema
import {
  createDocSchema,
  type CreateDocFormValues,
} from "@/validation/documentation.validation";

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

interface UploadResponseItem {
  resource_type?: string;
  fileUrl?: string;
  secure_url?: string;
  url?: string;
  cloudinaryId?: string;
  public_id?: string;
  id?: string;
}

export default function HeadWorkerDocumentationPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE PENCARIAN & PAGINASI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8; // Menampilkan 8 card per halaman (pas untuk grid 4x2 di desktop)

  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<
    DocumentationFile[]
  >([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateDocFormValues>({
    resolver: zodResolver(createDocSchema),
  });

  const currentFormFiles = watch("files") || [];

  // --- GET DATA ---
  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProjectDocumentations({
        projectId,
        limit, // Menggunakan limit yang didefinisikan
        page, // Mengirim nomor halaman saat ini
        ...(searchQuery && { search: searchQuery }),
      });
      setDocs(res.data);
      // Menangkap totalPages dari meta data backend
      setTotalPages(res.meta?.totalPages || 1);
    } catch (error) {
      console.error("Gagal fetch data:", error);
      toast.error("Gagal mengambil riwayat laporan");
    } finally {
      setLoading(false);
    }
  }, [projectId, searchQuery, page]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // ---UPLOAD FILE---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const fileArray = Array.from(files);
      const response = await uploadDocumentationFiles(fileArray);

      if (response.success) {
        console.log("ISI RESPONSE UPLOAD:", response.data);

        const rawData = response.data as UploadResponseItem[];
        const uploadedData: DocumentationFile[] = rawData.map((item) => {
          const isVideo = item.resource_type === "video";
          return {
            fileUrl: item.fileUrl || item.secure_url || item.url || "",
            cloudinaryId: item.cloudinaryId || item.public_id || item.id || "",
            fileType: isVideo ? "VIDEO" : "PHOTO",
          };
        });

        setNewlyUploadedFiles((prev) => [...prev, ...uploadedData]);

        const currentFiles = getValues("files") || [];
        setValue("files", [...currentFiles, ...uploadedData], {
          shouldValidate: true,
        });

        toast.success(`${uploadedData.length} file berhasil diunggah`);
      }
    } catch (error) {
      const err = error as ApiError;
      if (err?.response?.status === 500) {
        toast.error(
          "Gagal terhubung ke server atau database saat mengunggah file. Silakan coba lagi.",
        );
      } else {
        toast.error(err?.response?.data?.message || "Gagal mengunggah file");
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // --- HAPUS FILE SPESIFIK ---
  const handleRemoveSpecificFile = async (
    fileToRemove: DocumentationFile,
    index: number,
  ) => {
    const cloudinaryId = fileToRemove.cloudinaryId;
    if (!cloudinaryId) return;

    const isNewlyUploaded = newlyUploadedFiles.some(
      (f) => f.cloudinaryId === cloudinaryId,
    );

    if (isNewlyUploaded) {
      try {
        await deleteCloudinaryFile(cloudinaryId);
        console.log(
          `✅ File spesifik (${cloudinaryId}) dihapus dari Cloudinary.`,
        );
      } catch (error) {
        console.error(
          "❌ Gagal menghapus file spesifik dari Cloudinary",
          error,
        );
        toast.error("Gagal menghapus foto dari server");
      }
    }

    setNewlyUploadedFiles((prev) =>
      prev.filter((f) => f.cloudinaryId !== cloudinaryId),
    );

    const currentFiles = getValues("files") || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    setValue("files", updatedFiles, {
      shouldValidate: true,
    });
  };

  // --- DELETE DATA DOKUMENTASI ---
  const handleDelete = async (docId: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus laporan ini? Semua foto terkait juga akan terhapus.",
      )
    )
      return;

    try {
      await deleteDocumentation(docId);
      toast.success("Laporan berhasil dihapus");
      // Jika hapus data dan halaman kosong, mundur 1 halaman (kecuali halaman 1)
      if (docs.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchDocs();
      }
    } catch (error) {
      const err = error as ApiError;
      if (err?.response?.status === 500) {
        toast.error(
          "Gagal terhubung ke server atau database. Laporan gagal dihapus.",
        );
      } else {
        toast.error(err?.response?.data?.message || "Gagal menghapus laporan");
      }
    }
  };

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setEditingDoc(null);
    setNewlyUploadedFiles([]);
    reset({
      projectId,
      session: "PAGI",
      reportDate: new Date().toISOString().split("T")[0],
      files: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doc: Documentation) => {
    setEditingDoc(doc);
    setNewlyUploadedFiles([]);

    const formattedDateForInput = new Date(doc.reportDate)
      .toISOString()
      .split("T")[0];

    reset({
      projectId,
      reportDate: formattedDateForInput,
      session: doc.session,
      workArea: doc.workArea,
      task: doc.task,
      target: doc.target || "",
      progress: doc.progress || "",
      files: doc.files,
    });
    setIsModalOpen(true);
  };

  const handleCancel = async () => {
    if (newlyUploadedFiles.length > 0) {
      try {
        await Promise.all(
          newlyUploadedFiles.map((file) =>
            deleteCloudinaryFile(file.cloudinaryId),
          ),
        );
        console.log(
          `✅ Berhasil membersihkan ${newlyUploadedFiles.length} file sampah dari Cloudinary.`,
        );
      } catch (error) {
        console.error("❌ Gagal membersihkan file sampah di Cloudinary", error);
      }
    }
    setIsModalOpen(false);
    setEditingDoc(null);
    setNewlyUploadedFiles([]);
  };

  // --- FORM SUBMIT ---
  const onSubmit = async (data: CreateDocFormValues) => {
    try {
      const [year, month, day] = data.reportDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const formattedPayload = {
        ...data,
        reportDate: formattedDate,
        projectId: projectId as string,
      };

      if (editingDoc) {
        await updateDocumentation(editingDoc.id, formattedPayload);
        toast.success("Laporan berhasil diperbarui");
      } else {
        await createDocumentation(formattedPayload);
        toast.success("Laporan berhasil dibuat");
        setPage(1); // Lempar user ke halaman 1 agar bisa lihat laporan terbarunya
      }

      setIsModalOpen(false);
      fetchDocs();
    } catch (error) {
      const err = error as ApiError;
      if (err?.response?.status === 500) {
        toast.error(
          "Gagal terhubung ke server atau database. Silakan coba lagi.",
        );
      } else {
        toast.error(
          err?.response?.data?.message || "Terjadi kesalahan saat menyimpan",
        );
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Dokumentasi Harian
          </h1>
          <p className="text-slate-500 text-sm mt-1 mb-4 sm:mb-0">
            Catat dan pantau progres kerja lapangan proyek ini secara
            *real-time*.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari laporan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset ke halaman 1 saat mengetik
              }}
              className="block w-full text-black pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:text-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-fit whitespace-nowrap"
          >
            <FiPlus size={20} />
            <span>Buat Laporan</span>
          </button>
        </div>
      </div>

      {/* LIST DOKUMENTASI */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : docs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col group"
              >
                {/* IMAGE HEADER */}
                <div className="relative h-48 w-full bg-slate-100 border-b border-slate-100 overflow-hidden">
                  {doc.files && doc.files.length > 0 ? (
                    <>
                      {doc.files[0].fileType === "VIDEO" ? (
                        <video
                          src={doc.files[0].fileUrl}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Image
                          src={doc.files[0].fileUrl}
                          alt="preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/400x300.png?text=Gambar+Hilang";
                            e.currentTarget.srcset = "";
                          }}
                        />
                      )}
                      {doc.files.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                          +{doc.files.length - 1} File
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                      <FiFileText size={32} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">
                        Tidak ada media
                      </span>
                    </div>
                  )}

                  {/* FLOATING ACTION BUTTONS */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEditModal(doc)}
                      className="p-2 bg-white/90 backdrop-blur text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg shadow-sm transition-colors"
                      title="Edit Laporan"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 bg-white/90 backdrop-blur text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg shadow-sm transition-colors"
                      title="Hapus Laporan"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* CARD CONTENT */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider ${
                          doc.session === "PAGI"
                            ? "bg-amber-100 text-amber-700 border border-amber-200/50"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-200/50"
                        }`}
                      >
                        {doc.session}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <FiCalendar size={12} className="text-slate-400" />
                        {new Date(doc.reportDate)
                          .toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                          .replace(/\//g, "-")}
                      </span>
                    </div>
                  </div>

                  <h3
                    className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-1"
                    title={doc.workArea}
                  >
                    {doc.workArea}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed flex-1">
                    {doc.task}
                  </p>

                  {doc.progress && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Progress
                      </p>
                      <p className="text-sm text-slate-800 font-medium truncate">
                        {doc.progress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10 mb-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                <FiChevronLeft /> Sebelumnya
              </button>
              <span className="text-sm font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                Hal {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                Selanjutnya <FiChevronRight />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            {searchQuery ? (
              <FiSearch className="w-10 h-10 text-slate-400" />
            ) : (
              <FiFileText className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            {searchQuery ? "Laporan Tidak Ditemukan" : "Belum Ada Laporan"}
          </h3>
          <p className="text-slate-500 text-center max-w-sm mb-6">
            {searchQuery
              ? `Tidak ada laporan yang cocok dengan kata kunci "${searchQuery}".`
              : "Pekerjaan hari ini belum didokumentasikan. Klik tombol di bawah untuk membuat laporan perdana."}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Buat Laporan Pertama
            </button>
          )}
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 sm:p-0 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto sm:m-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-800">
                {editingDoc ? "Edit Laporan Pekerjaan" : "Buat Laporan Baru"}
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("reportDate")}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                  {errors.reportDate && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.reportDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Sesi Kerja <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("session")}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                  >
                    <option value="PAGI">Shift Pagi</option>
                    <option value="SORE">Shift Sore</option>
                  </select>
                  {errors.session && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.session.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Area Kerja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("workArea")}
                  placeholder="Misal: Dapur / Kamar mandi / Lantai 2"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                {errors.workArea && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.workArea.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Deskripsi Pekerjaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("task")}
                  rows={3}
                  placeholder="Misal: Ngecor / Ngaci/ Bikin Openingan"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                />
                {errors.task && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.task.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Target
                  </label>
                  <input
                    type="text"
                    {...register("target")}
                    placeholder="Misal: Selesai hari ini"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Progress
                  </label>
                  <input
                    type="text"
                    {...register("progress")}
                    placeholder="Misal: 80% / Tinggal finishing"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              {/* AREA UPLOAD FILE */}
              <div className="bg-slate-50/50 border border-dashed border-slate-300 p-5 rounded-2xl">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Bukti Lapangan <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Upload foto atau video progres (Maks. 50MB per file).
                </p>

                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*, video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {isUploading && (
                  <div className="flex items-center gap-2 mt-4 text-indigo-600">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm font-semibold">
                      Mengunggah file ke cloud...
                    </span>
                  </div>
                )}

                {errors.files && (
                  <p className="text-red-500 text-xs mt-2 font-medium">
                    {errors.files.message}
                  </p>
                )}

                {/* Preview File */}
                {currentFormFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
                    {currentFormFiles.map((file, index) => (
                      <div
                        key={file.cloudinaryId || index}
                        className="relative h-24 bg-slate-200 rounded-xl overflow-hidden group shadow-sm"
                      >
                        {!file.fileUrl ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-medium text-slate-500">
                            <span className="animate-pulse">Memuat...</span>
                          </div>
                        ) : (
                          <>
                            {file.fileType === "VIDEO" ? (
                              <video
                                src={file.fileUrl}
                                className="object-cover w-full h-full"
                                controls
                              />
                            ) : (
                              <Image
                                src={file.fileUrl}
                                alt={`preview-${index}`}
                                fill
                                sizes="(max-width: 768px) 33vw, 20vw"
                                className="object-cover"
                                unoptimized
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/150x150.png?text=Error";
                                  e.currentTarget.srcset = "";
                                }}
                              />
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSpecificFile(file, index)
                              }
                              className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
                              title="Hapus file ini"
                            >
                              <FiX size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
