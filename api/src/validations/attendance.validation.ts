import { z } from "zod";
import { AttendanceStatus } from "../generated/prisma/index.js";

export const createAttendanceSchema = z.object({
  workerId: z.string().min(1, "workerId wajib"),
  status: z.enum(AttendanceStatus),
});

export type CreateAttendanceDTO = z.infer<typeof createAttendanceSchema>;

export const bulkAttendanceSchema = z.object({
  attendances: z
    .array(
      z.object({
        workerId: z.string().min(1),
        status: z.enum(AttendanceStatus),
      }),
    )
    .min(1, "Minimal 1 data"),
});

export type bulkAttendanceDTO = z.infer<typeof bulkAttendanceSchema>;
