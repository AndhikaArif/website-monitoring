import "express";
import { type CostumJwtPayload } from "./auth.type.js";

declare module "express-serve-static-core" {
  interface Request {
    currentUser?: CostumJwtPayload | null;
  }
}
