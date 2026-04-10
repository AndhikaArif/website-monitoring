import { z } from "zod";

export const resetPasswordConfirmSchema = z
  .object({
    newPassword: z.string().min(5, "Password must be at least 5 characters"),
    confirmPassword: z
      .string()
      .min(5, "Password must be at least 5 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"],
  });
