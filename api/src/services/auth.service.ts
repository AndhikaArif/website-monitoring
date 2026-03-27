import Jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.js";

import { AppError } from "../errors/app.error.js";
import type { IExistingUser } from "../types/auth.type.js";
import type { CreateMandorDTO } from "../validations/auth.validation.js";

export class AuthServices {
  async createMandor(data: CreateMandorDTO) {
    // 🔍 cek duplicate
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      throw new AppError(400, "Email atau username sudah digunakan");
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
        role: "MANDOR",
      },
    });

    return mandor;
  }

  async validateUser(username: string, password: string) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!existingUser) throw new AppError(401, "Username or password is wrong");

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
    const payload = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      workerId: existingUser.workerId ?? null,
    };

    const authToken = Jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "90d",
    });

    return authToken;
  }
}
