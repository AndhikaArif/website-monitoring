import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";

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

    // HANDLE MULTER ERROR (Ukuran file & Jumlah file per request)
    if (error instanceof multer.MulterError) {
      let message = "Terjadi kesalahan saat mengunggah berkas.";

      if (error.code === "LIMIT_FILE_SIZE") {
        message =
          "Ukuran berkas terlalu besar. Maksimal ukuran yang diperbolehkan adalah 50MB.";
      } else if (error.code === "LIMIT_FILE_COUNT") {
        message =
          "Jumlah berkas terlalu banyak. Maksimal berkas dalam satu kali unggah adalah 20 file.";
      }

      return res.status(400).json({
        message,
        code: error.code, // Menyertakan kode asli multer (opsional, bagus untuk FE)
      });
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
