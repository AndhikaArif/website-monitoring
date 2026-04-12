"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import toast from "react-hot-toast";
import axios from "axios";
import { FiUser, FiMail, FiChevronLeft, FiSave } from "react-icons/fi";

import { updateHeadWorkerSchema } from "@/validation/head-worker.validation";
import {
  getHeadWorkerById,
  updateHeadWorker,
} from "@/services/head-worker.service";
import { UpdateHeadWorkerPayload } from "@/types/head-worker.type";
import PasswordField from "@/components/form/passwordField";

export default function EditHeadWorkerPage() {
  const router = useRouter();
  const { id } = useParams();
  const [initialData, setInitialData] =
    useState<UpdateHeadWorkerPayload | null>(null);

  useEffect(() => {
    const loadHeadWorker = async () => {
      try {
        const res = await getHeadWorkerById(id as string);
        setInitialData(res.data);
      } catch {
        toast.error("Gagal mengambil data mandor");
        router.push("/mandor/head-worker");
      }
    };
    loadHeadWorker();
  }, [id, router]);

  if (!initialData) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-solid border-gray-200"></div>
        <p className="text-gray-500 font-medium animate-pulse">
          Mengambil data head worker...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/mandor/head-worker")}
          className="flex items-center text-gray-500 hover:text-purple-600 transition-colors mb-6 group cursor-pointer"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar
        </button>

        {/* CARD CONTAINER */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* HEADER DENGAN GRADIENT UNGU */}
          <div className="bg-linear-to-r from-purple-600 to-purple-700 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold">Edit Profil Head Worker</h1>
            <p className="text-purple-100 mt-2 opacity-90">
              Perbarui informasi akun dan kredensial akses head worker.
            </p>
          </div>

          <div className="p-8">
            <Formik
              initialValues={{
                name: initialData.name || "",
                username: initialData.username || "",
                email: initialData.email || "",
                password: "",
              }}
              validationSchema={toFormikValidationSchema(
                updateHeadWorkerSchema,
              )}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                  const payload: UpdateHeadWorkerPayload = {
                    name: values.name,
                    username: values.username,
                    email: values.email,
                  };

                  if (values.password && values.password.trim() !== "") {
                    payload.password = values.password;
                  }

                  await updateHeadWorker(id as string, payload);
                  toast.success("Data head worker berhasil diperbarui! ✨");
                  router.push("/mandor/head-worker");
                } catch (err: unknown) {
                  if (axios.isAxiosError(err)) {
                    const serverMessage =
                      err.response?.data?.message || "Terjadi kesalahan";
                    toast.error(serverMessage);
                    if (err.response?.status === 400) {
                      const msg = serverMessage.toLowerCase();
                      setErrors({
                        email: msg.includes("email")
                          ? "Email sudah digunakan"
                          : undefined,
                        username: msg.includes("username")
                          ? "Username sudah digunakan"
                          : undefined,
                      });
                    }
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  {/* NAMA LENGKAP */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FiUser className="mr-2 text-purple-500" /> Nama Lengkap
                    </label>
                    <Field
                      name="name"
                      placeholder="Masukkan nama lengkap"
                      className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                        errors.name && touched.name
                          ? "border-red-300 focus:ring-red-50"
                          : "border-gray-200 focus:border-purple-500 focus:ring-purple-50"
                      }`}
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500 text-xs mt-2 ml-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* USERNAME */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <span className="mr-2 text-purple-500 font-bold">
                          @
                        </span>{" "}
                        Username
                      </label>
                      <Field
                        name="username"
                        placeholder="username_baru"
                        className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                          errors.username && touched.username
                            ? "border-red-300 focus:ring-red-50"
                            : "border-gray-200 focus:border-purple-500 focus:ring-purple-50"
                        }`}
                      />
                      <ErrorMessage
                        name="username"
                        component="div"
                        className="text-red-500 text-xs mt-2 ml-1"
                      />
                    </div>

                    {/* EMAIL */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <FiMail className="mr-2 text-purple-500" /> Email
                      </label>
                      <Field
                        name="email"
                        type="email"
                        placeholder="mandor@perusahaan.com"
                        className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                          errors.email && touched.email
                            ? "border-red-300 focus:ring-red-50"
                            : "border-gray-200 focus:border-purple-500 focus:ring-purple-50"
                        }`}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-red-500 text-xs mt-2 ml-1"
                      />
                    </div>
                  </div>

                  {/* PASSWORD DENGAN TEMA UNGU */}
                  <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                    <PasswordField
                      name="password"
                      label="Password Baru"
                      role="MANDOR"
                      placeholder="Password"
                      className="py-3 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-50"
                    />
                    <p className="text-[11px] text-purple-600 mt-2 italic flex items-start leading-tight">
                      <span className="mr-1 mt-0.5">•</span> Biarkan kosong jika
                      tidak ingin mengubah password lama.
                    </p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => router.push("/mandor/head-worker")}
                      className="flex-1 py-3 px-6 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-2 py-3 px-6 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                        isSubmitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-purple-200"
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FiSave className="w-5 h-5" />
                          Simpan Perubahan
                        </>
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
