"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { Formik, Form, Field } from "formik";
import { useThemeButton } from "@/components/theme";
import { useState } from "react";
import LoadingScreen from "@/components/loading-screen";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const themeButton = useThemeButton();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!user) return <LoadingScreen />;

  return (
    <main className="pb-20 sm:pb-0">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">My Profile</h1>

        <Formik
          initialValues={{
            name: user.name ?? "",
            bio: user.bio ?? "",
            profilePicture: null as File | null,
          }}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            try {
              setError("");

              const formData = new FormData();
              formData.append("name", values.name);
              formData.append("bio", values.bio ?? "");

              if (values.profilePicture) {
                formData.append("profilePicture", values.profilePicture);
              }

              await axios.put(
                `${process.env.NEXT_PUBLIC_API_DOMAIN}/api/user/profile`,
                formData,
                {
                  withCredentials: true,
                }
              );

              setPreview(null);
              await refreshUser();
              alert("Profile updated");
            } catch (error) {
              if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                  router.replace("/login");
                  return;
                }

                setError("Failed to update profile");
              } else {
                setError("Unexpected error");
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, setFieldValue }) => (
            <>
              {/* ================= PROFILE PICTURE ================= */}
              <div className="flex items-center gap-6 mb-8">
                <label className="relative cursor-pointer group">
                  <Image
                    src={
                      preview ||
                      user.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgsaRe2zqH_BBicvUorUseeTaE4kxPL2FmOQ&s"
                    }
                    width={96}
                    height={96}
                    className="rounded-full object-cover border"
                    alt="Profile"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className="text-white text-xs font-medium">
                      Change
                    </span>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!file) return;

                      if (preview) {
                        URL.revokeObjectURL(preview);
                      }

                      setPreview(URL.createObjectURL(file));
                      setFieldValue("profilePicture", file);
                    }}
                  />
                </label>

                <div>
                  <p className="font-medium text-lg">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>

                  {preview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (preview) {
                          URL.revokeObjectURL(preview);
                        }

                        setPreview(null);
                        setFieldValue("profilePicture", null);
                      }}
                      className="mt-1 text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Remove selected photo
                    </button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-6 text-sm">
                <p>
                  <strong>Role:</strong> {user.role}
                </p>
                <p>
                  <strong>Referral Code:</strong> {user.referralCode}
                </p>
                <p>
                  <strong>Joined:</strong>{" "}
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              {/* ================= FORM ================= */}
              <Form>
                <label className="block mb-2 font-medium">Name</label>
                <Field name="name" className="w-full border p-2 mb-4 rounded" />

                <label className="block mb-2 font-medium">Bio</label>
                <Field
                  as="textarea"
                  name="bio"
                  className="w-full border p-2 mb-4 rounded"
                />

                <div className="mt-4 space-y-1 text-sm">
                  <p>
                    <strong>Points:</strong> {user.pointBalance}
                  </p>

                  <p>
                    <strong>Coupon:</strong>{" "}
                    {user.coupon ? (
                      <>
                        <span className="font-mono px-2 py-1 rounded">
                          {user.coupon.code}
                        </span>
                        ({user.coupon.discount.toLocaleString("id-ID")})
                      </>
                    ) : (
                      "No active coupon"
                    )}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:scale-110 duration-300"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/change-password")}
                    className="border px-4 py-2 rounded cursor-pointer hover:scale-110 duration-300"
                  >
                    Change Password
                  </button>

                  {user.role === "EVENT_ORGANIZER" && (
                    <button
                      type="button"
                      onClick={() => router.push("/organizer/dashboard")}
                      className={`px-4 py-2 rounded cursor-pointer hover:scale-110 duration-300 ${themeButton}`}
                    >
                      Organizer Dashboard
                    </button>
                  )}
                </div>
              </Form>
            </>
          )}
        </Formik>
      </div>
    </main>
  );
}
