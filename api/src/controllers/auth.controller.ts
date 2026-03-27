import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.config.js";

import { AuthServices } from "../services/auth.service.js";
import { createMandorSchema } from "../validations/auth.validation.js";
import { loginSchema } from "../validations/auth.validation.js";

const authServices = new AuthServices();

export class AuthController {
  async createMandor(req: Request, res: Response) {
    const parsed = createMandorSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error,
      });
    }

    const result = await authServices.createMandor(parsed.data);

    return res.status(201).json({
      message: "Mandor berhasil dibuat",
      data: result,
    });
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await authServices.validateUser(username, password);
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
      });

      const authToken = await authServices.generateToken({
        ...user,
        workerId: worker?.id || null,
      });

      res
        .status(200)
        .cookie("authenticationToken", authToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 24 * 90, //90 hari
        })
        .json({
          message: "Login success",
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            workerId: worker?.id || null,
          },
        });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    res
      .status(200)
      .clearCookie("authenticationToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .json({ message: "Logout success" });
  }
}
