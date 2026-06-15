import express from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { HeadWorkerController } from "../controllers/head-worker.controller.js";
import { validate } from "../middlewares/validation.middleware.js";

import {
  createHeadWorkerSchema,
  updateHeadWorkerSchema,
  kepalaTukangParamsSchema,
  listHeadWorkerQuerySchema,
} from "../validations/head-worker.validation.js";
import { UserRole } from "../generated/prisma/index.js";
import { paginationQuery } from "../validations/project.validation.js";

const router = express.Router();
const kepalaTukangController = new HeadWorkerController();

router.get(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(listHeadWorkerQuerySchema, "query"),
  kepalaTukangController.listHeadWorker,
);

router.get(
  "/trashed",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(paginationQuery, "query"),
  kepalaTukangController.listTrashedHeadWorker,
);

router.post(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(createHeadWorkerSchema),
  kepalaTukangController.createHeadWorker,
);

router.get(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(kepalaTukangParamsSchema, "params"),
  kepalaTukangController.getHeadWorkerById,
);

router.put(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(kepalaTukangParamsSchema, "params"),
  validate(updateHeadWorkerSchema),
  kepalaTukangController.updateHeadWorker,
);

router.delete(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(kepalaTukangParamsSchema, "params"),
  kepalaTukangController.deleteHeadWorker,
);

router.put(
  "/:id/restore",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(kepalaTukangParamsSchema, "params"),
  kepalaTukangController.restoreHeadWorker,
);

router.delete(
  "/:id/hard-delete",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(kepalaTukangParamsSchema, "params"),
  kepalaTukangController.hardDeleteHeadWorker,
);

export default router;
