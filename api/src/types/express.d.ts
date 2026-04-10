import "express";
import { type CustomJwtPayload, type IExistingUser } from "./auth.type.js";

declare module "express-serve-static-core" {
  interface Request {
    currentUser?: CustomJwtPayload | null;

    validatedBody?: unknown;
    validatedQuery?: unknown;
    validatedParams?: unknown;
  }
}
