import express from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { OwnerController } from "../controllers/owner.controller.js";
import { validate } from "../middlewares/validation.middleware.js";

import {
  createOwnerSchema,
  updateOwnerSchema,
  ownerParamsSchema,
  listOwnerQuerySchema,
} from "../validations/owner.validation.js";
import { UserRole } from "../generated/prisma/index.js";

const router = express.Router();
const ownerController = new OwnerController();

router.get(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(listOwnerQuerySchema, "query"),
  ownerController.listOwner,
);

router.get(
  "/trashed",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(listOwnerQuerySchema, "query"),
  ownerController.listTrashedOwner,
);

router.post(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(createOwnerSchema),
  ownerController.createOwner,
);

router.get(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(ownerParamsSchema, "params"),
  ownerController.getOwnerById,
);

router.put(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(ownerParamsSchema, "params"),
  validate(updateOwnerSchema),
  ownerController.updateOwner,
);

router.delete(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(ownerParamsSchema, "params"),
  ownerController.deleteOwner,
);

router.put(
  "/:id/restore",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(ownerParamsSchema, "params"),
  ownerController.restoreOwner,
);

router.delete(
  "/:id/hard-delete",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(ownerParamsSchema, "params"),
  ownerController.hardDeleteOwner,
);

export default router;
