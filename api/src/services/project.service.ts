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
      query.order === "asc" || query.order === "desc"
        ? query.order
        : sortBy === "projectName"
          ? "asc" // Jika nama proyek, otomatis A - Z
          : "desc"; // Jika tanggal, otomatis Terbaru - Terlama

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
        status: query.status
          ? (query.status as ProjectStatus)
          : { in: [ProjectStatus.AKTIF, ProjectStatus.LIBUR] },
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

    const docCount = await prisma.documentation.count({
      where: { projectId: projectId },
    });

    // Jika ada minimal 1 laporan, tolak proses soft delete!
    if (docCount > 0) {
      throw new AppError(
        400,
        "Proyek tidak bisa dihapus karena sudah memiliki riwayat laporan. Harap hapus laporan terlebih dahulu jika ingin menghapus proyek.",
      );
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        deletedAt: new Date(),
      },
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

    await prisma.$transaction(async (tx) => {
      const docCount = await tx.documentation.count({ where: { projectId } });

      if (docCount > 0) {
        throw new AppError(
          400,
          "Project tidak bisa dihapus karena sudah memiliki dokumentasi",
        );
      }

      await prisma.project.delete({
        where: { id: projectId },
      });
    });

    return { message: "Project dihapus permanen" };
  }

  async getProjectDetail(currentUser: IExistingUser, projectId: string) {
    if (
      currentUser.role !== UserRole.MANDOR &&
      currentUser.role !== UserRole.OWNER &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.KEPALA_TUKANG
    ) {
      throw new AppError(
        403,
        "Hanya user yang terdaftar yang bisa melihat detail project",
      );
    }

    // --- LOGIKA ROLE FILTER ---
    let roleFilter = {};
    if (currentUser.role === UserRole.MANDOR) {
      roleFilter = { mandorId: currentUser.id };
    } else if (currentUser.role === UserRole.OWNER) {
      roleFilter = { ownerId: currentUser.id };
    } else if (currentUser.role === UserRole.KEPALA_TUKANG) {
      roleFilter = { kepalaTukang: { some: { id: currentUser.id } } };
    }
    // Jika role === ADMIN, roleFilter tetap kosong {} (Bisa melihat semua)

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        ...roleFilter,
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
        mandorId: true,

        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            mandorId: true,
          },
        },

        kepalaTukang: {
          where: {
            mandorId: {
              not: null,
            },
          },
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
      throw new AppError(
        404,
        "Project tidak ditemukan atau Anda tidak memiliki akses.",
      );
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
              name: true,
              username: true,
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
      throw new AppError(403, "Hanya kepala tukang yang bisa melihat project");
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
      throw new AppError(403, "Hanya mandor yang bisa assign kepala tukang");
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
        "Tidak bisa assign kepala tukang ke project yang sudah selesai",
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
        `kepala tukang tidak valid: ${invalidIds.join(", ")}`,
      );
    }

    const existingIds = project.kepalaTukang.map((w) => w.id);

    const alreadyAssigned = uniqueIds.filter((id) => existingIds.includes(id));
    const newIds = uniqueIds.filter((id) => !existingIds.includes(id));

    if (newIds.length === 0) {
      return {
        message: "Semua kepala tukang sudah terdaftar",
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
          ? "Sebagian kepala tukang berhasil ditambahkan"
          : "Kepala tukang berhasil di-assign",
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
      throw new AppError(403, "Hanya mandor yang bisa unassign kepala tukang");
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
        "Tidak bisa unassign kepala tukang di project yang sudah selesai",
      );
    }

    const existingIds = project.kepalaTukang.map((w) => w.id);

    const uniqueIds = [...new Set(data.kepalaTukangIds)];

    const toRemove = uniqueIds.filter((id) => existingIds.includes(id));

    if (toRemove.length === 0) {
      return {
        message: "Kepala tukang tidak ditemukan di project",
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
      message: "Kepala tukang berhasil di-unassign",
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
      include: { owner: true },
    });

    if (!project) {
      throw new AppError(404, "Proyek tidak ditemukan");
    }

    // PROTEKSI UTAMA: Jika ada owner, cek siapa yang mendaftarkannya
    if (project.owner && project.owner.mandorId !== currentUser.id) {
      throw new AppError(
        403,
        "Anda tidak dapat melepas Klien ini karena Klien didaftarkan oleh Mandor lain.",
      );
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

  async listAllProjectsForAdmin(
    currentUser: IExistingUser,
    query: PaginationQueryDTO,
  ) {
    // 1. Lapisan Keamanan Mutlak: Hanya untuk Admin
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(
        403,
        "Akses ditolak. Hanya Admin yang dapat melihat seluruh daftar proyek di sistem.",
      );
    }

    const { page, limit } = query;
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * limit;

    // 2. Susun aturan pencarian dan pengurutan standar
    const base = this.buildQuery(query);

    // 3. Murni menggunakan properti bawaan antarmuka DTO
    const whereClause: any = {
      ...base.where,
      ...(query.status && { status: query.status }),
    };

    // 4. Ambil data secara paralel untuk efisiensi performa server
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [base.sortBy]: base.order,
        },
        // Ambil relasi yang penting untuk tabel dasbor Admin
        select: {
          id: true,
          projectName: true,
          location: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,

          // Info Mandor Penanggung Jawab saat ini (Penting untuk fitur Transfer Mandor)
          mandor: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              phoneNumber: true,
              address: true,
              createdAt: true,
            },
          },

          // Info Klien Pemilik Rumah
          owner: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              phoneNumber: true,
              address: true,
              createdAt: true,
            },
          },

          // Tambahkan ini: Ambil data ID dan Nama Kepala Tukang untuk UI Tooltip/Hover
          kepalaTukang: {
            where: {
              mandorId: {
                not: null,
              }, // Sinkron dengan _count agar akun scramble tidak ikut terbawa
            },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              phoneNumber: true,
              address: true,
              createdAt: true,
            },
          },

          // Menghitung berapa Kepala Tukang aktif yang sedang ditugaskan di proyek ini
          _count: {
            select: {
              kepalaTukang: {
                where: {
                  mandorId: {
                    not: null,
                  }, // Agar akun scramble tidak ikut terhitung
                },
              },
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
        page: safePage,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
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
        kepalaTukang: { select: { id: true, deletedAt: true } },
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

    // Klasifikasi Kepala Tukang mana yang ikut ditransfer dan mana yang harus dilepas
    const ktsToDisconnect: { id: string }[] = [];
    const ktsToTransfer: string[] = [];

    for (const kt of project.kepalaTukang) {
      if (kt.deletedAt !== null) {
        // SOLUSI BUG 1: Jika KT sudah di-scramble, langsung lepas dari proyek, JANGAN ubah mandorId-nya
        ktsToDisconnect.push({ id: kt.id });
      } else {
        if (!data.keepKepalaTukang) {
          // Admin memilih untuk mengganti/melepas semua KT lama
          ktsToDisconnect.push({ id: kt.id });
        } else {
          // Admin ingin mempertahankan KT. Cek apakah KT ini dipakai di proyek aktif lain oleh Mandor lama?
          const activeProjectsCount = await prisma.project.count({
            where: {
              mandorId: project.mandorId,
              kepalaTukang: { some: { id: kt.id } },
              deletedAt: null, // Hanya hitung proyek yang belum dihapus
            },
          });

          if (activeProjectsCount > 1) {
            // SOLUSI BUG 2: KT sedang dipakai di Proyek A (ini) dan Proyek B (milik mandor lama).
            // Kita harus MELEPAS dia dari proyek ini agar Mandor lama tidak kehilangan dia di Proyek B.
            ktsToDisconnect.push({ id: kt.id });
          } else {
            // KT hanya bertugas murni di proyek ini. Aman untuk dipindahkan ke Mandor baru.
            ktsToTransfer.push(kt.id);
          }
        }
      }
    }

    // c. SOLUSI UNTUK OWNER: Cek apakah Owner masih punya proyek lain dengan mandor lama
    let ownerActiveProjects = -1;
    if (project.ownerId) {
      ownerActiveProjects = await prisma.project.count({
        where: {
          ownerId: project.ownerId,
          mandorId: project.mandorId, // mandor lama
          id: { not: projectId }, // hitung selain proyek yang sedang ditransfer ini
          deletedAt: null,
        },
      });
    }

    // EKSEKUSI TRANSAKSI
    try {
      await prisma.$transaction(async (tx) => {
        // a. Ganti mandorId di tabel Project dan putuskan hubungan dengan KT yang tidak memenuhi syarat
        await tx.project.update({
          where: { id: projectId },
          data: {
            mandorId: data.newMandorId,
            ...(ktsToDisconnect.length > 0 && {
              kepalaTukang: { disconnect: ktsToDisconnect },
            }),
          },
        });

        // b. Update mandorId untuk KT yang benar-benar 100% aman ditransfer (pindah atasan)
        if (ktsToTransfer.length > 0) {
          await tx.user.updateMany({
            where: { id: { in: ktsToTransfer } },
            data: { mandorId: data.newMandorId },
          });
        }

        // Jika Klien tidak punya proyek lain lagi dengan mandor lama,
        // pindahkan "kepemilikan" akun Klien sepenuhnya ke Mandor baru
        if (project.ownerId && ownerActiveProjects === 0) {
          await tx.user.update({
            where: { id: project.ownerId },
            data: { mandorId: data.newMandorId },
          });
        }

        // Jika ownerActiveProjects > 0 (masih ada proyek lain),
        // biarkan saja mandorId-nya. Proyek yang ditransfer toh sudah berganti mandor di langkah (a).
      });
    } catch (error: any) {
      // 3. Terapkan ide UX-mu: Tangkap eror Timeout (P2028) dan suruh coba lagi
      if (error.code === "P2028") {
        throw new AppError(
          503,
          "Server sedang sibuk memproses data yang besar. Silakan coba tekan tombol Transfer lagi dalam beberapa saat.",
        );
      }

      // Lempar eror lain jika bukan masalah timeout
      throw error;
    }

    // Berikan pesan respons dinamis agar Admin tahu hasil pastinya
    let responseMessage = "Mandor proyek berhasil diganti.";
    if (data.keepKepalaTukang) {
      if (ktsToTransfer.length > 0 && ktsToDisconnect.length === 0) {
        responseMessage =
          "Mandor proyek diganti dan seluruh tim Kepala Tukang berhasil dipindahkan ke atasan baru.";
      } else if (ktsToTransfer.length > 0 && ktsToDisconnect.length > 0) {
        responseMessage =
          "Proyek berhasil dipindahkan. Sebagian Kepala Tukang ikut pindah, sebagian ditinggal (dilepas dari proyek ini) karena masih bertugas di proyek mandor lama/dihapus.";
      } else if (project.kepalaTukang.length > 0) {
        responseMessage =
          "Proyek berhasil dipindahkan. Tidak ada Kepala Tukang yang ikut pindah karena mereka masih bertugas di proyek mandor lama.";
      }
    } else {
      responseMessage =
        "Proyek berhasil dipindahkan. Tim Kepala Tukang lama telah dilepas dari proyek sesuai permintaan.";
    }

    return { message: responseMessage };
  }
}
