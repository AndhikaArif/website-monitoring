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
    .string({ error: "Nama proyek wajib diisi" })
    .trim()
    .min(3, "Nama project minimal 3 karakter")
    .max(100, "Nama project maksimal 100 karakter"),

  location: z
    .string({ error: "Lokasi wajib diisi" })
    .trim()
    .min(3, "Lokasi minimal 3 karakter")
    .max(255, "Lokasi maksimal 255 karakter"),

  description: z.string().trim().optional(),

  // Tambahkan validasi status untuk FE
  status: z.enum(ProjectStatusEnum).optional(),
});

export const adminTransferMandorSchema = z.object({
  newMandorId: z
    .string({ error: "Silakan pilih Mandor pengganti terlebih dahulu" })
    .min(1, "Silakan pilih Mandor pengganti terlebih dahulu"),

  keepKepalaTukang: z.boolean(),
});

export type AdminTransferMandorFormValues = z.infer<
  typeof adminTransferMandorSchema
>;

export const adminUpdateProjectStatusSchema = z.object({
  status: z.enum(ProjectStatusEnum),
});

export type AdminUpdateProjectStatusDTO = z.infer<
  typeof adminUpdateProjectStatusSchema
>;

export const scheduleHolidaySchema = z.object({
  startDate: z
    .string({ error: "Tanggal mulai wajib diisi" })
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Format tanggal mulai harus DD-MM-YYYY"),
  endDate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/, "Format tanggal selesai harus DD-MM-YYYY")
      .optional(),
  ),
});

export type ScheduleHolidayFormValues = z.infer<typeof scheduleHolidaySchema>;
