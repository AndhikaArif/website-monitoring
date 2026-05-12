import { prisma } from "../config/prisma.config.js";
import type {
  AssignHeadWorkerDTO,
  AssignOwnerDTO,
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
        kepalaTukang: {
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
    if (
      currentUser.role !== UserRole.MANDOR &&
      currentUser.role !== UserRole.OWNER
    ) {
      throw new AppError(
        403,
        "Hanya mandor dan klien yang bisa melihat detail project",
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        // Jika yang akses mandor, pastikan mandorId cocok. Jika klien, pastikan ownerId cocok.
        ...(currentUser.role === UserRole.MANDOR
          ? { mandorId: currentUser.id }
          : { ownerId: currentUser.id }),
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

        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },

        kepalaTukang: {
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
          owner: {
            select: {
              username: true,
              email: true,
            },
          },
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
    if (currentUser.role !== UserRole.KEPALA_TUKANG) {
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
          kepalaTukang: {
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

  async listOwnerProjects(
    currentUser: IExistingUser,
    query: PaginationQueryDTO,
  ) {
    if (currentUser.role !== UserRole.OWNER) {
      throw new AppError(
        403,
        "Hanya klien yang bisa melihat daftar project ini",
      );
    }

    const { page, limit } = query;
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * limit;

    const base = this.buildQuery(query);

    const whereClause = {
      ...base.where, // { deletedAt: null }
      ownerId: currentUser.id, // Hanya project milik Klien ini
      ...(query.status && { status: query.status }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [base.sortBy]: base.order },
        select: {
          id: true,
          projectName: true,
          location: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.project.count({ where: whereClause }),
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
        kepalaTukang: {
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

    const uniqueIds = [...new Set(data.kepalaTukangIds)];

    // cek semua user valid & role KEPALA_TUKANG
    const workers = await prisma.user.findMany({
      where: {
        id: { in: uniqueIds },
        role: UserRole.KEPALA_TUKANG,
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

    const existingIds = project.kepalaTukang.map((w) => w.id);

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
        kepalaTukang: {
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
        kepalaTukang: { select: { id: true } },
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

    const existingIds = project.kepalaTukang.map((w) => w.id);

    const uniqueIds = [...new Set(data.kepalaTukangIds)];

    const toRemove = uniqueIds.filter((id) => existingIds.includes(id));

    if (toRemove.length === 0) {
      return {
        message: "Head worker tidak ditemukan di project",
      };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        kepalaTukang: {
          disconnect: toRemove.map((id) => ({ id })),
        },
      },
    });

    return {
      message: "Head worker berhasil di-unassign",
      removed: toRemove,
    };
  }

  // --- FUNGSI BARU UNTUK KLIEN / OWNER ---

  async assignOwner(
    currentUser: IExistingUser,
    projectId: string,
    data: AssignOwnerDTO, // Hanya menerima 1 ID (karena 1 rumah = 1 klien)
  ) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa assign klien ke proyek");
    }

    // 1. Cek apakah proyek ini milik mandor
    const project = await prisma.project.findFirst({
      where: { id: projectId, mandorId: currentUser.id, deletedAt: null },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    if (project.status === ProjectStatus.SELESAI) {
      throw new AppError(
        400,
        "Tidak bisa ubah klien di proyek yang sudah selesai",
      );
    }

    // 2. Cek apakah owner valid & milik mandor ini
    const owner = await prisma.user.findFirst({
      where: {
        id: data.ownerId,
        role: UserRole.OWNER,
        mandorId: currentUser.id,
        deletedAt: null,
      },
    });

    if (!owner) {
      throw new AppError(
        404,
        "Data klien (owner) tidak valid atau tidak ditemukan",
      );
    }

    // 3. Update ownerId di tabel Project
    await prisma.project.update({
      where: { id: projectId },
      data: { ownerId: owner.id },
    });

    return { message: "Klien berhasil di-assign ke proyek ini" };
  }

  async unassignOwner(currentUser: IExistingUser, projectId: string) {
    if (currentUser.role !== UserRole.MANDOR) {
      throw new AppError(403, "Hanya mandor yang bisa unassign klien");
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, mandorId: currentUser.id, deletedAt: null },
    });

    if (!project) {
      throw new AppError(404, "Project tidak ditemukan");
    }

    if (project.status === ProjectStatus.SELESAI) {
      throw new AppError(
        400,
        "Tidak bisa unassign klien di proyek yang sudah selesai",
      );
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { ownerId: null }, // Kosongkan ownerId
    });

    return { message: "Klien berhasil di-unassign dari proyek" };
  }

  async adminTransferProjectMandor(
    currentUser: IExistingUser,
    projectId: string,
    data: {
      newMandorId: string;
      keepKepalaTukang: boolean; // Opsi dari admin apakah Kepala Tukang lama dipertahankan
    },
  ) {
    // 1. Validasi Akses: Hanya Admin
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(403, "Hanya admin yang bisa mengganti mandor proyek");
    }

    // 2. Cari Proyek beserta relasi Kepala Tukang di dalamnya
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        kepalaTukang: { select: { id: true } },
      },
    });

    if (!project) {
      throw new AppError(404, "Proyek tidak ditemukan");
    }

    if (project.mandorId === data.newMandorId) {
      throw new AppError(
        400,
        "Mandor baru yang dipilih sama dengan mandor saat ini",
      );
    }

    // 3. Pastikan Mandor pengganti adalah valid dan role-nya benar MANDOR
    const targetMandor = await prisma.user.findFirst({
      where: {
        id: data.newMandorId,
        role: UserRole.MANDOR,
        deletedAt: null,
      },
    });

    if (!targetMandor) {
      throw new AppError(
        404,
        "Mandor pengganti tidak valid atau tidak ditemukan",
      );
    }

    // 4. EKSEKUSI TRANSAKSI
    await prisma.$transaction(async (tx) => {
      // Poin 3: Ganti mandorId di tabel Project (Dokumentasi & Owner otomatis aman karena tidak disentuh)
      await tx.project.update({
        where: { id: projectId },
        data: { mandorId: data.newMandorId },
      });

      // Poin 4: Jika Mandor baru ingin menggunakan Kepala Tukang sebelumnya,
      // ubah atasan (mandorId) para Kepala Tukang tersebut menjadi Mandor yang baru.
      if (data.keepKepalaTukang && project.kepalaTukang.length > 0) {
        const kepalaTukangIds = project.kepalaTukang.map((kt) => kt.id);

        await tx.user.updateMany({
          where: {
            id: { in: kepalaTukangIds },
            role: UserRole.KEPALA_TUKANG, // Pastikan ekstra aman
          },
          data: { mandorId: data.newMandorId },
        });
      } else if (!data.keepKepalaTukang && project.kepalaTukang.length > 0) {
        // (Opsional) Jika Admin memilih TIDAK mempertahankan Kepala Tukang,
        // putuskan relasi Kepala Tukang lama dari Proyek ini agar Mandor baru bisa pilih timnya sendiri.
        const targetDisconnects = project.kepalaTukang.map((kt) => ({
          id: kt.id,
        }));

        await tx.project.update({
          where: { id: projectId },
          data: {
            kepalaTukang: { disconnect: targetDisconnects },
          },
        });
      }
    });

    return {
      message: data.keepKepalaTukang
        ? "Mandor proyek berhasil diganti dan tim Kepala Tukang lama resmi dipindahtugaskan ke Mandor baru."
        : "Mandor proyek berhasil diganti. Tim Kepala Tukang lama telah dilepas dari proyek.",
    };
  }
}
