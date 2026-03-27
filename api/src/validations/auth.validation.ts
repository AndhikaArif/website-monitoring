import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const createMandorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Wrong Email format"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export type CreateMandorDTO = z.infer<typeof createMandorSchema>;
