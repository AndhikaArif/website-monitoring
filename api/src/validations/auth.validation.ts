import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const createMandorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid Email format"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export type CreateMandorDTO = z.infer<typeof createMandorSchema>;

export const updateMandorSchema = z.object({
  name: z.string().min(3).optional(),
  username: z.string().min(3).optional(),
  email: z.email("Invalid Email format").optional(),
  password: z.string().min(5).optional(),
});

export type UpdateMandorDTO = z.infer<typeof updateMandorSchema>;

export const mandorParamsSchema = z.object({
  id: z.string().uuid("Invalid ID"),
});

export type MandorParamsDTO = z.infer<typeof mandorParamsSchema>;

export const listMandorQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type ListMandorQueryDTO = z.infer<typeof listMandorQuerySchema>;
