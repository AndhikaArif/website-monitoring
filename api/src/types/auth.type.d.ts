import { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/index.js";

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface IExistingUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
}
