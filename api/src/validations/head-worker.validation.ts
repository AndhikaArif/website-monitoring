import { z } from "zod";

export const createHeadWorkerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid Email format"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export type CreateHeadWorkerDTO = z.infer<typeof createHeadWorkerSchema>;

export const updateHeadWorkerSchema = z.object({
  name: z.string().min(3).optional(),
  username: z.string().min(3).optional(),
  email: z.email("Invalid Email format").optional(),
  password: z.string().min(5).optional(),
});

export type UpdateHeadWorkerDTO = z.infer<typeof updateHeadWorkerSchema>;

export const headWorkerParamsSchema = z.object({
  id: z.string().uuid("Invalid ID"),
});

export type HeadWorkerParamsDTO = z.infer<typeof headWorkerParamsSchema>;

export const listHeadWorkerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type ListHeadWorkerQueryDTO = z.infer<typeof listHeadWorkerQuerySchema>;
