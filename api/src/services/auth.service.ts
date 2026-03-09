import Jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.config.js";

import { AppError } from "../errors/app.error.js";
import type { IExistingUser } from "../types/auth.type.js";

export class AuthServices {
  async validateUser(username: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) throw new AppError(401, "Username or password is wrong");

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
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
    };

    const authToken = Jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "90d",
    });

    return authToken;
  }
}
