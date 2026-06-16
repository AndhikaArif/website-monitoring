import { Router } from "express";

import { ProjectController } from "../controllers/project.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { UserRole } from "../generated/prisma/index.js";
import {
  createProjectSchema,
  assignHeadWorkerSchema,
  assignOwnerSchema,
  projectIdParam,
  paginationQuery,
  updateProjectSchema,
  adminTransferMandorSchema,
  adminUpdateProjectStatusSchema,
  scheduleHolidaySchema,
  deleteHolidayParamSchema,
  bulkDeleteHolidaysSchema,
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
  AuthMiddleWare.roleGuard(UserRole.KEPALA_TUKANG),
  validate(paginationQuery, "query"),
  controller.listAssignedProjects,
);

// 🔥 LIST PROJECT MILIK OWNER (KLIEN)
router.get(
  "/owned",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.OWNER),
  validate(paginationQuery, "query"),
  controller.listOwnerProjects,
);

// 🔥 LIST PROJECT UNTUK ADMIN
router.get(
  "/admin/all",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(paginationQuery, "query"),
  controller.listAllProjectsForAdmin,
);

// 🔥 ADMIN TRANSFER MANDOR
router.post(
  "/transfer-mandor/:projectId",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(projectIdParam, "params"),
  validate(adminTransferMandorSchema),
  controller.adminTransferMandor,
);

// 🔥 ADMIN UBAH STATUS PROJECT
router.patch(
  "/:projectId/status",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(projectIdParam, "params"),
  validate(adminUpdateProjectStatusSchema),
  controller.adminUpdateStatus,
);
// --------------------------------------------------------

// 🔥 GET DETAIL PROJECT
router.get(
  "/:projectId",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(
    UserRole.MANDOR,
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.KEPALA_TUKANG,
  ),
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

// 🔥 ASSIGN OWNER
router.post(
  "/:projectId/assign-owner",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  validate(assignOwnerSchema),
  controller.assignOwner,
);

// 🔥 UNASSIGN OWNER
router.post(
  "/:projectId/unassign-owner",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR),
  validate(projectIdParam, "params"),
  // Tidak pakai validate body di sini karena endpoint ini tidak mengirimkan data apa-apa (cukup memanggil ID project di params)
  controller.unassignOwner,
);

// 🔥 SCHEDULE HOLIDAY (Set Libur Project)
router.post(
  "/:projectId/holidays",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(projectIdParam, "params"),
  validate(scheduleHolidaySchema),
  controller.scheduleHoliday,
);

// 🔥 BULK DELETE HOLIDAYS (Hapus Hari Libur Massal)
router.delete(
  "/:projectId/holidays/bulk",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(projectIdParam, "params"),
  validate(bulkDeleteHolidaysSchema, "body"), // Validasi body untuk array tanggal
  controller.bulkDeleteProjectHolidays,
);

// 🔥 DELETE HOLIDAY (Hapus Hari Libur Tertentu)
router.delete(
  "/:projectId/holidays/:dateString",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.MANDOR, UserRole.ADMIN),
  validate(deleteHolidayParamSchema, "params"),
  controller.deleteProjectHoliday,
);

export default router;
