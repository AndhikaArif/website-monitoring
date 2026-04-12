import { Router } from "express";

import { ProjectController } from "../controllers/project.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { UserRole } from "../generated/prisma/index.js";
import {
  createProjectSchema,
  assignHeadWorkerSchema,
  projectIdParam,
  paginationQuery,
  updateProjectSchema,
} from "../validations/project.validation.js";

const router = Router();
const controller = new ProjectController();

// 🔥 CREATE PROJECT
router.post(
  "/create",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(createProjectSchema),
  controller.create,
);

// 🔥 LIST PROJECT MILIK MANDOR
router.get(
  "/my-projects",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(paginationQuery, "query"),
  controller.listMyProjects,
);

// 🔥 LIST PROJECT MILIK MANDOR YANG SUDAH TERHAPUS
router.get(
  "/trashed",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(paginationQuery, "query"),
  controller.listTrashed,
);

// 🔥 LIST PROJECT HEAD WORKER
router.get(
  "/assigned",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.HEAD_WORKER),
  validate(paginationQuery, "query"),
  controller.listAssignedProjects,
);

// 🔥 GET DETAIL PROJECT
router.get(
  "/:projectId",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  controller.getDetail,
);

// 🔥 UPDATE PROJECT
router.put(
  "/:projectId",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  validate(updateProjectSchema),
  controller.update,
);

// 🔥 DELETE PROJECT
router.delete(
  "/:projectId",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  controller.delete,
);

// 🔥 RESTORE PROJECT
router.put(
  "/:projectId/restore",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  controller.restore,
);

// 🔥 DELETE PERMANEN PROJECT
router.delete(
  "/:projectId/hard-delete",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  controller.hardDelete,
);

// 🔥 ASSIGN HEAD WORKER
router.post(
  "/:projectId/assign",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  validate(assignHeadWorkerSchema),
  controller.assignHeadWorker,
);

// 🔥 UNASSIGN HEAD WORKER
router.post(
  "/:projectId/unassign",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  validate(assignHeadWorkerSchema),
  controller.unassignHeadWorker,
);

export default router;
