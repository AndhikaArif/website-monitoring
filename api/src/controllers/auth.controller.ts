import type { Request, Response, NextFunction } from "express";

import { AuthServices } from "../services/auth.service.js";
import { loginSchema } from "../validations/auth.validation.js";

const authServices = new AuthServices();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await authServices.validateUser(username, password);
      const authToken = await authServices.generateToken(user);

      res
        .status(200)
        .cookie("authenticationToken", authToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
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
    res
      .status(200)
      .clearCookie("authenticationToken")
      .json({ message: "Logout success" });
  }
}
