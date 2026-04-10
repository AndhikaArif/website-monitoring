import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.config.js";

import { AuthServices } from "../services/auth.service.js";
import { AppError } from "../errors/app.error.js";
import {
  type CreateMandorDTO,
  type LoginDTO,
  type UpdateMandorDTO,
  type MandorParamsDTO,
  type ListMandorQueryDTO,
} from "../validations/auth.validation.js";

const authServices = new AuthServices();

export class AuthController {
  async createMandor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }
      const result = await authServices.createMandor(
        req.currentUser,
        req.validatedBody as CreateMandorDTO,
      );

      return res.status(201).json({
        message: "Mandor berhasil dibuat",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMandor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const { id } = req.validatedParams as MandorParamsDTO;

      const result = await authServices.updateMandor(
        req.currentUser,
        id,
        req.validatedBody as UpdateMandorDTO,
      );

      return res.json({
        message: "Mandor berhasil diupdate",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMandor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const { id } = req.validatedParams as MandorParamsDTO;

      const result = await authServices.deleteMandor(req.currentUser, id);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMandorById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const { id } = req.validatedParams as MandorParamsDTO;
      const result = await authServices.getMandorById(req.currentUser, id);

      return res.json({
        message: "Data mandor berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listMandor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const result = await authServices.listMandor(
        req.currentUser,
        req.validatedQuery as ListMandorQueryDTO,
      );

      return res.json({
        message: "List mandor berhasil diambil",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.validatedBody as LoginDTO;

      const user = await authServices.validateUser(username, password);

      const authToken = await authServices.generateToken(user);

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
          },
        });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    return res
      .status(200)
      .clearCookie("authenticationToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .json({ message: "Logout success" });
  }
}
