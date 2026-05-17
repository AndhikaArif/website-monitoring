import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app.error.js";

export class ErrorMiddleware {
  static notFound(req: Request, res: Response) {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  }

  static global(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    console.error(error);

    // HANDLE ZOD ERROR
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message,
      });
    }

    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message, errors: error.errors ?? null });
    }

    const errObj = error as any;
    if (
      errObj?.code === "P1001" ||
      errObj?.message?.includes("Can't reach database server")
    ) {
      return res.status(500).json({
        message:
          "Koneksi ke pangkalan data Supabase terputus sementara. Silakan segarkan halaman dalam beberapa detik.",
        time: new Date().toISOString(),
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : error.message,
        time: new Date().toISOString(),
      });
    }

    return res
      .status(500)
      .json({ message: `General error from internal server` });
  }
}
