import Jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.js";

import { AppError } from "../errors/app.error.js";
import type { IExistingUser } from "../types/auth.type.js";
import type {
  CreateMandorDTO,
  ListMandorQueryDTO,
  UpdateMandorDTO,
} from "../validations/auth.validation.js";
import { UserRole } from "../generated/prisma/index.js";

export class AuthServices {
  async createMandor(currentUser: IExistingUser, data: CreateMandorDTO) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa membuat mandor");
    }
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      if (existing.email === data.email) {
        throw new AppError(400, "Email sudah terdaftar");
      }
      if (existing.username === data.username) {
        throw new AppError(400, "Username sudah digunakan");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const mandor = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: UserRole.MANDOR,
      },
    });

    const { password, ...safeMandor } = mandor;
    return safeMandor;
  }

  async updateMandor(
    currentUser: IExistingUser,
    mandorId: string,
    data: UpdateMandorDTO,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa update mandor");
    }

    const existingMandor = await prisma.user.findFirst({
      where: {
        id: mandorId,
        role: UserRole.MANDOR,
        deletedAt: null,
      },
    });

    if (!existingMandor) {
      throw new AppError(404, "Mandor tidak ditemukan");
    }

    if (data.email || data.username) {
      const duplicate = await prisma.user.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.username ? [{ username: data.username }] : []),
          ],
          NOT: { id: mandorId },
          deletedAt: null,
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

    // BUILD UPDATE DATA
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (hashedPassword !== undefined) updateData.password = hashedPassword;

    const updated = await prisma.user.update({
      where: { id: mandorId },
      data: updateData,
    });

    const { password, ...safeMandor } = updated;
    return safeMandor;
  }

  async deleteMandor(currentUser: IExistingUser, mandorId: string) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa menghapus mandor");
    }

    const existingMandor = await prisma.user.findFirst({
      where: {
        id: mandorId,
        role: UserRole.MANDOR,
        deletedAt: null,
      },
    });

    if (!existingMandor) {
      throw new AppError(404, "Mandor tidak ditemukan");
    }

    await prisma.user.update({
      where: { id: mandorId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: "Mandor berhasil dihapus" };
  }

  async getMandorById(currentUser: IExistingUser, mandorId: string) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa melihat detail mandor");
    }

    const mandor = await prisma.user.findFirst({
      where: {
        id: mandorId,
        role: UserRole.MANDOR,
        deletedAt: null,
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

    if (!mandor) {
      throw new AppError(404, "Mandor tidak ditemukan");
    }

    return mandor;
  }

  async listMandor(currentUser: IExistingUser, query: ListMandorQueryDTO) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa melihat daftar mandor");
    }
    const { page, limit } = query;

    const skip = (page - 1) * limit;

    const [mandors, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: UserRole.MANDOR,
          deletedAt: null,
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
          phoneNumber: true,
          address: true,
          createdAt: true,
        },
      }),

      prisma.user.count({
        where: {
          role: UserRole.MANDOR,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: mandors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listTrashedMandor(
    currentUser: IExistingUser,
    query: ListMandorQueryDTO,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa melihat sampah mandor");
    }
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const whereCondition = {
      role: UserRole.MANDOR,
      deletedAt: { not: null },
    };

    const [mandors, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    return {
      data: mandors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async restoreMandor(currentUser: IExistingUser, userId: string) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa memulihkan mandor");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.MANDOR,
        deletedAt: { not: null },
      },
    });

    if (!user) throw new AppError(404, "Mandor tidak ditemukan di sampah");

    return await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  async hardDeleteMandor(currentUser: IExistingUser, userId: string) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(
        403,
        "Hanya admin yang bisa menghapus permanen mandor",
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.MANDOR,
        deletedAt: { not: null },
      },
    });

    if (!user) throw new AppError(404, "Mandor tidak ditemukan di sampah");

    // Hitung apakah Mandor masih memiliki Proyek
    const projectCount = await prisma.project.count({
      where: { mandorId: userId },
    });

    if (projectCount > 0) {
      throw new AppError(
        400,
        `Tidak dapat menghapus permanen. Mandor ini masih terikat pada ${projectCount} proyek. Silakan transfer proyek tersebut ke Mandor lain terlebih dahulu.`,
      );
    }

    // Eksekusi Penghapusan Massal dalam 1 Transaksi agar aman
    await prisma.$transaction(async (tx) => {
      // Cari semua bawahan Kepala Tukang dan Owner milik Mandor ini
      const subordinates = await tx.user.findMany({
        where: {
          mandorId: userId,
          role: {
            in: [UserRole.KEPALA_TUKANG, UserRole.OWNER],
          },
        },
        select: { id: true },
      });

      // Lakukan "Scramble" massal untuk semua Kepala Tukang dan Owner tersebut
      if (subordinates.length > 0) {
        for (const sub of subordinates) {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 6);

          await tx.user.update({
            where: { id: sub.id },
            data: {
              email: `deleted_${timestamp}_${randomSuffix}@mail.com`,
              username: `deleted_${timestamp}_${randomSuffix}`,
              password: "DELETED_ACCOUNT_LOCKED",
              phoneNumber: null,
              address: null,
              mandorId: null, // Putuskan relasi
              deletedAt: new Date(),
            },
          });
        }
      }

      // Setelah bawahannya beres, Mandor bisa dibunuh secara fisik (Hard Delete)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { message: "Mandor berhasil dihapus permanen dari sistem" };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<IExistingUser> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new AppError(401, "Username or password is wrong");
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!isValidPassword)
      throw new AppError(401, "Username or password is wrong");

    const { password: _, ...safeUser } = existingUser;

    return safeUser;
  }

  async generateToken(existingUser: IExistingUser) {
    if (!process.env.JWT_SECRET) {
      throw new AppError(500, "Server configuration error");
    }

    const payload = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    };

    const authToken = Jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "90d",
    });

    return authToken;
  }
}
