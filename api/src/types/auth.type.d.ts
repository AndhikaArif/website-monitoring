import { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/index.js";

export interface CostumJwtPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface IExistingUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
