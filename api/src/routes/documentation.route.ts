import { Router } from "express";

import { DocumentationController } from "../controllers/documentation.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { UserRole } from "../generated/prisma/index.js";
import {
  createDocSchema,
  updateDocSchema,
  documentationIdParam,
  paginationQuery,
} from "../validations/documentation.validation.js";

const router = Router();
const controller = new DocumentationController();

// 🔥 CREATE DOCUMENTATION
router.post(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.HEAD_WORKER),
  validate(createDocSchema),
  controller.create,
);

// 🔥 LIST HISTORY (Bisa diakses Mandor & Head Worker)
// Karena roleGuard kamu biasanya hanya satu role, kita biarkan logic internal Service
// yang memfilter (Mandor liat semua, HW liat miliknya),
// tapi tetap pastikan user terautentikasi.
router.get(
  "/",
  AuthMiddleWare.verifyToken,
  validate(paginationQuery, "query"),
  controller.list,
);

// 🔥 GET DETAIL
router.get(
  "/:id",
  AuthMiddleWare.verifyToken,
  validate(documentationIdParam, "params"),
  controller.getById,
);

// 🔥 UPDATE DOCUMENTATION
router.put(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.HEAD_WORKER),
  validate(documentationIdParam, "params"),
  validate(updateDocSchema),
  controller.update,
);

// 🔥 DELETE DOCUMENTATION
router.delete(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.HEAD_WORKER),
  validate(documentationIdParam, "params"),
  controller.delete,
);

export default router;
