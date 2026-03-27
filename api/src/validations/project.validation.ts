import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(3, "Nama project minimal 3 karakter"),
  location: z.string().min(3, "Lokasi minimal 3 karakter"),
  startDate: z.coerce.date({
    message: "Start date harus berupa tanggal valid",
  }),
  description: z.string().optional(),
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
