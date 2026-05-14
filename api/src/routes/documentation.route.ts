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
  AuthMiddleWare.roleGuard(UserRole.KEPALA_TUKANG),
  validate(createDocSchema),
  controller.create,
);

// 🔥 LIST DOCUMENTATION(LAPORAN HEAD WORKER) (Bisa diakses Mandor, Head Worker, & Owner)
router.get(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(
    UserRole.MANDOR,
    UserRole.KEPALA_TUKANG,
    UserRole.OWNER,
    UserRole.ADMIN,
  ),
  validate(paginationQuery, "query"),
  controller.list,
);

// 🔥 UPLOAD FILE
router.post(
  "/upload",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.KEPALA_TUKANG),
  fileUpload().array("files"),
  controller.uploadFile,
);

// 🔥 DELETE FILE SAMPAH (Cleanup jika batal simpan)
router.delete(
  "/upload",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.KEPALA_TUKANG),
  validate(deleteFileSchema),
  controller.deleteFile,
);

// 🔥 GET DETAIL
router.get(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(
    UserRole.MANDOR,
    UserRole.KEPALA_TUKANG,
    UserRole.OWNER,
    UserRole.ADMIN,
  ),
  validate(documentationIdParam, "params"),
  controller.getById,
);

// 🔥 UPDATE DOCUMENTATION
router.put(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.KEPALA_TUKANG),
  validate(documentationIdParam, "params"),
  validate(updateDocSchema),
  controller.update,
);

// 🔥 DELETE DOCUMENTATION
router.delete(
  "/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.KEPALA_TUKANG),
  validate(documentationIdParam, "params"),
  controller.delete,
);

// 🔥 ADMIN DELETE DOCUMENTATION (Jalur Hapus Darurat/Pembersihan Aset)
router.delete(
  "/admin/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(documentationIdParam, "params"),
  controller.adminDelete,
);

export default router;
