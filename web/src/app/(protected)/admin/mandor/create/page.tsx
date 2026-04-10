"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiChevronLeft, FiPlusCircle } from "react-icons/fi";

import { createMandorSchema } from "@/validation/mandor.validation";
import PasswordField from "@/components/form/passwordField";

export default function CreateMandorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/admin/mandor")}
          className="flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-6 group cursor-pointer bg-transparent border-none"
        >
          <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Daftar
        </button>

        {/* CARD CONTAINER */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* HEADER CARD */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiPlusCircle /> Tambah Mandor Baru
            </h1>
            <p className="text-blue-100 mt-2 opacity-90">
              Daftarkan mandor baru untuk mengelola pengawasan lapangan.
            </p>
          </div>

          <div className="p-8">
            <Formik
              initialValues={{
                name: "",
                username: "",
                email: "",
                password: "",
              }}
              validationSchema={toFormikValidationSchema(createMandorSchema)}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                  await axios.post(
                    `${process.env.NEXT_PUBLIC_API_DOMAIN}/api/auth/mandor`,
                    values,
                    { withCredentials: true },
                  );
                  toast.success("Mandor berhasil dibuat! 🚀");
                  router.push("/admin/mandor");
                } catch (err: unknown) {
                  if (axios.isAxiosError(err)) {
                    const status = err.response?.status;
                    const serverMessage =
                      err.response?.data?.message || "Terjadi kesalahan";

                    if (status === 400) {
                      const msg = serverMessage.toLowerCase();
                      setErrors({
                        email: msg.includes("email")
                          ? "Email sudah terdaftar"
                          : undefined,
                        username: msg.includes("username")
                          ? "Username sudah digunakan"
                          : undefined,
                      });
                      toast.error("Gagal: Email/Username sudah ada");
                    } else {
                      toast.error(serverMessage);
                    }
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  {/* FIELD NAMA */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FiUser className="mr-2 text-blue-500" /> Nama Lengkap
                    </label>
                    <Field
                      name="name"
                      placeholder="Masukkan nama lengkap mandor"
                      className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                        errors.name && touched.name
                          ? "border-red-300 focus:ring-red-50"
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-50"
                      }`}
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500 text-xs mt-2 ml-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FIELD USERNAME */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <span className="mr-2 text-blue-500 font-bold">@</span>{" "}
                        Username
                      </label>
                      <Field
                        name="username"
                        placeholder="username123"
                        className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                          errors.username && touched.username
                            ? "border-red-300 focus:ring-red-50"
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-50"
                        }`}
                      />
                      <ErrorMessage
                        name="username"
                        component="div"
                        className="text-red-500 text-xs mt-2 ml-1"
                      />
                    </div>

                    {/* FIELD EMAIL */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <FiMail className="mr-2 text-blue-500" /> Email
                      </label>
                      <Field
                        name="email"
                        type="email"
                        placeholder="email@perusahaan.com"
                        className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
                          errors.email && touched.email
                            ? "border-red-300 focus:ring-red-50"
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-50"
                        }`}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-red-500 text-xs mt-2 ml-1"
                      />
                    </div>
                  </div>

                  {/* FIELD PASSWORD */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <PasswordField
                      name="password"
                      label="Password Akun"
                      role="ADMIN"
                      placeholder="Buat password mandor"
                      className="py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-50"
                    />
                    <p className="text-[11px] text-gray-500 mt-2 flex items-start leading-tight">
                      <span className="mr-1 mt-0.5">•</span> Pastikan password
                      kuat (kombinasi huruf dan angka).
                    </p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => router.push("/admin/mandor")}
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
                          : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-200"
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Daftarkan Mandor"
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
