import { prisma } from "../config/prisma.config.js";
import type {
  AssignHeadWorkerDTO,
  CreateProjectDTO,
  PaginationQueryDTO,
  UpdateProjectDTO,
} from "../validations/project.validation.js";
import { ProjectStatus, UserRole } from "../generated/prisma/index.js";
import type { IExistingUser } from "../types/auth.type.js";
import { AppError } from "../errors/app.error.js";

type SortField = "createdAt" | "projectName" | "startDate" | "status";

const ALLOWED_SORT: SortField[] = [
  "createdAt",
  "projectName",
  "startDate",
  "status",
];

export class ProjectService {
  private buildQuery(query: PaginationQueryDTO) {
    const where = {
      deletedAt: null,
    };

    const sortBy: SortField = ALLOWED_SORT.includes(query.sortBy as SortField)
      ? (query.sortBy as SortField)
      : "createdAt";

    const order: "asc" | "desc" =
      query.order === "asc" || query.order === "desc" ? query.order : "desc";

    return {
      where,
      sortBy,
      order,
    };
  }

  private buildProjectQuery(
    currentUser: IExistingUser,
    query: PaginationQueryDTO,
  ) {
    const base = this.buildQuery(query);

    return {
      whereClause: {
        ...base.where,
        mandorId: currentUser.id,
        ...(query.status && { status: query.status }),
      },
      sortBy: base.sortBy,
      order: base.order,
    };
  }

  private buildAssignedProjectQuery(
    currentUser: IExistingUser,
    query: PaginationQueryDTO,
  ) {
    const base = this.buildQuery(query);

    return {
      whereClause: {
        ...base.where,
        headWorkers: {
          some: {
            id: currentUser.id,
          },
        },
        // Gunakan status dari query jika ada, kalau tidak ada (Semua Status), jangan difilter
        ...(query.status && { status: query.status as ProjectStatus }),
      },
      sortBy: base.sortBy,
      order: base.order,
    };
  }

