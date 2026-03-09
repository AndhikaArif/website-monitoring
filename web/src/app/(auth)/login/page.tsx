"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { loginSchemaFront } from "@/app/validation/login.validation";
import { useAuth } from "@/context/auth-context";
import LoadingScreen from "@/components/loading-screen";

export default function LoginPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const { user, loading, refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg px-8 py-10">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">
            Sistem Monitoring Proyek
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            PT. Pojok Property – Villa Kost 3
          </p>
        </div>

        <Formik
          initialValues={{
            username: "",
            password: "",
          }}
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
              router.replace("/");
            } catch (err: unknown) {
              if (axios.isAxiosError(err)) {
                if (!err.response) {
                  setGlobalError(
                    "Server sedang bermasalah. Silakan coba lagi.",
                  );
                  return;
                }

                const status = err.response.status;

                if (status === 401) {
                  setErrors({
                    username: "Username atau password salah",
                    password: "Username atau password salah",
                  });
                  return;
                }

                if (status >= 500) {
                  setGlobalError(
                    "Layanan sedang tidak tersedia. Silakan coba lagi nanti.",
                  );
                  return;
                }
              }

              setGlobalError("Terjadi kesalahan. Silakan coba lagi.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-5">
              {/* GLOBAL ERROR */}
              {globalError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                  {globalError}
                </div>
              )}

              {/* USERNAME */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Field
                  name="username"
                  type="text"
                  placeholder="Masukkan username"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="text-xs text-red-500 mt-1"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>

                <div className="relative">
                  <Field
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-xs text-red-500 mt-1"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Memproses..." : "Login"}
              </button>
            </Form>
          )}
        </Formik>

        {/* FOOTER */}
        <div className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} PT. Pojok Property
        </div>
      </div>
    </main>
  );
}
