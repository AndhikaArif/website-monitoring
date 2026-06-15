import type { Request, Response, NextFunction } from "express";

import { HeadWorkerServices } from "../services/head-worker.service.js";
import { AppError } from "../errors/app.error.js";
import {
  type CreateHeadWorkerDTO,
  type UpdateHeadWorkerDTO,
  type HeadWorkerParamsDTO,
  type ListHeadWorkerQueryDTO,
} from "../validations/head-worker.validation.js";

const kepalaTukangServices = new HeadWorkerServices();

export class HeadWorkerController {
  async createHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }
      const result = await kepalaTukangServices.createHeadWorker(
        req.currentUser,
        req.validatedBody as CreateHeadWorkerDTO,
      );

      return res.status(201).json({
        message: "Kepala Tukang berhasil dibuat",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const { id } = req.validatedParams as HeadWorkerParamsDTO;

      const result = await kepalaTukangServices.updateHeadWorker(
        req.currentUser,
        id,
        req.validatedBody as UpdateHeadWorkerDTO,
      );

      return res.json({
        message: "Kepala Tukang berhasil diupdate",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const { id } = req.validatedParams as HeadWorkerParamsDTO;

      const result = await kepalaTukangServices.deleteHeadWorker(
        req.currentUser,
        id,
      );

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHeadWorkerById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const { id } = req.validatedParams as HeadWorkerParamsDTO;
      const result = await kepalaTukangServices.getHeadWorkerById(
        req.currentUser,
        id,
      );

      return res.json({
        message: "Data Kepala Tukang berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const result = await kepalaTukangServices.listHeadWorker(
        req.currentUser,
        req.validatedQuery as ListHeadWorkerQueryDTO,
      );

      return res.json({
        message: "Daftar Kepala Tukang berhasil diambil",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listTrashedHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const result = await kepalaTukangServices.listTrashedHeadWorker(
        req.currentUser,
        req.validatedQuery as ListHeadWorkerQueryDTO,
      );

      return res.json({
        message: "Riwayat Kepala Tukang berhasil diambil",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      // Mengikuti pola route kamu: ambil dari validatedParams
      const { id } = req.validatedParams as HeadWorkerParamsDTO;

      const result = await kepalaTukangServices.restoreHeadWorker(
        req.currentUser,
        id,
      );

      return res.json({
        message: "Kepala Tukang berhasil dipulihkan",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async hardDeleteHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const { id } = req.validatedParams as HeadWorkerParamsDTO;

      const result = await kepalaTukangServices.hardDeleteHeadWorker(
        req.currentUser,
        id,
      );

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
