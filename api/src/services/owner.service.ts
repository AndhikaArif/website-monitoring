import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.js";

import { AppError } from "../errors/app.error.js";
import type { IExistingUser } from "../types/auth.type.js";
import type {
  CreateOwnerDTO,
  UpdateOwnerDTO,
  ListOwnerQueryDTO,
} from "../validations/owner.validation.js";
import { UserRole } from "../generated/prisma/index.js";

export class OwnerServices {
  async createOwner(currentUser: IExistingUser, data: CreateOwnerDTO) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa membuat data owner");
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
    const owner = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: UserRole.OWNER,
        mandorId: currentUser.id, // Menandai bahwa owner ini didaftarkan oleh mandor ini
      },
    });

    const { password, ...safeOwner } = owner;
    return safeOwner;
  }

  async updateOwner(
    currentUser: IExistingUser,
    ownerId: string,
    data: UpdateOwnerDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa update data owner");
    }

    const existingOwner = await prisma.user.findFirst({
      where: {
        id: ownerId,
        role: UserRole.OWNER,
        deletedAt: null,
        mandorId: currentUser.id,
      },
    });

    if (!existingOwner) {
      throw new AppError(
        403,
        "Akses ditolak. Anda hanya dapat mengedit data Klien yang Anda daftarkan sendiri.",
      );
    }

    if (data.email || data.username) {
      const duplicate = await prisma.user.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.username ? [{ username: data.username }] : []),
          ],
          NOT: { id: ownerId },
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
      where: { id: ownerId },
      data: updateData,
    });

    const { password, ...safeOwner } = updated;
    return safeOwner;
  }

  async deleteOwner(currentUser: IExistingUser, ownerId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa menghapus owner");
    }

    const existingOwner = await prisma.user.findFirst({
      where: {
        id: ownerId,
        role: UserRole.OWNER,
        deletedAt: null,
        mandorId: currentUser.id,
      },
    });

    if (!existingOwner) {
      throw new AppError(
        403,
        "Akses ditolak. Anda hanya dapat manghapus data Klien yang Anda daftarkan sendiri.",
      );
    }

    await prisma.user.update({
      where: { id: ownerId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: "Owner berhasil dihapus" };
  }

  async getOwnerById(currentUser: IExistingUser, ownerId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa melihat detail owner");
    }

    const owner = await prisma.user.findFirst({
      where: {
        id: ownerId,
        role: UserRole.OWNER,
        deletedAt: null,
        OR: [
          { mandorId: currentUser.id },
          {
            ownedProjects: {
              some: { mandorId: currentUser.id, deletedAt: null },
            },
          },
        ],
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

    if (!owner) {
      throw new AppError(404, "Owner tidak ditemukan");
    }

    return owner;
  }

  async listOwner(currentUser: IExistingUser, query: ListOwnerQueryDTO) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa melihat daftar owner");
    }
    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      role: UserRole.OWNER,
      deletedAt: null,
      OR: [
        { mandorId: currentUser.id }, // Didaftarkan oleh Mandor ini
        {
          ownedProjects: {
            some: { mandorId: currentUser.id, deletedAt: null },
          },
        }, // Punya proyek aktif di bawah Mandor ini
      ],
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [owners, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
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
        where: whereClause,
      }),
    ]);

    return {
      data: owners,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listTrashedOwner(currentUser: IExistingUser, query: ListOwnerQueryDTO) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa melihat sampah owner");
    }
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      role: UserRole.OWNER,
      mandorId: currentUser.id,
      deletedAt: { not: null },
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [owners, total] = await Promise.all([
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
      data: owners,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async restoreOwner(currentUser: IExistingUser, userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.OWNER, // Pastikan yang direstore adalah owner
        deletedAt: { not: null },
        ...(currentUser.role === UserRole.MANDOR && {
          mandorId: currentUser.id,
        }),
      },
    });

    if (!user) throw new AppError(404, "Owner tidak ditemukan di sampah");

    return await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  async hardDeleteOwner(currentUser: IExistingUser, userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.OWNER, // Pastikan yang dihapus permanen adalah owner
        deletedAt: { not: null },
        ...(currentUser.role === UserRole.MANDOR && {
          mandorId: currentUser.id,
        }),
      },
    });

    if (!user) throw new AppError(404, "Owner tidak ditemukan di sampah");

    const timestamp = Date.now();
    // Menghasilkan string acak 4 karakter (contoh: 'a1b2') untuk menjamin keunikan mutlak
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    await prisma.user.update({
      where: { id: userId },
      data: {
        // 1. Rusak email & username aslinya agar string murni bebas dipakai user baru (misal mendaftar lagi)
        // Nama (name) dibiarkan utuh untuk kebutuhan rekam jejak sejarah Proyek.
        email: `deleted_${timestamp}_${randomSuffix}@mail.com`,
        username: `deleted_${timestamp}_${randomSuffix}`,

        // 2. Kunci password dengan string acak/statis yang tidak bisa di-hash ulang
        password: "DELETED_ACCOUNT_LOCKED",
        phoneNumber: null,
        address: null,

        // 3. Putuskan relasi dari mandor agar akun Klien ini hilang sepenuhnya dari tong sampah Mandor tersebut
        mandorId: null,
      },
    });

    return { message: "Owner berhasil dihapus permanen dari sistem" };
  }
}
