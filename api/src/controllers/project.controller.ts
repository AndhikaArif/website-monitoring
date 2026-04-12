import type { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/project.service.js";
import { AppError } from "../errors/app.error.js";
import type {
  AssignHeadWorkerDTO,
  CreateProjectDTO,
  PaginationQueryDTO,
  ProjectIdParamDTO,
  UpdateProjectDTO,
} from "../validations/project.validation.js";

const projectService = new ProjectService();

export class ProjectController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const project = await projectService.createProject(
        req.currentUser,
        req.validatedBody as CreateProjectDTO,
      );

      res.status(201).json({
        message: "Project berhasil dibuat",
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const { projectId } = req.validatedParams as ProjectIdParamDTO;

      const project = await projectService.updateProject(
        req.currentUser,
        projectId,
        req.validatedBody as UpdateProjectDTO,
      );

      res.json({
        message: "Project berhasil diupdate",
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const { projectId } = req.validatedParams as ProjectIdParamDTO;

      const result = await projectService.deleteProject(
        req.currentUser,
        projectId,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const { projectId } = req.validatedParams as ProjectIdParamDTO;

      const result = await projectService.restoreProject(
        req.currentUser,
        projectId,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async hardDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.validatedParams as ProjectIdParamDTO;
      const result = await projectService.hardDeleteProject(
        req.currentUser!,
        projectId,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const { projectId } = req.validatedParams as ProjectIdParamDTO;

      const project = await projectService.getProjectDetail(
        req.currentUser,
        projectId,
      );

      res.json({
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async listMyProjects(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const projects = await projectService.listMyProjects(
        req.currentUser,
        req.validatedQuery as PaginationQueryDTO,
      );

      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  async listTrashed(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const query = req.validatedQuery as PaginationQueryDTO;

      const result = await projectService.listMyTrashedProjects(
        req.currentUser,
        query,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listAssignedProjects(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const projects = await projectService.listAssignedProjects(
        req.currentUser,
        req.validatedQuery as PaginationQueryDTO,
      );

      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  async assignHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const { projectId } = req.validatedParams as ProjectIdParamDTO;

      const result = await projectService.assignHeadWorker(
        req.currentUser,
        projectId,
        req.validatedBody as AssignHeadWorkerDTO,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async unassignHeadWorker(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthenticated");

      const { projectId } = req.validatedParams as ProjectIdParamDTO;

      const result = await projectService.unassignHeadWorker(
        req.currentUser,
        projectId,
        req.validatedBody as AssignHeadWorkerDTO,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
