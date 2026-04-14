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

export default function HeadWorkerDocumentationPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State khusus untuk file yang baru diupload di sesi form aktif
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<
    DocumentationFile[]
  >([]);

  // Setup React Hook Form
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
  // Pantau perubahan array files di form untuk merender preview
  const currentFormFiles = watch("files") || [];

  // --- GET DATA ---
  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProjectDocumentations({ projectId, limit: 50 });
      setDocs(res.data);
    } catch (err) {
      toast.error("Gagal mengambil riwayat laporan");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      // Ubah FileList menjadi Array
      const fileArray = Array.from(files);

      // Hit API Upload
      const response = await uploadDocumentationFiles(fileArray);

      if (response.success) {
        // Cek di console browser apa isi asli dari response.data
        console.log("ISI RESPONSE UPLOAD:", response.data);

        // Mapping data dari backend agar sesuai dengan tipe DocumentationFile di FE
        const uploadedData: DocumentationFile[] = response.data.map(
          (item: UploadResponseItem) => ({
            // Jika backend pakai 'url' atau 'secure_url', ubah di sini:
            fileUrl: item.url,

            // Jika backend pakai 'public_id' untuk id cloudinary-nya, ubah di sini:
            cloudinaryId: item.cloudinaryId || "id_not_found",

            // Pastikan fileType sesuai
            fileType: item.fileType || "PHOTO",
          }),
        );

        // Simpan ke state newlyUploadedFiles (untuk antisipasi kalau user klik Batal)
        setNewlyUploadedFiles((prev) => [...prev, ...uploadedData]);

        // Masukkan ke react-hook-form dengan cara mengambil data yang sudah ada sebelumnya
        // getValues() adalah fungsi dari useForm yang perlu di export
        const currentFiles = getValues("files") || [];
        setValue("files", [...currentFiles, ...uploadedData], {
          shouldValidate: true, // Agar error schema Zod langsung hilang setelah file masuk
        });

        toast.success(`${uploadedData.length} file berhasil diunggah`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      // Reset input file agar bisa upload file yang sama jika dihapus
      e.target.value = "";
    }
  };

  // --- DELETE DATA ---
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
      fetchDocs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menghapus laporan");
    }
  };

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setEditingDoc(null);
    setNewlyUploadedFiles([]);
    reset({
      projectId,
      session: "PAGI",
      reportDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format untuk input type="date"
      files: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doc: Documentation) => {
    setEditingDoc(doc);
    setNewlyUploadedFiles([]); // Kosongkan, karena ini file lama, bukan yang baru diupload

    // Ubah format DD-MM-YYYY ke YYYY-MM-DD untuk input HTML
    const [day, month, year] = doc.reportDate.split("-");

    reset({
      projectId,
      reportDate: `${year}-${month}-${day}`,
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
    // Jika ada file BARU yang terupload tapi user batal submit, hapus dari cloud!
    if (newlyUploadedFiles.length > 0) {
      try {
        await Promise.all(
          newlyUploadedFiles.map((file) =>
            deleteCloudinaryFile(file.cloudinaryId),
          ),
        );
      } catch (error) {
        console.error("Gagal membersihkan file sampah di Cloudinary");
      }
    }
    setIsModalOpen(false);
    setEditingDoc(null);
    setNewlyUploadedFiles([]);
  };

  // --- FORM SUBMIT (CREATE & UPDATE) ---
  const onSubmit = async (data: CreateDocFormValues) => {
    try {
      // Ubah format YYYY-MM-DD dari form menjadi DD-MM-YYYY sesuai Zod dan Backend
      const [year, month, day] = data.reportDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const formattedPayload = {
        ...data,
        reportDate: formattedDate,
        // Asalnya asli dari upload
        projectId: projectId as string,
      };

      if (editingDoc) {
        await updateDocumentation(editingDoc.id, formattedPayload);
        toast.success("Laporan berhasil diperbarui");
      } else {
        await createDocumentation(formattedPayload);
        toast.success("Laporan berhasil dibuat");
      }

      setIsModalOpen(false);
      fetchDocs();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Terjadi kesalahan saat menyimpan",
      );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dokumentasi Harian
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola laporan progres kerja untuk proyek ini.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-sm w-fit"
        >
          <FiPlus /> Laporan Baru
        </button>
      </div>

      {/* LIST DOKUMENTASI */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      ) : docs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              {/* ... Isi card ... */}
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${doc.session === "PAGI" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}
                >
                  SESI {doc.session}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(doc)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-800 text-lg mb-1">
                {doc.workArea}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                {doc.task}
              </p>

              {doc.files && doc.files.length > 0 ? (
                <div className="relative h-36 w-full rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={doc.files[0].fileUrl}
                    alt="preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  {doc.files.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      +{doc.files.length - 1} Foto
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-36 w-full rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm border border-dashed">
                  Tidak ada foto
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
          <FiFileText className="mx-auto w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">Belum ada laporan</h3>
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingDoc ? "Edit Laporan" : "Buat Laporan Baru"}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    {...register("reportDate")}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  />
                  {errors.reportDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.reportDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sesi *
                  </label>
                  <select
                    {...register("session")}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="PAGI">Pagi</option>
                    <option value="SORE">Sore</option>
                  </select>
                  {errors.session && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.session.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area Kerja *
                </label>
                <input
                  type="text"
                  {...register("workArea")}
                  placeholder="Misal: Blok A Lantai 1"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
                {errors.workArea && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workArea.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pekerjaan / Task *
                </label>
                <textarea
                  {...register("task")}
                  rows={3}
                  placeholder="Jelaskan detail pekerjaan"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
                {errors.task && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.task.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target
                  </label>
                  <input
                    type="text"
                    {...register("target")}
                    placeholder="Misal: 100%"
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progress
                  </label>
                  <input
                    type="text"
                    {...register("progress")}
                    placeholder="Misal: 80%"
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* AREA UPLOAD FILE */}
              <div className="bg-gray-50 border border-dashed border-gray-300 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Foto/Video Dokumentasi *
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*, video/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {isUploading && (
                  <p className="text-sm text-blue-600 mt-2 animate-pulse">
                    Sedang mengunggah file...
                  </p>
                )}

                {errors.files && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.files.message}
                  </p>
                )}

                {/* Preview File yang sudah ter-upload */}
                {currentFormFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {currentFormFiles.map((file, index) => (
                      <div
                        key={file.cloudinaryId || index}
                        className="relative h-20 bg-gray-200 rounded-lg overflow-hidden group"
                      >
                        {file?.fileUrl ? (
                          <Image
                            src={file.fileUrl}
                            alt={`preview-${index}`}
                            fill
                            sizes="(max-width: 768px) 33vw, 20vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            Memuat...
                          </div>
                        )}
                        {/* Opsional: Tombol hapus file spesifik bisa ditambahkan di sini nanti */}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-blue-300"
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
