import type { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";
import { AppError } from "../errors/app.error.js";
import { formatZodError } from "../utils/format-zod-error.js";

export const validate =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, "Validation error", formatZodError(parsed.error));
    }

    req.body = parsed.data;
    next();
  };
