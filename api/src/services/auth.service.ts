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
    // 🔍 cek duplicate
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

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 💾 create user
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

    // BUILD UPDATE DATA (INI KUNCI NYA)
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
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: { not: null },
        ...(currentUser.role === UserRole.MANDOR && {
          mandorId: currentUser.id,
        }),
      },
    });

    if (!user) throw new AppError(404, "Mandor tidak ditemukan di sampah");

    return await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  async hardDeleteMandor(currentUser: IExistingUser, userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: { not: null },
        ...(currentUser.role === UserRole.MANDOR && {
          mandorId: currentUser.id,
        }),
      },
    });

    if (!user) throw new AppError(404, "Mandor tidak ditemukan di sampah");

    return await prisma.user.delete({ where: { id: userId } });
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
