import { Router } from "express";
import { AttendanceController } from "../controllers/attendance.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createAttendanceSchema,
  bulkAttendanceSchema,
} from "../validations/attendance.validation.js";

const router = Router();
const attendanceController = new AttendanceController();

router.post(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard("HEAD_WORKER", "MANDOR"),
  validate(createAttendanceSchema),
  attendanceController.create,
);

router.post(
  "/bulk",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard("HEAD_WORKER", "MANDOR"),
  validate(bulkAttendanceSchema),
  attendanceController.bulkCreate,
);

export default router;
