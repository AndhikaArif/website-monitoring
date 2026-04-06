import { prisma } from "../config/prisma.config.js";
import { AppError } from "../errors/app.error.js";
import {
  AttendanceStatus,
  type Attendance,
} from "../generated/prisma/index.js";
import { resolveUserProject } from "../utils/resolve-user-project.js";

export class AttendanceService {
  private readonly DEFAULT_DAILY_SALARY = 100000;

  private getWeekRange(date: Date) {
    const start = new Date(date);
    const day = start.getDay();

    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return { start, end };
  }

  private async processAttendance(
    workerId: string,
    status: AttendanceStatus,
    projectId: string,
    currentUserId: string,
    today: Date,
  ) {
    try {
      // cek assignment aktif
      const assignment = await prisma.workerAssignment.findFirst({
        where: {
          workerId,
          projectId,
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
      });

      if (!assignment) {
        throw new AppError(400, "Worker tidak aktif di project ini");
      }

      // create
      return await prisma.attendance.create({
        data: {
          workerId,
          projectId,
          date: today,
          status,
          createdById: currentUserId,
        },
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new AppError(400, "Sudah ada attendance hari ini");
      }
      if (error instanceof AppError) throw error;

      throw new AppError(500, error?.message || "Internal server error");
    }
  }

  async createAttendance(
    workerId: string,
    status: AttendanceStatus,
    currentUserId: string,
  ) {
    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const projectId = await resolveUserProject(currentUserId);

    try {
      return await this.processAttendance(
        workerId,
        status,
        projectId,
        currentUserId,
        localToday,
      );
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message || "Internal server error");
    }
  }

  async bulkCreateAttendance(
    attendances: { workerId: string; status: AttendanceStatus }[],
    currentUserId: string,
  ) {
    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const projectId = await resolveUserProject(currentUserId);

    // deduplicate workerId (biar ga double input)
    const uniqueAttendances = Array.from(
      new Map(attendances.map((item) => [item.workerId, item])).values(),
    );

    const results: {
      success: Attendance[];
      failed: { workerId: string; message: string }[];
    } = {
      success: [],
      failed: [],
    };

    for (const item of uniqueAttendances) {
      try {
        const created = await this.processAttendance(
          item.workerId,
          item.status,
          projectId,
          currentUserId,
          localToday,
        );

        results.success.push(created);
      } catch (error: any) {
        results.failed.push({
          workerId: item.workerId,
          message:
            error instanceof AppError ? error.message : "Terjadi kesalahan",
        });
      }
    }

    return results;
  }

  // daily report per project
  async getDailyReport(currentUserId: string, date?: string) {
    const baseDate = date ? new Date(date) : new Date();

    if (isNaN(baseDate.getTime())) {
      throw new AppError(400, "Format tanggal tidak valid");
    }
    baseDate.setHours(0, 0, 0, 0);

    const projectId = await resolveUserProject(currentUserId);

    const start = new Date(baseDate);
    const end = new Date(baseDate);
    end.setDate(end.getDate() + 1);

    // ambil summary
    const summary = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        projectId,
        date: {
          gte: start,
          lt: end,
        },
      },
      _count: {
        status: true,
      },
    });

    // format biar rapi
    const result: Record<AttendanceStatus, number> = {
      HADIR: 0,
      IZIN: 0,
      ALPHA: 0,
    };

    for (const item of summary) {
      result[item.status] = item._count.status;
    }

    return {
      date: baseDate,
      projectId,
      summary: result,
    };
  }

  // Weekly report per Project
  async getWeeklyProjectReport(currentUserId: string, date?: string) {
    const baseDate = date ? new Date(date) : new Date();

    if (isNaN(baseDate.getTime())) {
      throw new AppError(400, "Format tanggal tidak valid");
    }

    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const { start, end } = this.getWeekRange(baseDate);

    const projectId = await resolveUserProject(currentUserId);

    // 🔥 ambil semua worker aktif di project
    const workers = await prisma.workerAssignment.findMany({
      where: {
        projectId,
        OR: [{ endDate: null }, { endDate: { gte: localToday } }],
      },
      include: {
        worker: true,
      },
    });

    const workerIds = workers.map((w) => w.workerId);

    if (workerIds.length === 0) {
      return {
        projectId,
        week: { start, end },
        totalWorker: 0,
        data: [],
      };
    }

    // 🔥 ambil semua attendance sekaligus
    const attendances = await prisma.attendance.findMany({
      where: {
        projectId,
        workerId: { in: workerIds },
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    const holidays = await prisma.projectHoliday.findMany({
      where: {
        projectId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    // 🔥 grouping per worker
    const reportMap: Record<string, Record<AttendanceStatus, number>> = {};

    for (const w of workerIds) {
      reportMap[w] = { HADIR: 0, IZIN: 0, ALPHA: 0 };
    }

    for (const att of attendances) {
      const workerSummary =
        reportMap[att.workerId] ??
        (reportMap[att.workerId] = { HADIR: 0, IZIN: 0, ALPHA: 0 });

      workerSummary[att.status]++;
    }

    const uniqueHolidayDates = new Set(
      holidays.map((h) => new Date(h.date).toDateString()),
    );

    const holidayCount = uniqueHolidayDates.size;

    // 🔥 format output
    const result = workers.map((w) => {
      const rawSummary = reportMap[w.workerId] ?? {
        HADIR: 0,
        IZIN: 0,
        ALPHA: 0,
      };

      const totalDays = Math.max(0, 7 - holidayCount);
      const recordedDays =
        rawSummary.HADIR + rawSummary.IZIN + rawSummary.ALPHA;

      const missingDays = Math.max(0, totalDays - recordedDays);

      // 🔥 final summary (alpha ditambah missing)
      const summary = {
        HADIR: rawSummary.HADIR,
        IZIN: rawSummary.IZIN,
        ALPHA: rawSummary.ALPHA + missingDays,
      };

      const dailySalary = w.worker.dailySalary ?? this.DEFAULT_DAILY_SALARY;

      const totalSalary = summary.HADIR * dailySalary;

      return {
        workerId: w.workerId,
        workerName: w.worker.name,
        summary,
        workingDays: totalDays,
        holidayCount,
        recordedDays,
        missingDays,
        totalSalary,
      };
    });

    return {
      projectId,
      week: {
        start,
        end,
        label: `${start.toDateString()} - ${end.toDateString()}`,
      },
      holidayCount,
      holidays,
      totalWorker: result.length,
      data: result,
    };
  }
}
