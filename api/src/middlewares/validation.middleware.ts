import type { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";
import { AppError } from "../errors/app.error.js";
import { formatZodError } from "../utils/format-zod-error.js";

type Source = "body" | "query" | "params";

export const validate =
  (schema: ZodObject, source: Source = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];

    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      throw new AppError(400, "Validation error", formatZodError(parsed.error));
    }

    // overwrite sesuai source
    req[source] = parsed.data;

    next();
  };
