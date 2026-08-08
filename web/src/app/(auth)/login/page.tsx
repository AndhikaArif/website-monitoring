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
        MANDOR: "/mandor/project",
        KEPALA_TUKANG: "/head-worker",
        OWNER: "/owner",
      };
      router.replace(paths[user.role as keyof typeof paths] || "/login");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (user) return null;

  return (
    // 1. MAIN: Di HP background putih polos, di Desktop pakai gradien abu-abu
    <main className="min-h-screen flex items-center justify-center bg-white sm:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] sm:from-slate-100 sm:via-slate-50 sm:to-slate-100 sm:p-8 font-sans">
      
      {/* 2. WRAPPER: Di HP tingginya full layar (min-h-screen), di Desktop otomatis */}
      <div className="w-full sm:max-w-lg relative min-h-screen sm:min-h-0 flex flex-col">
        
        <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-300 rounded-[3rem] blur-xl opacity-50 hidden sm:block"></div>

        {/* 3. CARD: Di HP layar penuh (flex-1), tanpa lengkungan, tanpa shadow */}
        <div className="relative flex-1 sm:flex-none flex flex-col justify-center bg-white sm:bg-white/90 sm:backdrop-blur-sm sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-slate-200/60 sm:border sm:border-white p-6 sm:p-12 pt-12 sm:pt-12">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-3xl shadow-lg shadow-slate-400/30 mb-6 text-white transform transition hover:scale-105">
              <span className="text-4xl font-black tracking-tighter">PP</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Pojok Property
            </h1>
            <p className="text-slate-500 font-medium tracking-wide">
              Sistem Informasi Monitoring Progress Pekerjaan
            </p>
          </div>

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
                      username: " ",
                      password: "Username / password tidak valid",
                    });
                  } else if (status === 500) {
                    setGlobalError(
                      "Server atau database sedang mengalami gangguan. Silakan coba beberapa saat lagi.",
                    );
                  } else {
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
              <Form className="space-y-6">
                {globalError && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm animate-pulse">
                    <FiAlertCircle className="shrink-0 w-5 h-5" /> 
                    <span className="font-medium">{globalError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                      <FiUser className="w-5 h-5" />
                    </div>
                    <Field
                      name="username"
                      placeholder="Masukkan username anda"
                      className={`w-full bg-slate-50/50 rounded-2xl border px-12 py-4 text-[15px] transition-all focus:outline-none focus:ring-4 text-slate-900 ${
                        errors.username && touched.username
                          ? "border-red-200 focus:ring-red-50 bg-red-50/30"
                          : "border-slate-200 focus:border-slate-900 focus:ring-slate-900/10 focus:bg-white"
                      }`}
                    />
                  </div>
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-[11px] text-red-500 font-bold ml-2 mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                      <FiLock className="w-5 h-5" />
                    </div>
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`w-full bg-slate-50/50 rounded-2xl border px-12 py-4 text-[15px] transition-all focus:outline-none focus:ring-4 text-slate-900 ${
                        errors.password && touched.password
                          ? "border-red-200 focus:ring-red-50 bg-red-50/30"
                          : "border-slate-200 focus:border-slate-900 focus:ring-slate-900/10 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent rounded-lg hover:bg-slate-100"
                    >
                      {showPassword ? (
                        <FiEyeOff size={20} />
                      ) : (
                        <FiEye size={20} />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-[11px] text-red-500 font-bold ml-2 mt-1"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white py-4.5 rounded-2xl font-bold text-[15px] shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:shadow-none cursor-pointer border-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses...
                      </span>
                    ) : (
                      "Masuk ke Sistem"
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* 4. FOOTER: Di HP terdorong otomatis ke dasar layar berkat mt-auto */}
        <div className="mt-auto sm:mt-8 pb-8 sm:pb-0 text-center text-sm text-slate-400 sm:text-slate-500 font-medium relative z-10">
          &copy; {new Date().getFullYear()} PT. Pojok Property <br />
          <span className="text-[11px] font-bold tracking-widest uppercase opacity-40 mt-1 block">
            Internal Secure Access
          </span>
        </div>
      </div>
    </main>
  );
}