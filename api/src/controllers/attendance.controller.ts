import type { Request, Response, NextFunction } from "express";

import { AttendanceService } from "../services/attendance.service.js";
import { AppError } from "../errors/app.error.js";

const attendanceService = new AttendanceService();

export class AttendanceController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const { workerId, status } = req.body;

      const result = await attendanceService.createAttendance(
        workerId,
        status,
        req.currentUser.id,
      );

      return res.status(201).json({
        message: "Attendance berhasil dibuat",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const result = await attendanceService.bulkCreateAttendance(
        req.body.attendances,
        req.currentUser.id,
      );

      return res.status(201).json({
        message: "Bulk attendance selesai",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
