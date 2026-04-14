import type { Request, Response, NextFunction } from "express";
import { DocumentationService } from "../services/documentation.service.js";
import { FileUpload } from "../utils/file-upload.util.js";
import { AppError } from "../errors/app.error.js";
import type {
  CreateDocDTO,
  UpdateDocDTO,
  PaginationQueryDTO,
  DocumentationIdParamDTO,
  DeleteFileDTO,
} from "../validations/documentation.validation.js";

const documentationService = new DocumentationService();
const uploader = new FileUpload();

export class DocumentationController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.currentUser!;
      const payload = req.validatedBody as CreateDocDTO;

      const data = await documentationService.create(currentUser, payload);

      return res.status(201).json({
        success: true,
        message: "Dokumentasi berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.currentUser!;
      const query = req.validatedQuery as PaginationQueryDTO;

      const result = await documentationService.listDocumentationHistory(
        currentUser,
        query,
      );

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil riwayat dokumentasi",
        ...result, // Me-spread data dan meta dari service
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.currentUser!;
      const { id } = req.validatedParams as DocumentationIdParamDTO;

      const data = await documentationService.getByIdAndValidateOwnership(
        id,
        currentUser,
      );

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil detail dokumentasi",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.currentUser!;
      const { id } = req.validatedParams as { id: string };
      const payload = req.validatedBody as UpdateDocDTO;

      const data = await documentationService.update(id, currentUser, payload);

      return res.status(200).json({
        success: true,
        message: "Dokumentasi berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.currentUser!;
      const { id } = req.validatedParams as { id: string };

      await documentationService.delete(id, currentUser);

      return res.status(200).json({
        success: true,
        message: "Dokumentasi berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  }

  // Method upload gambar/video langsung di sini
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        throw new AppError(400, "Tidak ada file yang dipilih");
      }

      const data = await documentationService.uploadFiles(
        req.files as Express.Multer.File[],
      );

      return res.status(200).json({
        success: true,
        message: "File berhasil diunggah ke cloud",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Method delete file (untuk cleanup) di sini
  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { cloudinaryId } = req.validatedBody as DeleteFileDTO;

      // Hapus dari Cloudinary
      await documentationService.deleteFileFromCloudinary(cloudinaryId);

      return res.status(200).json({
        success: true,
        message: "File sampah berhasil dibersihkan",
      });
    } catch (error) {
      next(error);
    }
  }
}
