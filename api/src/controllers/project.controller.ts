import type { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/project.service.js";
import { AppError } from "../errors/app.error.js";
import { createProjectSchema } from "../validations/project.validation.js";

const projectService = new ProjectService();

export class ProjectController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProjectSchema.safeParse(req.body);

      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const mandorId = req.currentUser.id;

      const project = await projectService.createProject(req.body, mandorId);

      return res.status(201).json({
        message: "Project berhasil dibuat",
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
}
