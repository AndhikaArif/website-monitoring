import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.js";

import { AppError } from "../errors/app.error.js";
import type { IExistingUser } from "../types/auth.type.js";
import type {
  CreateHeadWorkerDTO,
  UpdateHeadWorkerDTO,
  ListHeadWorkerQueryDTO,
} from "../validations/head-worker.validation.js";
import { UserRole } from "../generated/prisma/index.js";

export class HeadWorkerServices {
  async createHeadWorker(
    currentUser: IExistingUser,
    data: CreateHeadWorkerDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa membuat head worker");
    }

    // 🔍 cek duplicate
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
        deletedAt: null,
        mandorId: currentUser.id,
      },
    });

    if (existing) {
      throw new AppError(400, "Email atau username sudah digunakan");
    }

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 💾 create user
    const headWorker = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: UserRole.HEAD_WORKER,
        mandorId: currentUser.id,
      },
    });

    const { password, ...safeHeadWorker } = headWorker;
    return safeHeadWorker;
  }

  async updateHeadWorker(
    currentUser: IExistingUser,
    headWorkerId: string,
    data: UpdateHeadWorkerDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa update head worker");
    }

    const existingHeadWorker = await prisma.user.findFirst({
      where: {
        id: headWorkerId,
        role: UserRole.HEAD_WORKER,
        deletedAt: null,
        mandorId: currentUser.id,
      },
    });

    if (!existingHeadWorker) {
      throw new AppError(404, "Head Worker tidak ditemukan");
    }

    if (data.email || data.username) {
      const duplicate = await prisma.user.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.username ? [{ username: data.username }] : []),
          ],
          NOT: { id: headWorkerId },
          deletedAt: null,
          mandorId: currentUser.id,
        },
      });

      if (duplicate) {
        throw new AppError(400, "Email atau username sudah digunakan");
      }
    }

    // kalau update password → hash
    let hashedPassword;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // BUILD UPDATE DATA (INI KUNCI NYA)
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (hashedPassword !== undefined) updateData.password = hashedPassword;

    const updated = await prisma.user.update({
      where: { id: headWorkerId },
      data: updateData,
    });

    const { password, ...safeHeadWorker } = updated;
    return safeHeadWorker;
  }

  async deleteHeadWorker(currentUser: IExistingUser, headWorkerId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa menghapus head worker");
    }

    const existingHeadWorker = await prisma.user.findFirst({
      where: {
        id: headWorkerId,
        role: UserRole.HEAD_WORKER,
        deletedAt: null,
        mandorId: currentUser.id,
      },
    });

    if (!existingHeadWorker) {
      throw new AppError(404, "Head worker tidak ditemukan");
    }

    await prisma.user.update({
      where: { id: headWorkerId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: "Head Worker berhasil dihapus" };
  }

  async getHeadWorkerById(currentUser: IExistingUser, headWorkerId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(
        403,
        "Hanya mandor yang bisa melihat detail head worker",
      );
    }

    const headWorker = await prisma.user.findFirst({
      where: {
        id: headWorkerId,
        role: UserRole.HEAD_WORKER,
        deletedAt: null,
        mandorId: currentUser.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!headWorker) {
      throw new AppError(404, "Head Worker tidak ditemukan");
    }

    return headWorker;
  }

  async listHeadWorker(
    currentUser: IExistingUser,
    query: ListHeadWorkerQueryDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(
        403,
        "Hanya mandor yang bisa melihat daftar head worker",
      );
    }
    const { page, limit } = query;

    const skip = (page - 1) * limit;

    const [headWorkers, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: UserRole.HEAD_WORKER,
          deletedAt: null,
          mandorId: currentUser.id,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          createdAt: true,
        },
      }),

      prisma.user.count({
        where: {
          role: UserRole.HEAD_WORKER,
          deletedAt: null,
          mandorId: currentUser.id,
        },
      }),
    ]);

    return {
      data: headWorkers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
