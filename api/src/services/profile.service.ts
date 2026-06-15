import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.js";
import { AppError } from "../errors/app.error.js";
import type { UpdateProfileDTO } from "../validations/profile.validation.js";
import { toTitleCase } from "../utils/to-title-case.js";

export class ProfileService {
  async getMyProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User tidak ditemukan");
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, "User tidak ditemukan");
    }

    // Pangkas undefined agar tidak menimpa data lama dengan null
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    const updated = await prisma.user.update({
      where: { id: userId },
      data: cleanData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        address: true,
      },
    });

    return updated;
  }

  // async changePassword(
  //   userId: string,
  //   oldPassword: string,
  //   newPassword: string,
  // ) {
  //   const user = await prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) {
  //     throw new AppError(404, "User tidak ditemukan");
  //   }

  //   const isMatch = await bcrypt.compare(oldPassword, user.password);

  //   if (!isMatch) {
  //     throw new AppError(400, "Password lama salah");
  //   }

  //   if (oldPassword === newPassword) {
  //     throw new AppError(400, "Password baru harus berbeda");
  //   }

  //   const hashed = await bcrypt.hash(newPassword, 10);

  //   await prisma.user.update({
  //     where: { id: userId },
  //     data: { password: hashed },
  //   });

  //   return { message: "Password berhasil diubah" };
  // }
}
