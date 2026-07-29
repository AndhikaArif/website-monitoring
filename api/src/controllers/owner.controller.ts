import type { Request, Response, NextFunction } from "express";

import { OwnerServices } from "../services/owner.service.js";
import { AppError } from "../errors/app.error.js";
import {
  type CreateOwnerDTO,
  type UpdateOwnerDTO,
  type OwnerParamsDTO,
  type ListOwnerQueryDTO,
} from "../validations/owner.validation.js";

const ownerServices = new OwnerServices();

export class OwnerController {
  async createOwner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }
      const result = await ownerServices.createOwner(
        req.currentUser,
        req.validatedBody as CreateOwnerDTO,
      );

      return res.status(201).json({
        message: "Owner berhasil dibuat",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOwner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const { id } = req.validatedParams as OwnerParamsDTO;

      const result = await ownerServices.updateOwner(
        req.currentUser,
        id,
        req.validatedBody as UpdateOwnerDTO,
      );

      return res.json({
        message: "Owner berhasil diupdate",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOwner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const { id } = req.validatedParams as OwnerParamsDTO;

      const result = await ownerServices.deleteOwner(req.currentUser, id);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getOwnerById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const { id } = req.validatedParams as OwnerParamsDTO;
      const result = await ownerServices.getOwnerById(req.currentUser, id);

      return res.json({
        message: "Data Owner berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listOwner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthorized");
      }

      const result = await ownerServices.listOwner(
        req.currentUser,
        req.validatedQuery as ListOwnerQueryDTO,
      );

      return res.json({
        message: "List Owner berhasil diambil",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listTrashedOwner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const result = await ownerServices.listTrashedOwner(
        req.currentUser,
        req.validatedQuery as ListOwnerQueryDTO,
      );

      return res.json({
        message: "List Riwayat Owner berhasil diambil",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreOwner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const { id } = req.validatedParams as OwnerParamsDTO;

      const result = await ownerServices.restoreOwner(req.currentUser, id);

      return res.json({
        message: "Owner berhasil dipulihkan",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async hardDeleteOwner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) throw new AppError(401, "Unauthorized");

      const { id } = req.validatedParams as OwnerParamsDTO;

      const result = await ownerServices.hardDeleteOwner(req.currentUser, id);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
