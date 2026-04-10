import type { Request, Response, NextFunction } from "express";

import { HeadWorkerServices } from "../services/head-worker.service.js";
import { AppError } from "../errors/app.error.js";
import {
  type CreateHeadWorkerDTO,
  type UpdateHeadWorkerDTO,
  type HeadWorkerParamsDTO,
  type ListHeadWorkerQueryDTO,
} from "../validations/head-worker.validation.js";

const headWorkerServices = new HeadWorkerServices();

export class HeadWorkerController {
  async createHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }
      const result = await headWorkerServices.createHeadWorker(
        req.currentUser,
        req.validatedBody as CreateHeadWorkerDTO,
      );

      return res.status(201).json({
        message: "HeadWorker berhasil dibuat",
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

      const result = await headWorkerServices.updateHeadWorker(
        req.currentUser,
        id,
        req.validatedBody as UpdateHeadWorkerDTO,
      );

      return res.json({
        message: "HeadWorker berhasil diupdate",
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

      const result = await headWorkerServices.deleteHeadWorker(
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
      const result = await headWorkerServices.getHeadWorkerById(
        req.currentUser,
        id,
      );

      return res.json({
        message: "Data HeadWorker berhasil diambil",
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

      const result = await headWorkerServices.listHeadWorker(
        req.currentUser,
        req.validatedQuery as ListHeadWorkerQueryDTO,
      );

      return res.json({
        message: "List Head Worker berhasil diambil",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
