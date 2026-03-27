import { prisma } from "../config/prisma.config.js";
import { AppError } from "../errors/app.error.js";
import type {
  AssignWorkerDTO,
  CreateWorkerDTO,
} from "../validations/worker.validation.js";

export class WorkerService {
  async createWorker(data: CreateWorkerDTO, mandorId: string) {
    return prisma.worker.create({
      data: {
        name: data.name,
        position: data.position,
        dailySalary: data.dailySalary,
        mandorId,
      },
    });
  }

  async assignWorker(data: AssignWorkerDTO, mandorId: string) {
    const { workerId, projectId } = data;

    // 1. cek worker milik mandor
    const worker = await prisma.worker.findFirst({
      where: {
        id: workerId,
        mandorId,
        deletedAt: null,
      },
    });

    if (!worker) {
      throw new AppError(404, "Worker tidak ditemukan");
    }

    // 2. cek project milik mandor
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId,
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    // 3. cek assignment aktif
    const existingActive = await prisma.workerAssignment.findFirst({
      where: {
        workerId,
        projectId,
        endDate: null,
      },
    });

    if (existingActive) {
      throw new AppError(400, "Worker masih aktif di project ini");
    }

    // 4. create assignment
    return prisma.workerAssignment.create({
      data: {
        workerId,
        projectId,
      },
      include: {
        worker: true,
        project: true,
      },
    });
  }
}
