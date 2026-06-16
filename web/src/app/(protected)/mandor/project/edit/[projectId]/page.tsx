"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiMapPin,
  FiChevronLeft,
  FiEdit3,
  FiAlignLeft,
  FiLoader,
} from "react-icons/fi";

import { updateProjectSchema } from "@/validation/project.validation";
import { getProjectDetail, updateProject } from "@/services/project.service";

export default function EditProjectPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };

  const [initialData, setInitialData] = useState({
    projectName: "",
    location: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buat flag untuk melacak status mount komponen
    let isMounted = true;

    const fetchDetail = async () => {
      try {
        const res = await getProjectDetail(projectId);
        if (!isMounted) return;

        const data = res.data;

        // BLOKIR AKSES JIKA STATUS SUDAH SELESAI
        if (data.status === "SELESAI") {
          toast.error("Proyek yang sudah SELESAI tidak dapat diedit lagi.", {
            id: "project-completed", // Mencegah toast ganda
          });
          // Tendang kembali ke halaman detail proyek
          router.replace(`/mandor/project/${projectId}`);
          return; // Hentikan eksekusi kode di bawahnya
        }

        // Hanya mengambil data field teks saja
        setInitialData({
          projectName: data.projectName || "",
          location: data.location || "",
          description: data.description || "",
        });
      } catch (error: unknown) {
        if (!isMounted) return;

        if (axios.isAxiosError(error)) {
          if (!error.response) {
            toast.error("Gagal terhubung ke server.", { id: "network-error" });
            router.push("/mandor/project");
            return;
          }

          const status = error.response.status;
          const message = error.response.data?.message || "Gagal memuat data.";

          if (status === 401) {
            toast.error("Sesi telah berakhir. Silakan login kembali.", {
              id: "auth-error",
            });
            router.replace("/login");
          } else if (status === 403) {
            toast.error(`Akses Ditolak: ${message}`, {
              id: "unauthorized-route",
            });
            router.replace("/mandor/project");
          } else if (status === 404 || status === 400) {
            toast.error("Proyek tidak ditemukan atau URL tidak valid.", {
              id: "not-found-error",
            });
            router.replace("/mandor/project");
          } else if (status === 500) {
            toast.error("Server sedang bermasalah. Silakan coba lagi.", {
              id: "server-error",
            });
            router.replace("/mandor/project");
          } else {
            toast.error(message, { id: "general-error" });
            router.replace("/mandor/project");
          }
        } else {
          toast.error("Terjadi kesalahan sistem.", { id: "unknown-error" });
          router.replace("/mandor/project");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchDetail();

    // Cleanup function: ubah flag saat komponen di-unmount oleh React
    return () => {
      isMounted = false;
    };
  }, [projectId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6 group cursor-pointer bg-transparent border-none"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Batal & Kembali
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-purple-600 to-purple-700 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiEdit3 /> Edit Proyek
            </h1>
            <p className="text-purple-100 mt-2 opacity-90">
              Perbarui informasi detail proyek pembangunan Anda.
            </p>
          </div>

          <div className="p-8">
            <Formik
              enableReinitialize
              initialValues={initialData}
              validationSchema={toFormikValidationSchema(updateProjectSchema)}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  const payload = {
                    ...values,
                    description: values.description || undefined,
                  };

                  await updateProject(projectId, payload);
                  toast.success("Perubahan berhasil disimpan!");
                  router.push(`/mandor/project/${projectId}`);
                } catch (error: unknown) {
                  if (axios.isAxiosError(error)) {
                    toast.error(
                      error.response?.data?.message || "Gagal update",
                    );
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  {/* FIELD NAMA PROYEK */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FiBriefcase className="mr-2 text-purple-500" /> Nama
                      Proyek
                    </label>
                    <Field
                      name="projectName"
                      className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                        errors.projectName && touched.projectName
                          ? "border-red-300 focus:ring-red-50"
                          : "border-gray-200 focus:border-purple-500 focus:ring-purple-50"
                      }`}
                    />
                    <ErrorMessage
                      name="projectName"
                      component="div"
                      className="text-red-500 text-xs mt-2 ml-1"
                    />
                  </div>

                  {/* FIELD LOKASI */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FiMapPin className="mr-2 text-purple-500" /> Lokasi
                      Proyek
                    </label>
                    <Field
                      name="location"
                      className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                        errors.location && touched.location
                          ? "border-red-300 focus:ring-red-50"
                          : "border-gray-200 focus:border-purple-500 focus:ring-purple-50"
                      }`}
                    />
                    <ErrorMessage
                      name="location"
                      component="div"
                      className="text-red-500 text-xs mt-2 ml-1"
                    />
                  </div>

                  {/* FIELD DESKRIPSI */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FiAlignLeft className="mr-2 text-purple-500" /> Deskripsi
                      (Opsional)
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      rows={4}
                      className="w-full px-4 py-3 text-black rounded-xl border border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/mandor/project/${projectId}`)
                      }
                      className="flex-1 py-3 px-6 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 cursor-pointer bg-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-2 py-3 px-6 rounded-xl text-white font-bold transition-all shadow-lg cursor-pointer border-none ${
                        isSubmitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-purple-200"
                      }`}
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
