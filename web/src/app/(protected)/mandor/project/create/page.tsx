"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiMapPin,
  FiChevronLeft,
  FiPlusCircle,
  FiAlignLeft,
} from "react-icons/fi";

import { createProjectSchema } from "@/validation/project.validation";
import { createProject } from "@/services/project.service";

export default function CreateProjectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/mandor/project")}
          className="flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6 group cursor-pointer bg-transparent border-none"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Proyek
        </button>

        {/* CARD CONTAINER */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* HEADER CARD */}
          <div className="bg-linear-to-r from-purple-600 to-purple-700 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiPlusCircle /> Buat Proyek Baru
            </h1>
            <p className="text-purple-100 mt-2 opacity-90">
              Kelola dan pantau progress pembangunan properti baru Anda.
            </p>
          </div>

          <div className="p-8">
            <Formik
              initialValues={{
                projectName: "",
                location: "",
                description: "",
              }}
              validationSchema={toFormikValidationSchema(createProjectSchema)}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  // Bersihkan string kosong agar menjadi undefined (opsional tergantung API)
                  const payload = {
                    ...values,
                    description: values.description || undefined,
                  };

                  const res = await createProject(payload);
                  toast.success("Proyek berhasil dibuat! 🏗️");
                  router.push(`/mandor/project/${res.data.id}`);
                } catch (err: unknown) {
                  if (axios.isAxiosError(err)) {
                    toast.error(
                      err.response?.data?.message || "Terjadi kesalahan sistem",
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
                      placeholder="Contoh: Pembangunan Villa Kost 3"
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
                      placeholder="Masukkan lokasi pembangunan"
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
                      placeholder="Tambahkan catatan atau spesifikasi proyek..."
                      rows={4}
                      className="w-full px-4 py-3 text-black rounded-xl border border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all"
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="flex-1 py-3 px-6 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 cursor-pointer bg-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-2 py-3 px-6 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer border-none ${
                        isSubmitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-purple-200"
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Buat Proyek"
                      )}
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
