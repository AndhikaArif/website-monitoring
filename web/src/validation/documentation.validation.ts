import { z } from "zod";

// Skema untuk satu file dokumentasi
const fileSchema = z.object({
  fileUrl: z.string().url("URL file tidak valid"),
  cloudinaryId: z.string().min(1, "Cloudinary ID wajib ada"),
  fileType: z.enum(["PHOTO", "VIDEO"]),
});

// Skema untuk Create Documentation
export const createDocSchema = z.object({
  projectId: z.string().min(1, "Project ID tidak boleh kosong"),
  reportDate: z.string().min(1, "Tanggal wajib diisi"),
  session: z.enum(["PAGI", "SORE"]),
  workArea: z.string().min(3, "Area kerja minimal 3 karakter"),
  task: z.string().min(3, "Pekerjaan minimal 3 karakter"),
  target: z.string().optional(),
  progress: z.string().optional(),
  files: z
    .array(fileSchema)
    .min(1, "Minimal wajib mengunggah 1 foto/video dokumentasi"),
});

// Skema untuk Update Documentation (Semua field jadi opsional, kecuali validasi isinya jika diisi)
export const updateDocSchema = createDocSchema.partial();

// Infer tipe dari Zod untuk mencocokkan dengan payload (opsional, tapi bagus untuk cross-check)
export type CreateDocFormValues = z.infer<typeof createDocSchema>;
export type UpdateDocFormValues = z.infer<typeof updateDocSchema>;
