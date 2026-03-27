import { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/index.js";

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workerId?: string | null;
}

export interface IExistingUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workerId?: string | null;
}
