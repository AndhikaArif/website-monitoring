import { Router } from "express";

import { DocumentationController } from "../controllers/documentation.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { fileUpload } from "../middlewares/file-upload.middleware.js";
import { UserRole } from "../generated/prisma/index.js";
import {
  createDocSchema,
  updateDocSchema,
  documentationIdParam,
  paginationQuery,
  deleteFileSchema,
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

// 🔥 LIST DOCUMENTATION(LAPORAN HEAD WORKER) (Bisa diakses Mandor & Head Worker)
router.get(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.HEAD_WORKER),
  validate(paginationQuery, "query"),
  controller.list,
);

// 🔥 UPLOAD FILE
router.post(
  "/upload",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.HEAD_WORKER),
  fileUpload().array("files"),
  controller.uploadFile,
);

// 🔥 DELETE FILE SAMPAH (Cleanup jika batal simpan)
router.delete(
  "/upload",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.HEAD_WORKER),
  validate(deleteFileSchema),
  controller.deleteFile,
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
