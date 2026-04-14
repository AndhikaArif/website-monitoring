"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";

import { loginSchemaFront } from "@/validation/login.validation";
import { useAuth } from "@/context/auth-context";
import LoadingScreen from "@/components/loading-screen";

export default function LoginPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const { user, loading, refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const paths = {
        ADMIN: "/admin/mandor",
        MANDOR: "/mandor/head-worker",
        HEAD_WORKER: "/head-worker",
      };
      router.replace(paths[user.role as keyof typeof paths] || "/login");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-105">
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl shadow-lg shadow-purple-200 mb-4 text-white">
            <span className="text-3xl font-bold tracking-tighter">PP</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Sistem Monitoring
          </h1>
          <p className="text-gray-500 font-medium">Pojok Property</p>
        </div>

        <div className="bg-white rounded-4xl shadow-sm border border-gray-100 p-8 md:p-10">
          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={toFormikValidationSchema(loginSchemaFront)}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
              setGlobalError(null);
              try {
                await axios.post(
                  `${process.env.NEXT_PUBLIC_API_DOMAIN}/api/auth/login`,
                  values,
                  { withCredentials: true },
                );
                await refreshUser();
              } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                  const status = err.response?.status;

                  if (status === 401) {
                    setErrors({
                      username: "Username / password tidak valid",
                      password: " ",
                    });
                  } else {
                    // Ambil pesan dari server jika ada, atau gunakan default
                    const errorMessage =
                      err.response?.data?.message || "Koneksi ke server gagal.";
                    setGlobalError(errorMessage);
                  }
                } else {
                  setGlobalError(
                    "Terjadi kesalahan sistem yang tidak terduga.",
                  );
                  console.error("Non-Axios Error:", err);
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-5">
                {globalError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-pulse">
                    <FiAlertCircle className="shrink-0" /> {globalError}
                  </div>
                )}

                {/* USERNAME */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                      <FiUser />
                    </div>
                    <Field
                      name="username"
                      placeholder="Masukkan username anda"
                      className={`w-full bg-gray-50 rounded-2xl border px-11 py-3.5 text-sm transition-all focus:outline-none focus:ring-4 text-black ${
                        errors.username && touched.username
                          ? "border-red-200 focus:ring-red-50"
                          : "border-gray-100 focus:border-purple-500 focus:ring-purple-50"
                      }`}
                    />
                  </div>
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-[11px] text-red-500 font-medium ml-1"
                  />
                </div>

                {/* PASSWORD */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                      <FiLock />
                    </div>
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className={`w-full bg-gray-50 rounded-2xl border px-11 py-3.5 text-sm transition-all focus:outline-none focus:ring-4 text-black ${
                        errors.password && touched.password
                          ? "border-red-200 focus:ring-red-50"
                          : "border-gray-100 focus:border-purple-500 focus:ring-purple-50"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-[11px] text-red-500 font-medium ml-1"
                  />
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:shadow-none mt-4 cursor-pointer border-none"
                >
                  {isSubmitting ? "Memproses..." : "Login"}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        {/* FOOTER */}
        <p className="mt-8 text-center text-sm text-gray-400 font-medium">
          &copy; {new Date().getFullYear()} PT. Pojok Property <br />
          <span className="text-[10px] uppercase tracking-tighter opacity-50">
            Monitoring App v1.0
          </span>
        </p>
      </div>
    </main>
  );
}
