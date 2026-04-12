import { z } from "zod";
import { ProjectStatus } from "../generated/prisma/index.js";

export const createProjectSchema = z.object({
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
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;

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

  status: z.enum(ProjectStatus).optional(),
});

export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;

export const projectIdParam = z.object({
  projectId: z.string().uuid("Project ID tidak valid"),
});

export type ProjectIdParamDTO = z.infer<typeof projectIdParam>;

export const assignHeadWorkerSchema = z.object({
  headWorkerIds: z
    .array(z.string().uuid("Format ID tidak valid"))
    .min(1, "Minimal pilih 1 head worker"),
});

export type AssignHeadWorkerDTO = z.infer<typeof assignHeadWorkerSchema>;

export const paginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.enum(ProjectStatus).optional(),
  sortBy: z
    .enum(["createdAt", "projectName", "startDate", "status"])
    .optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type PaginationQueryDTO = z.infer<typeof paginationQuery>;
