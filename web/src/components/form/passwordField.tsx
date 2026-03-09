"use client";

import { Field, ErrorMessage } from "formik";
import { useState } from "react";

interface PasswordFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  className?: string;
}

export default function PasswordField({
  name,
  label,
  placeholder = "Password",
  className = "",
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-medium">
        {label}
      </label>

      <div className="relative">
        <Field
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className={`border p-2 rounded w-full ${className}`}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer"
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-sm"
      />
    </div>
  );
}
