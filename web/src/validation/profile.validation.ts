import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .optional()
    .or(z.literal("")),

  phoneNumber: z
    .string()
    .min(9, "Nomor HP minimal 9 digit")
    .max(20, "Nomor HP maksimal 20 digit")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .min(5, "Alamat minimal 5 karakter")
    .optional()
    .or(z.literal("")),

  avatarUrl: z
    .string()
    .url("Format URL foto profil tidak valid")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
