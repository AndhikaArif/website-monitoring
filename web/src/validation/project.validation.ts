import { z } from "zod";

export const createProjectSchema = z.object({
  projectName: z
    .string({ error: "Nama proyek wajib diisi" })
    .min(3, "Nama proyek minimal 3 karakter"),
  location: z
    .string({ error: "Lokasi wajib diisi" })
    .min(3, "Lokasi minimal 3 karakter"),
  description: z.string().optional().nullable().or(z.literal("")),
});

const ProjectStatusEnum = ["AKTIF", "LIBUR", "SELESAI"] as const;

export const updateProjectSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, "Nama project minimal 3 karakter")
    .max(100, "Nama project maksimal 100 karakter"),

  location: z
    .string()
    .trim()
    .min(3, "Lokasi minimal 3 karakter")
    .max(255, "Lokasi maksimal 255 karakter"),

  description: z.string().trim().optional(),

  // Tambahkan validasi status untuk FE
  status: z.enum(ProjectStatusEnum).optional(),
});
