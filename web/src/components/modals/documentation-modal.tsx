"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiPlus, FiX, FiInfo } from "react-icons/fi";
import toast from "react-hot-toast";
import Image from "next/image";

import {
  createDocumentation,
  updateDocumentation,
  uploadDocumentationFiles,
  deleteCloudinaryFile,
} from "@/services/documentation.service";
import {
  createDocSchema,
  type CreateDocFormValues,
} from "@/validation/documentation.validation";
import type {
  DocumentationFile,
  Documentation,
  DocumentationSession,
} from "@/types/documentation.type";

interface ApiError {
  response?: { status?: number; data?: { message?: string } };
}

interface UploadResponseItem {
  resource_type?: string;
  fileType?: string;
  fileUrl?: string;
  secure_url?: string;
  url?: string;
  cloudinaryId?: string;
  public_id?: string;
  id?: string;
}

interface CreateDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isFormLocked: boolean;
  initialDate: string;
  initialSession: DocumentationSession;
  editingDoc: Documentation | null;
  projectStartDate?: string; // TANGGAL MULAI PROYEK (Format YYYY-MM-DD)
  onSuccess: () => void;
}

const toSentenceCase = (text: string) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function CreateDocumentationModal({
  isOpen,
  onClose,
  projectId,
  isFormLocked,
  initialDate,
  initialSession,
  editingDoc,
  projectStartDate,
  onSuccess,
}: CreateDocumentationModalProps) {
  // Hitung tanggal HARI INI dalam zona lokal (YYYY-MM-DD) untuk max date
  const [todayDateStr, setTodayDateStr] = useState("");
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      setTodayDateStr(`${year}-${month}-${day}`);
    }
  }, [isOpen]);

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
    defaultValues: {
      projectId: "",
      session: "PAGI",
      reportDate: "",
      workArea: "",
      task: "",
      target: "",
      progress: "",
      files: [],
    },
  });

  const currentFormFiles = watch("files") || [];

  // Memantau nilai sesi & tanggal untuk ditampilkan di kotak statis UI
  const watchedSession = watch("session");
  const watchedReportDate = watch("reportDate");

  // Penentu apakah kita harus menampilkan Info Statis atau Input Form biasa
  const showStaticHeader = Boolean(editingDoc || isFormLocked);

  // Reset form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setNewlyUploadedFiles([]);
      if (editingDoc) {
        reset({
          projectId,
          session: editingDoc.session,
          reportDate: new Date(editingDoc.reportDate)
            .toISOString()
            .split("T")[0],
          workArea: editingDoc.workArea,
          task: editingDoc.task,
          target: editingDoc.target || "",
          progress: editingDoc.progress || "",
          files: editingDoc.files || [],
        });
      } else {
        reset({
          projectId,
          session: initialSession,
          reportDate: initialDate,
          workArea: "",
          task: "",
          target: "",
          progress: "",
          files: [],
        });
      }
    }
  }, [isOpen, editingDoc, initialDate, initialSession, projectId, reset]);

  if (!isOpen) return null;

  // --- LOGIKA UPLOAD & DRAG DROP FILE ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const fileArray = Array.from(files);
      const response = await uploadDocumentationFiles(fileArray);

      if (response.success) {
        const rawData = response.data as UploadResponseItem[];

        const uploadedData: DocumentationFile[] = rawData.map((item) => {
          const finalUrl = item.url || item.fileUrl || item.secure_url || "";
          const isVideo =
            item.fileType === "VIDEO" ||
            item.resource_type === "video" ||
            finalUrl.toLowerCase().includes(".mp4");

          return {
            fileUrl: finalUrl,
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
          "Gagal terhubung ke server atau database saat mengunggah file.",
        );
      } else {
        toast.error(err?.response?.data?.message || "Gagal mengunggah file");
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const syntheticEvent = {
        target: { files },
      } as React.ChangeEvent<HTMLInputElement>;
      await handleFileUpload(syntheticEvent);
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
        await deleteCloudinaryFile(cloudinaryId, fileToRemove.fileType);
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
    setValue("files", updatedFiles, { shouldValidate: true });
  };

  // --- FORM CANCEL & SUBMIT ---
  const handleCancelClick = async () => {
    if (newlyUploadedFiles.length > 0) {
      try {
        await Promise.all(
          newlyUploadedFiles.map((file) =>
            deleteCloudinaryFile(file.cloudinaryId, file.fileType),
          ),
        );
      } catch (error) {
        console.error("❌ Gagal membersihkan file sampah di Cloudinary", error);
      }
    }
    onClose();
  };

  const onSubmitForm = async (data: CreateDocFormValues) => {
    try {
      const [year, month, day] = data.reportDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const formattedPayload = {
        ...data,
        reportDate: formattedDate,
        projectId,
      };

      if (editingDoc) {
        await updateDocumentation(editingDoc.id, formattedPayload);
        toast.success("Laporan berhasil diperbarui");
      } else {
        await createDocumentation(formattedPayload);
        toast.success("Laporan berhasil dibuat");
      }

      onSuccess();
      onClose();
    } catch (error) {
      const err = error as ApiError;
      if (err?.response?.status === 500) {
        toast.error("Gagal terhubung ke server atau database.");
      } else {
        toast.error(
          err?.response?.data?.message || "Terjadi kesalahan saat menyimpan",
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 sm:p-0 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto sm:m-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800">
            {editingDoc ? "Edit Laporan Pekerjaan" : "Buat Laporan Baru"}
          </h2>
          <button
            type="button"
            onClick={handleCancelClick}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-5">
          {/* ================= TANGGAL & SESI ================= */}
          {showStaticHeader ? (
            /* Tampilan saat EDIT atau CREATE DARI KOTAK: Sembunyikan input, tampilkan info statis */
            <div className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <FiInfo className="text-emerald-600 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-slate-800 uppercase">
                  Laporan: Sesi {watchedSession}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tanggal:{" "}
                  {watchedReportDate
                    ? new Date(watchedReportDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
              {/* Hidden inputs agar react-hook-form & Zod tetap menerima data yang valid */}
              <input type="hidden" {...register("reportDate")} />
              <input type="hidden" {...register("session")} />
            </div>
          ) : (
            /* Tampilan saat CREATE BEBAS (Tombol Header): Tampilkan form input normal */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("reportDate")}
                  min={projectStartDate} // Cegah input sebelum proyek mulai
                  max={todayDateStr} // Cegah input tanggal masa depan
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none transition-all appearance-none cursor-pointer focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="PAGI">Pagi</option>
                  <option value="SORE">Sore</option>
                </select>
                {errors.session && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.session.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Area Kerja */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Area Kerja <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("workArea")}
              onBlur={(e) => {
                register("workArea").onBlur(e);
                setValue("workArea", toSentenceCase(e.target.value), {
                  shouldValidate: true,
                });
              }}
              placeholder="Misal: Dapur / Kamar mandi / Lantai 2"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            {errors.workArea && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">
                {errors.workArea.message}
              </p>
            )}
          </div>

          {/* Deskripsi Pekerjaan */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Deskripsi Pekerjaan <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("task")}
              rows={3}
              onBlur={(e) => {
                register("task").onBlur(e);
                setValue("task", toSentenceCase(e.target.value), {
                  shouldValidate: true,
                });
              }}
              placeholder="Misal: Ngecor / Ngaci/ Bikin Openingan"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
            />
            {errors.task && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">
                {errors.task.message}
              </p>
            )}
          </div>

          {/* Target & Progres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Target
              </label>
              <input
                type="text"
                {...register("target")}
                onBlur={(e) => {
                  register("target").onBlur(e);
                  setValue("target", toSentenceCase(e.target.value), {
                    shouldValidate: true,
                  });
                }}
                placeholder="Misal: Selesai hari ini"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Progres / Kendala
              </label>
              <input
                type="text"
                {...register("progress")}
                onBlur={(e) => {
                  register("progress").onBlur(e);
                  setValue("progress", toSentenceCase(e.target.value), {
                    shouldValidate: true,
                  });
                }}
                placeholder="Misal: 80% / Tinggal finishing"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>

          {/* Area Upload File */}
          <div className="bg-slate-50/50 border border-dashed border-slate-300 p-5 rounded-2xl">
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Bukti Lapangan <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Upload foto atau video progres (Min. 4 file, Maks. 20 file, dan
              50MB per file).
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-300 hover:bg-slate-100 hover:border-slate-400 bg-white"
              } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                type="file"
                multiple
                accept="image/*, video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Klik atau seret file ke sini"
              />

              {isUploading ? (
                <div className="flex flex-col items-center text-emerald-600 z-0">
                  <svg
                    className="animate-spin h-8 w-8 mb-2"
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
                  <span className="text-sm font-semibold">Mengunggah...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none z-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${isDragging ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}
                  >
                    <FiPlus size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">
                    {isDragging
                      ? "Lepaskan file di sini!"
                      : "Klik atau seret file ke area ini"}
                  </span>
                </div>
              )}
            </div>

            {errors.files && (
              <p className="text-red-500 text-xs mt-2 font-medium">
                {errors.files.message}
              </p>
            )}

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
                            preload="metadata"
                            playsInline
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
                          onClick={() => handleRemoveSpecificFile(file, index)}
                          className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
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
              onClick={handleCancelClick}
              className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Laporan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
