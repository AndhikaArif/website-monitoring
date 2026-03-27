import { z } from "zod";
import { WorkerPosition } from "../generated/prisma/index.js";

export const createWorkerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  position: z.enum(WorkerPosition),
  dailySalary: z.number().min(1, "Gaji harus lebih dari 0"),
});

export type CreateWorkerDTO = z.infer<typeof createWorkerSchema>;

export const assignWorkerSchema = z.object({
  workerId: z.string().min(1, "workerId wajib"),
  projectId: z.string().min(1, "projectId wajib"),
});

export type AssignWorkerDTO = z.infer<typeof assignWorkerSchema>;
