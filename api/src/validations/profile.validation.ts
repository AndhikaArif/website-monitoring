import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .optional(),

  phoneNumber: z
    .string()
    .trim()
    .min(9, "Nomor HP minimal 9 digit")
    .max(20, "Nomor HP maksimal 20 digit")
    .optional(),

  address: z
    .string()
    .trim()
    .min(5, "Alamat minimal 5 karakter")
    .max(255, "Alamat maksimal 255 karakter")
    .optional(),

  avatarUrl: z.string().url("Format URL foto profil tidak valid").optional(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
