"use client";

import { Field, ErrorMessage, useField } from "formik";
import { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

interface PasswordFieldProps {
  name: string;
  label: string;
  role: "ADMIN" | "MANDOR"; // Gunakan role sebagai penentu warna
  placeholder?: string;
  className?: string;
  helperText?: string;
}

export default function PasswordField({
  name,
  label,
  role,
  placeholder = "Password",
  className = "",
  helperText,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [field, meta] = useField(name);

  const hasError = meta.touched && meta.error;

  // Mapping warna sederhana berdasarkan role
  const isMandor = role === "MANDOR";

  const theme = {
    icon: isMandor ? "text-purple-500" : "text-blue-500",
    border: isMandor ? "focus:border-purple-500" : "focus:border-blue-500",
    ring: isMandor ? "focus:ring-purple-50" : "focus:ring-blue-50",
    hover: isMandor ? "hover:text-purple-600" : "hover:text-blue-600",
    helper: isMandor ? "text-purple-600" : "text-blue-600",
  };

  return (
    <div className="flex flex-col">
      <label
        htmlFor={name}
        className="flex items-center text-sm font-semibold text-gray-700 mb-2"
      >
        <FiLock className={`mr-2 ${theme.icon}`} /> {label}
      </label>

      <div className="relative">
        <Field
          {...field}
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className={`w-full px-4 py-3 text-black rounded-xl border outline-none transition-all focus:ring-4 ${
            hasError
              ? "border-red-300 focus:ring-red-50"
              : `border-gray-200 ${theme.border} ${theme.ring}`
          } ${className}`}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 ${theme.hover} transition-colors cursor-pointer`}
        >
          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>

      {helperText && (
        <p
          className={`text-[11px] ${theme.helper} mt-2 italic flex items-start leading-tight`}
        >
          <span className="mr-1 mt-0.5">•</span> {helperText}
        </p>
      )}

      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-[11px] mt-1 font-medium ml-1"
      />
    </div>
  );
}
