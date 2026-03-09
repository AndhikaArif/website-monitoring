"use client";

import axios, { AxiosError } from "axios";
import { Formik, Form } from "formik";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import PasswordField from "@/components/form/passwordField";
import { useThemeClass } from "@/components/theme";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const themeClass = useThemeClass();

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Change Password</h1>

      <Formik
        initialValues={{
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        }}
        onSubmit={async (values, { setSubmitting }) => {
          if (values.newPassword !== values.confirmPassword) {
            alert("Password confirmation does not match");
            setSubmitting(false);
            return;
          }

          try {
            await axios.put(
              `${process.env.NEXT_PUBLIC_API_DOMAIN}/api/user/change-password`,
              {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
              },

              { withCredentials: true },
            );

            alert("Password changed successfully. Please login again");
            await logout();
            router.replace("/login");
          } catch (err) {
            const error = err as AxiosError<{ message: string }>;

            alert(error.response?.data?.message || "Failed to change password");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <PasswordField
              name="oldPassword"
              label="Old Password"
              placeholder="Old Password"
              className={themeClass}
            />

            <PasswordField
              name="newPassword"
              label="New Password"
              placeholder="New Password"
              className={themeClass}
            />

            <PasswordField
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm Password"
              className={themeClass}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:scale-110 duration-300 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Change Password"}
            </button>
          </Form>
        )}
      </Formik>
    </main>
  );
}
