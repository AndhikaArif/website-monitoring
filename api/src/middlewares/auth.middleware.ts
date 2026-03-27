import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type CustomJwtPayload } from "../types/auth.type.d.js";
import type { UserRole } from "../generated/prisma/index.js";

export class AuthMiddleWare {
  static verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const cookieToken = req.cookies?.authenticationToken;
      const authToken = cookieToken;

      if (!authToken)
        return res.status(401).json({ message: "Unauthenticated" });

      const verifiedToken = jwt.verify(
        authToken,
        process.env.JWT_SECRET as string,
      ) as CustomJwtPayload;

      if (typeof verifiedToken === "string") {
        return res.status(401).json({ message: "Invalid token format" });
      }

      req.currentUser = verifiedToken;

      next();
    } catch (error) {
      return res.status(401).json({ message: "Expired or invalid token" });
    }
  }

  static roleGuard(...allowedUser: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const role = req.currentUser?.role;

      if (!role) {
        return res
          .status(401)
          .json({ message: "Unauthenticated. Please login first" });
      }

      if (!allowedUser.includes(role)) {
        return res.status(403).json({
          message: "Forbidden, you are not authorized to access this route",
        });
      }

      console.warn(`Unauthorized access by role: ${role}`);

      next();
    };
  }
}
