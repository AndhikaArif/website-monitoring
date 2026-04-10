import express from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { HeadWorkerController } from "../controllers/head-worker.controller.js";
import { validate } from "../middlewares/validation.middleware.js";

import {
  createHeadWorkerSchema,
  updateHeadWorkerSchema,
  headWorkerParamsSchema,
  listHeadWorkerQuerySchema,
} from "../validations/head-worker.validation.js";
import { UserRole } from "../generated/prisma/index.js";

const router = express.Router();
const headWorkerController = new HeadWorkerController();

router.get(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(listHeadWorkerQuerySchema, "query"),
  headWorkerController.listHeadWorker,
);

router.get(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(headWorkerParamsSchema, "params"),
  headWorkerController.getHeadWorkerById,
);

router.post(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(createHeadWorkerSchema),
  headWorkerController.createHeadWorker,
);

router.put(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(headWorkerParamsSchema, "params"),
  validate(updateHeadWorkerSchema),
  headWorkerController.updateHeadWorker,
);

router.delete(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(headWorkerParamsSchema, "params"),
  headWorkerController.deleteHeadWorker,
);

export default router;
