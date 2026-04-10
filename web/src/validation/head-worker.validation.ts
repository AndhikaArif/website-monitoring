import { z } from "zod";

export const createHeadWorkerSchema = z.object({
  name: z
    .string({ error: "Name wajib diisi" })
    .min(3, "Name minimal 3 karakter"),
  username: z
    .string({ error: "Username wajib diisi" })
    .min(3, "Username minimal 3 karakter"),
  email: z.email("Format email salah").min(1, "Email wajib diisi"),
  password: z
    .string({ error: "Password wajib diisi" })
    .min(5, "Password minimal 5 karakter"),
});

export const updateHeadWorkerSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(3, "Minimal 3 karakter"),
  username: z
    .string({ error: "Username wajib diisi" })
    .min(3, "Minimal 3 karakter"),
  email: z.email("Format email salah").min(1, "Email wajib diisi"),
  // Password boleh kosong, tapi kalau diisi minimal 5 karakter
  password: z
    .string()
    .min(5, "Password minimal 5 karakter")
    .optional()
    .or(z.literal("")),
});
