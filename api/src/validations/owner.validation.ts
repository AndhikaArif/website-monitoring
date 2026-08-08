import { z } from "zod";

export const createOwnerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid Email format"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export type CreateOwnerDTO = z.infer<typeof createOwnerSchema>;

export const updateOwnerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.email("Invalid Email format").optional(),
  password: z.string().min(5, "Password must be at least 5 characters").optional(),
});

export type UpdateOwnerDTO = z.infer<typeof updateOwnerSchema>;

export const ownerParamsSchema = z.object({
  id: z.string().uuid("Invalid ID"),
});

export type OwnerParamsDTO = z.infer<typeof ownerParamsSchema>;

export const listOwnerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  mandorId: z.string().uuid("Invalid ID").optional(),
});

export type ListOwnerQueryDTO = z.infer<typeof listOwnerQuerySchema>;
