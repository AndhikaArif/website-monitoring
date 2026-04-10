import type { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../errors/app.error.js";
import { formatZodError } from "../utils/format-zod-error.js";

type Source = "body" | "query" | "params";

export const validate =
  (schema: ZodType, source: Source = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];

    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      throw new AppError(400, "Validation error", formatZodError(parsed.error));
    }

    // overwrite sesuai source
    if (source === "body") {
      req.validatedBody = parsed.data;
    } else if (source === "query") {
      req.validatedQuery = parsed.data;
    } else if (source === "params") {
      req.validatedParams = parsed.data;
    }

    next();
  };
