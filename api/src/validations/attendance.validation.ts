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

export const dailyReportSchema = z.object({
  date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    }, "Format tanggal tidak valid"),
});

export type DailyReportDTO = z.infer<typeof dailyReportSchema>;

export const weeklyReportSchema = z.object({
  date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    }, "Format tanggal tidak valid"),
});

export type WeeklyReportDTO = z.infer<typeof weeklyReportSchema>;
