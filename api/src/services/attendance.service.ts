import { prisma } from "../config/prisma.config.js";
import { AppError } from "../errors/app.error.js";
import {
  ProjectStatus,
  type AttendanceStatus,
} from "../generated/prisma/index.js";

export class AttendanceService {
  async createAttendance(
    workerId: string,
    status: AttendanceStatus,
    currentUserId: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. ambil user (HEAD_WORKER / MANDOR)
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        worker: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User tidak ditemukan");
    }

    // 2. tentukan project user
    let projectId: string | null = null;

    // 🔥 kalau HEAD_WORKER
    if (user.worker) {
      const project = await prisma.project.findFirst({
        where: {
          headWorkerId: user.worker.id,
          status: ProjectStatus.AKTIF,
        },
      });

      if (!project) {
        throw new AppError(400, "Head worker tidak punya project aktif");
      }

      projectId = project.id;
    }

    // 🔥 kalau MANDOR
    else {
      const project = await prisma.project.findFirst({
        where: {
          mandorId: user.id,
          status: ProjectStatus.AKTIF,
        },
      });

      if (!project) {
        throw new AppError(400, "Mandor tidak punya project aktif");
      }

      projectId = project.id;
    }

    // 3. cek worker ada di project ini (assignment aktif)
    const assignment = await prisma.workerAssignment.findFirst({
      where: {
        workerId,
        projectId,
        endDate: null,
      },
    });

    if (!assignment) {
      throw new AppError(
        400,
        "Worker tidak terdaftar di project ini atau tidak aktif",
      );
    }

    // 4. cek attendance hari ini
    const existing = await prisma.attendance.findFirst({
      where: {
        workerId,
        date: today,
      },
    });

    if (existing) {
      throw new AppError(400, "Attendance hari ini sudah ada");
    }

    // 5. create attendance
    return prisma.attendance.create({
      data: {
        workerId,
        projectId,
        date: today,
        status,
        createdById: currentUserId,
      },
    });
  }

  async bulkCreateAttendance(
    attendances: { workerId: string; status: AttendanceStatus }[],
    currentUserId: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    // 🔥 ambil user & project sekali (optimasi)
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { worker: true },
    });

    if (!user) throw new AppError(404, "User tidak ditemukan");

    let projectId: string | null = null;

    if (user.worker) {
      const project = await prisma.project.findFirst({
        where: {
          headWorkerId: user.worker.id,
          status: "AKTIF",
        },
      });

      if (!project) {
        throw new AppError(400, "Head worker tidak punya project aktif");
      }

      projectId = project.id;
    } else {
      const project = await prisma.project.findFirst({
        where: {
          mandorId: user.id,
          status: "AKTIF",
        },
      });

      if (!project) {
        throw new AppError(400, "Mandor tidak punya project aktif");
      }

      projectId = project.id;
    }

    // 🔥 loop per worker
    for (const item of attendances) {
      try {
        const { workerId, status } = item;

        // 1. cek assignment aktif
        const assignment = await prisma.workerAssignment.findFirst({
          where: {
            workerId,
            projectId,
            endDate: null,
          },
        });

        if (!assignment) {
          throw new Error("Worker tidak aktif di project ini");
        }

        // 2. cek attendance existing
        const existing = await prisma.attendance.findFirst({
          where: {
            workerId,
            date: today,
          },
        });

        if (existing) {
          throw new Error("Sudah ada attendance hari ini");
        }

        // 3. create
        const created = await prisma.attendance.create({
          data: {
            workerId,
            projectId,
            date: today,
            status,
            createdById: currentUserId,
          },
        });

        results.success.push(created);
      } catch (error: any) {
        results.failed.push({
          workerId: item.workerId,
          message: error.message || "Unknown error",
        });
      }
    }

    return results;
  }
}
