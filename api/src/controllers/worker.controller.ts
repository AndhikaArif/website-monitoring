import type { Request, Response, NextFunction } from "express";

import { WorkerService } from "../services/worker.service.js";
import { AppError } from "../errors/app.error.js";

const workerService = new WorkerService();

export class WorkerController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const mandorId = req.currentUser!.id;

      const worker = await workerService.createWorker(req.body, mandorId);

      return res.status(201).json({
        message: "Worker berhasil dibuat",
        data: worker,
      });
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }
      const mandorId = req.currentUser!.id;

      const result = await workerService.assignWorker(req.body, mandorId);

      return res.status(201).json({
        message: "Worker berhasil di-assign ke project",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
