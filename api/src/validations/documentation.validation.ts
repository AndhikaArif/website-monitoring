import { z } from "zod";
import {
  DocumentationSession,
  ProjectStatus,
  FileType,
} from "../generated/prisma/index.js";

const fileSchema = z.object({
  fileUrl: z.string().url("File URL tidak valid"),
  cloudinaryId: z.string().min(1, "Cloudinary ID wajib ada"),
  fileType: z.enum(FileType),
});

export const createDocSchema = z.object({
  projectId: z.string().uuid("Project ID tidak valid"),

  reportDate: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Format tanggal harus DD-MM-YYYY"),

  session: z.enum(DocumentationSession),

  workArea: z.string().trim().min(1, "Area kerja wajib diisi"),

  task: z.string().trim().min(1, "Pekerjaan wajib diisi"),

  target: z.string().trim().optional(),
  progress: z.string().trim().optional(),

  files: z
    .array(fileSchema)
    .min(1, "Minimal harus mengunggah 1 foto atau video"),
});

export type CreateDocDTO = z.infer<typeof createDocSchema>;

export const updateDocSchema = z.object({
  projectId: z.string().uuid("Project ID tidak valid"),

  reportDate: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Format tanggal harus DD-MM-YYYY")
    .optional(),

  session: z.enum(DocumentationSession).optional(),

  workArea: z.string().trim().optional(),
  task: z.string().trim().optional(),
  target: z.string().trim().optional(),
  progress: z.string().trim().optional(),

  files: z.array(fileSchema).optional(),
});

export type UpdateDocDTO = z.infer<typeof updateDocSchema>;

export const documentationIdParam = z.object({
  id: z.string().uuid("Dokumentasi ID tidak valid"),
});

export type DocumentationIdParamDTO = z.infer<typeof documentationIdParam>;

export const paginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(10),
  status: z.enum(ProjectStatus).optional(),
  sortBy: z.enum(["reportDate", "createdAt", "session"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type PaginationQueryDTO = z.infer<typeof paginationQuery>;

export const deleteFileSchema = z.object({
  cloudinaryId: z.string({ error: "Cloudinary ID wajib diisi" }),
});

export type DeleteFileDTO = z.infer<typeof deleteFileSchema>;