  async createProject(currentUser: IExistingUser, data: CreateProjectDTO) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa membuat project");
    }

    const project = await prisma.project.create({
      data: {
        projectName: data.projectName,
        location: data.location,
        startDate: new Date(),
        description: data.description || null,
        mandorId: currentUser.id,
        status: ProjectStatus.AKTIF,
      },
    });

    return project;
  }

  async updateProject(
    currentUser: IExistingUser,
    projectId: string,
    data: UpdateProjectDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa update project");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId: currentUser.id,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    if (project.status === ProjectStatus.SELESAI) {
      throw new AppError(400, "Project sudah selesai dan tidak bisa diubah");
    }

    if (Object.keys(data).length === 0) {
      throw new AppError(400, "Tidak ada data yang diupdate");
    }

    // Persiapkan data untuk update
    const updatePayload: any = {
      ...(data.projectName !== undefined && { projectName: data.projectName }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
    };

    // LOGIKA OTOMATIS: Jika status berubah jadi SELESAI, isi endDate
    if (data.status === ProjectStatus.SELESAI) {
      updatePayload.endDate = new Date();
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updatePayload,
    });

    return updated;
  }

  async deleteProject(currentUser: IExistingUser, projectId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa menghapus project");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId: currentUser.id,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    await prisma.$transaction(async (tx) => {
      const docCount = await tx.documentation.count({ where: { projectId } });

      if (docCount > 0) {
        throw new AppError(
          400,
          "Project tidak bisa dihapus karena sudah memiliki dokumentasi",
        );
      }

      await tx.project.update({
        where: { id: projectId },
        data: {
          deletedAt: new Date(),
        },
      });
    });

    return { message: "Project berhasil dihapus" };
  }

  async restoreProject(currentUser: IExistingUser, projectId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa restore project");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId: currentUser.id,
        // cari yang sudah di-delete
        deletedAt: {
          not: null,
        },
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan atau belum dihapus");
    }

    const restored = await prisma.project.update({
      where: { id: projectId },
      data: {
        deletedAt: null,
      },
    });

    return {
      message: "Project berhasil direstore",
      data: restored,
    };
  }

  async hardDeleteProject(currentUser: IExistingUser, projectId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa menghapus permanen");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId: currentUser.id,
        deletedAt: { not: null },
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan di tempat sampah");
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { message: "Project dihapus permanen" };
  }

  async getProjectDetail(currentUser: IExistingUser, projectId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa melihat detail project");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId: currentUser.id,
        deletedAt: null,
      },
      select: {
        id: true,
        projectName: true,
        location: true,
        status: true,
        startDate: true,
        endDate: true,
        description: true,
        createdAt: true,

        headWorkers: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },

        documentations: {
          select: {
            id: true,
            reportDate: true,
            session: true,
          },
          orderBy: {
            reportDate: "desc",
          },
          take: 1,
        },

        _count: {
          select: {
            documentations: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    const latestDoc = project.documentations[0] ?? null;

    return {
      ...project,
      latestDocumentation: latestDoc,
      documentations: undefined,
    };
  }

  async listMyProjects(currentUser: IExistingUser, query: PaginationQueryDTO) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa melihat project");
    }

    const { page, limit } = query;
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * limit;

    const { whereClause, sortBy, order } = this.buildProjectQuery(
      currentUser,
      query,
    );

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
        select: {
          id: true,
          projectName: true,
          location: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      }),

      prisma.project.count({
        where: whereClause,
      }),
    ]);

    return {
      data: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listMyTrashedProjects(
    currentUser: IExistingUser,
    query: PaginationQueryDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(
        403,
        "Hanya mandor yang bisa melihat project terhapus",
      );
    }

    const { page, limit } = query;
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * limit;

    // Kita panggil buildProjectQuery
    const { whereClause, sortBy, order } = this.buildProjectQuery(
      currentUser,
      query,
    );

    // OVERRIDE: Paksa deletedAt menjadi not null untuk halaman sampah
    const trashedWhere = {
      ...whereClause,
      deletedAt: { not: null },
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: trashedWhere,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
        select: {
          id: true,
          projectName: true,
          location: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          deletedAt: true, // Tambah ini agar di UI bisa tahu kapan dihapusnya
        },
      }),

      prisma.project.count({
        where: trashedWhere,
      }),
    ]);

    return {
      data: projects,
      meta: {
        page: safePage,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listAssignedProjects(
    currentUser: IExistingUser,
    query: PaginationQueryDTO,
  ) {
    if (currentUser.role !== UserRole.HEAD_WORKER) {
      throw new AppError(403, "Hanya head worker yang bisa melihat project");
    }

    const { page, limit } = query;
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * limit;

    const { whereClause, sortBy, order } = this.buildAssignedProjectQuery(
      currentUser,
      query,
    );

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          projectName: true,
          location: true,
          status: true,
          startDate: true,
        },
        orderBy: {
          [sortBy]: order,
        },
      }),

      prisma.project.count({
        where: {
          headWorkers: {
            some: {
              id: currentUser.id,
            },
          },
          status: ProjectStatus.AKTIF,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async assignHeadWorker(
    currentUser: IExistingUser,
    projectId: string,
    data: AssignHeadWorkerDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa assign head worker");
    }

    // cek project milik mandor
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId: currentUser.id,
        deletedAt: null,
      },
      select: {
        status: true,
        headWorkers: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    if (project.status === ProjectStatus.SELESAI) {
      throw new AppError(
        400,
        "Tidak bisa assign head worker ke project yang sudah selesai",
      );
    }

    const uniqueIds = [...new Set(data.headWorkerIds)];

    // cek semua user valid & role HEAD_WORKER
    const workers = await prisma.user.findMany({
      where: {
        id: { in: uniqueIds },
        role: UserRole.HEAD_WORKER,
        mandorId: currentUser.id,
        deletedAt: null,
      },
    });

    const foundIds = new Set(workers.map((w) => w.id));

    const invalidIds = uniqueIds.filter((id) => !foundIds.has(id));

    if (invalidIds.length > 0) {
      throw new AppError(
        400,
        `Head worker tidak valid: ${invalidIds.join(", ")}`,
      );
    }

    const existingIds = project.headWorkers.map((w) => w.id);

    const alreadyAssigned = uniqueIds.filter((id) => existingIds.includes(id));
    const newIds = uniqueIds.filter((id) => !existingIds.includes(id));

    if (newIds.length === 0) {
      return {
        message: "Semua head worker sudah terdaftar",
        alreadyAssigned,
      };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        headWorkers: {
          connect: newIds.map((id) => ({ id })),
        },
      },
    });

    return {
      message:
        alreadyAssigned.length > 0
          ? "Sebagian head worker berhasil ditambahkan"
          : "Head worker berhasil di-assign",
      addedCount: newIds.length,
      alreadyAssigned,
    };
  }

  async unassignHeadWorker(
    currentUser: IExistingUser,
    projectId: string,
    data: AssignHeadWorkerDTO,
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa unassign head worker");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        mandorId: currentUser.id,
        deletedAt: null,
      },
      select: {
        status: true,
        headWorkers: { select: { id: true } },
      },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    if (project.status === ProjectStatus.SELESAI) {
      throw new AppError(
        400,
        "Tidak bisa unassign head worker di project yang sudah selesai",
      );
    }

    const existingIds = project.headWorkers.map((w) => w.id);

    const uniqueIds = [...new Set(data.headWorkerIds)];

    const toRemove = uniqueIds.filter((id) => existingIds.includes(id));

    if (toRemove.length === 0) {
      return {
        message: "Head worker tidak ditemukan di project",
      };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        headWorkers: {
          disconnect: toRemove.map((id) => ({ id })),
        },
      },
    });

    return {
      message: "Head worker berhasil di-unassign",
      removed: toRemove,
    };
  }
}
