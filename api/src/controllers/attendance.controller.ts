import type { Request, Response, NextFunction } from "express";

import { AttendanceService } from "../services/attendance.service.js";
import { AppError } from "../errors/app.error.js";
import {
  createAttendanceSchema,
  dailyReportSchema,
  weeklyReportSchema,
} from "../validations/attendance.validation.js";

const attendanceService = new AttendanceService();

export class AttendanceController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const { workerId, status } = createAttendanceSchema.parse(req.body);

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

  // daily report per project
  async getDailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const query = dailyReportSchema.parse(req.query);

      const result = await attendanceService.getDailyReport(
        req.currentUser.id,
        query.date,
      );

      res.json({
        message: "Laporan harian berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // weekly report per project
  async getWeeklyProjectReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "Unauthenticated");
      }

      const query = weeklyReportSchema.parse(req.query);

      const result = await attendanceService.getWeeklyProjectReport(
        req.currentUser.id,
        query.date,
      );

      return res.json({
        message: "Laporan mingguan berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
