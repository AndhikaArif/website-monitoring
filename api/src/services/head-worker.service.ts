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
import { toTitleCase } from "../utils/to-title-case.js";

export class HeadWorkerServices {
  async createHeadWorker(
    currentUser: IExistingUser,
    data: CreateHeadWorkerDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa membuat Kepala Tukang");
    }

    // cek duplicate
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

    // hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Ubah nama menjadi Title Case sebelum disave
    const formattedName = toTitleCase(data.name);

    // create user
    const kepalaTukang = await prisma.user.create({
      data: {
        name: formattedName,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: UserRole.KEPALA_TUKANG,
        mandorId: currentUser.id,
      },
    });

    const { password, ...safeHeadWorker } = kepalaTukang;
    return safeHeadWorker;
  }

  async updateHeadWorker(
    currentUser: IExistingUser,
    kepalaTukangId: string,
    data: UpdateHeadWorkerDTO,
  ) {
    if (
      currentUser.role !== UserRole.MANDOR &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new AppError(
        403,
        "Hanya mandor atau admin yang bisa update Kepala Tukang",
      );
    }

    if (currentUser.role === UserRole.MANDOR && (data.email || data.username)) {
      throw new AppError(
        403,
        "Mandor tidak memiliki akses untuk mengubah email atau username",
      );
    }

    // Cari data kepala tukang (Jika mandor, hanya bisa cari miliknya sendiri)
    const existingHeadWorker = await prisma.user.findFirst({
      where: {
        id: kepalaTukangId,
        role: UserRole.KEPALA_TUKANG,
        deletedAt: null,
        ...(currentUser.role === UserRole.MANDOR && {
          mandorId: currentUser.id,
        }),
      },
    });

    if (!existingHeadWorker) {
      throw new AppError(404, "Kepala Tukang tidak ditemukan");
    }

    // Pengecekan Duplikat secara GLOBAL (Hanya berjalan jika ADMIN yang mengubah email/username)
    if (data.email || data.username) {
      const duplicate = await prisma.user.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.username ? [{ username: data.username }] : []),
          ],
          NOT: { id: kepalaTukangId },
        },
      });

      if (duplicate) {
        if (duplicate.deletedAt !== null) {
          throw new AppError(
            400,
            "Email atau username ini masih digunakan oleh akun yang sudah dihapus (berada di riwayat kepala tukang). Silakan lakukan hapus permanen pada akun tersebut terlebih dahulu.",
          );
        }

        throw new AppError(
          400,
          "Email atau username sudah digunakan oleh akun lain yang masih aktif.",
        );
      }
    }

    // kalau update password → hash
    let hashedPassword;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // BUILD UPDATE DATA
    const updateData: any = {};

    // Jika ada perubahan nama, format dulu ke Title Case
    if (data.name !== undefined) {
      updateData.name = toTitleCase(data.name);
    }
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (hashedPassword !== undefined) updateData.password = hashedPassword;

    const updated = await prisma.user.update({
      where: { id: kepalaTukangId },
      data: updateData,
    });

    const { password, ...safeHeadWorker } = updated;
    return safeHeadWorker;
  }

  async deleteHeadWorker(currentUser: IExistingUser, kepalaTukangId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa menghapus Kepala Tukang");
    }

    const existingHeadWorker = await prisma.user.findFirst({
      where: {
        id: kepalaTukangId,
        role: UserRole.KEPALA_TUKANG,
        deletedAt: null,
        mandorId: currentUser.id,
      },
    });

    if (!existingHeadWorker) {
      throw new AppError(404, "Kepala Tukang tidak ditemukan");
    }

    await prisma.user.update({
      where: { id: kepalaTukangId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: "Kepala Tukang berhasil dihapus" };
  }

  async getHeadWorkerById(currentUser: IExistingUser, kepalaTukangId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(
        403,
        "Hanya mandor yang bisa melihat detail Kepala Tukang",
      );
    }

    const kepalaTukang = await prisma.user.findFirst({
      where: {
        id: kepalaTukangId,
        role: UserRole.KEPALA_TUKANG,
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

    if (!kepalaTukang) {
      throw new AppError(404, "Kepala Tukang tidak ditemukan");
    }

    return kepalaTukang;
  }

  async listHeadWorker(
    currentUser: IExistingUser,
    query: ListHeadWorkerQueryDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(
        403,
        "Hanya mandor yang bisa melihat daftar Kepala Tukang",
      );
    }
    const { page, limit } = query;

    const skip = (page - 1) * limit;

    const [kepalaTukang, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: UserRole.KEPALA_TUKANG,
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
          phoneNumber: true,
          address: true,
          createdAt: true,
        },
      }),

      prisma.user.count({
        where: {
          role: UserRole.KEPALA_TUKANG,
          deletedAt: null,
          mandorId: currentUser.id,
        },
      }),
    ]);

    return {
      data: kepalaTukang,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listTrashedHeadWorker(
    currentUser: IExistingUser,
    query: ListHeadWorkerQueryDTO,
  ) {
    if (
      currentUser.role !== UserRole.MANDOR &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new AppError(
        403,
        "Hanya mandor atau admin yang bisa melihat riwayat Kepala Tukang",
      );
    }

    const { page, limit, mandorId } = query;
    const skip = (page - 1) * limit;

    const whereCondition = {
      role: UserRole.KEPALA_TUKANG,
      deletedAt: { not: null },
      mandorId: { not: null }, // Ambil hanya yang masih punya Mandor (Belum di-hard delete)

      // Jika MANDOR, batasi hanya melihat Kepala Tukangnya sendiri. Jika ADMIN, lolos (melihat semua).
      ...(currentUser.role === UserRole.MANDOR
        ? { mandorId: currentUser.id }
        : { ...(mandorId && { mandorId }) }),
    };

    const [kepalaTukang, total] = await Promise.all([
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
          mandor: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    return {
      data: kepalaTukang,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async restoreHeadWorker(currentUser: IExistingUser, userId: string) {
    if (
      currentUser.role !== UserRole.MANDOR &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new AppError(
        403,
        "Hanya mandor atau admin yang bisa memulihkan Kepala Tukang",
      );
    }

    // Cek dulu apakah user tersebut ada dan sesuai aksesnya
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: { not: null },
        ...(currentUser.role === UserRole.MANDOR && {
          mandorId: currentUser.id,
        }),
      },
    });

    if (!user)
      throw new AppError(404, "Kepala Tukang tidak ditemukan di riwayat");

    return await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  async hardDeleteHeadWorker(currentUser: IExistingUser, userId: string) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(
        403,
        "Hanya admin yang memiliki kewenangan untuk menghapus akun secara permanen",
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.KEPALA_TUKANG,
        deletedAt: { not: null },
      },
    });

    if (!user)
      throw new AppError(404, "Kepala Tukang tidak ditemukan di riwayat");

    const timestamp = Date.now();
    // Menghasilkan string acak 4 karakter (contoh: 'a1b2') untuk menjamin keunikan mutlak
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    // Jalankan data scrambling
    await prisma.user.update({
      where: { id: userId },
      data: {
        // 1. Rusak email & username aslinya agar string murni bebas dipakai user baru
        email: `deleted_${timestamp}_${randomSuffix}@mail.com`,
        username: `deleted_${timestamp}_${randomSuffix}`,

        // 2. Kunci password dengan string acak/statis yang tidak bisa di-hash ulang
        password: "DELETED_ACCOUNT_LOCKED",
        phoneNumber: null,
        address: null,

        // 3. Putuskan relasi dari mandor agar hilang sepenuhnya dari daftar sistem mandor
        mandorId: null,

        // 4. Kosongkan seluruh penugasan proyek (Unassign All)
        assignedProjects: {
          set: [],
        },
      },
    });

    return {
      message: "Kepala Tukang berhasil dihapus permanen dari sistem",
    };
  }
}
