import { prisma } from "../config/prisma.config.js";
import { AppError } from "../errors/app.error.js";
import cloudinary from "../config/cloudinary.config.js";
import { FileUpload } from "../utils/file-upload.util.js";
import type {
  CreateDocDTO,
  PaginationQueryDTO,
  UpdateDocDTO,
} from "../validations/documentation.validation.js";
import type { IExistingUser } from "../types/auth.type.js";
import { UserRole } from "../generated/prisma/index.js";

type SortField = "reportDate" | "createdAt" | "session";

const ALLOWED_SORT: SortField[] = ["reportDate", "createdAt", "session"];

const uploader = new FileUpload();

export class DocumentationService {
  private parseReportDate(dateString: string): Date {
    const [day, month, year] = dateString.split("-");
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  }

  private buildQueryOptions(query: PaginationQueryDTO) {
    const page = Math.max(query.page || 1, 1);
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const sortBy: SortField = ALLOWED_SORT.includes(query.sortBy as SortField)
      ? (query.sortBy as SortField)
      : "reportDate"; // Default sorting untuk laporan biasanya tanggal kerja

    const order: "asc" | "desc" = query.order === "asc" ? "asc" : "desc";

    return { page, limit, skip, sortBy, order };
  }

  async getByIdAndValidateOwnership(id: string, currentUser: IExistingUser) {
    const doc = await prisma.documentation.findUnique({
      where: { id },
      include: {
        project: { select: { projectName: true, location: true } },
        files: true,
      },
    });

    if (!doc) throw new AppError(404, "Dokumentasi tidak ditemukan");

    // Validasi: Apakah yang akses adalah pembuat aslinya?
    if (
      currentUser.role === "HEAD_WORKER" &&
      doc.createdById !== currentUser.id
    ) {
      throw new AppError(403, "Akses ditolak. Anda bukan pemilik laporan ini.");
    }

    return doc;
  }

  async create(currentUser: IExistingUser, payload: CreateDocDTO) {
    if (currentUser.role !== UserRole.HEAD_WORKER) {
      throw new AppError(
        403,
        "Hanya head worker yang bisa update documentation",
      );
    }

    // SECURITY FIX: Pastikan Head Worker terdaftar di project ini
    const projectAssignment = await prisma.project.findFirst({
      where: {
        id: payload.projectId,
        headWorkers: { some: { id: currentUser.id } },
      },
    });

    if (!projectAssignment) {
      throw new AppError(403, "Anda tidak ditugaskan di project ini.");
    }

    const formattedDate = this.parseReportDate(payload.reportDate);

    // Cek Constraint @@unique: 1 Project, 1 Hari, 1 Sesi = 1 laporan
    const existing = await prisma.documentation.findFirst({
      where: {
        projectId: payload.projectId,
        reportDate: formattedDate,
        session: payload.session,
      },
    });

    if (existing) {
      throw new AppError(
        400,
        `Laporan sesi ${payload.session} untuk tanggal ini sudah dibuat.`,
      );
    }

    await prisma.documentation.create({
      data: {
        reportDate: formattedDate,
        session: payload.session,
        workArea: payload.workArea,
        task: payload.task,
        target: payload.target ?? null,
        progress: payload.progress ?? null,
        createdById: currentUser.id,
        projectId: payload.projectId,

        files: {
          create: payload.files.map((file) => ({
            fileUrl: file.fileUrl,
            cloudinaryId: file.cloudinaryId,
            fileType: file.fileType,
          })),
        },
      },
      include: { files: true },
    });
  }

  async listDocumentationHistory(
    currentUser: IExistingUser,
    query: PaginationQueryDTO,
  ) {
    const allowedRoles: UserRole[] = [UserRole.MANDOR, UserRole.HEAD_WORKER];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new AppError(
        403,
        "Hanya mandor dan head worker yang bisa melihat list...",
      );
    }

    const { page, limit, skip, sortBy, order } = this.buildQueryOptions(query);

    // FIX VISIBILITY: Mandor melihat semua laporan di projectnya, HW melihat miliknya saja
    const whereClause: any = {
      ...(currentUser.role === UserRole.HEAD_WORKER
        ? { createdById: currentUser.id }
        : { project: { mandorId: currentUser.id } }),
      ...(query.status && { project: { status: query.status } }), // Filter status project jika perlu
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.search && {
        OR: [
          { workArea: { contains: query.search, mode: "insensitive" } },
          { task: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [docs, total] = await Promise.all([
      prisma.documentation.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          project: { select: { projectName: true } },
          files: { take: 1 },
          createdBy: { select: { name: true } }, // Mandor perlu tahu siapa yang lapor
        },
      }),
      prisma.documentation.count({ where: whereClause }),
    ]);

    return {
      data: docs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async update(id: string, currentUser: IExistingUser, payload: UpdateDocDTO) {
    if (currentUser.role !== UserRole.HEAD_WORKER) {
      throw new AppError(403, "Hanya head worker yang bisa update dokumentasi");
    }

    // Validasi kepemilikan (Pasti error kalau bukan miliknya)
    const existingDoc = await this.getByIdAndValidateOwnership(id, currentUser);

    // Cek konflik unik jika reportDate atau session diubah
    if (payload.reportDate || payload.session) {
      const newDate = payload.reportDate
        ? this.parseReportDate(payload.reportDate)
        : existingDoc.reportDate;
      const newSession = payload.session ?? existingDoc.session;

      const conflict = await prisma.documentation.findFirst({
        where: {
          projectId: existingDoc.projectId,
          reportDate: newDate,
          session: newSession,
          NOT: { id }, // exclude current doc
        },
      });

      if (conflict) {
        throw new AppError(
          400,
          `Laporan sesi ${newSession} di tanggal tersebut sudah ada`,
        );
      }
    }

    // Logika Update Files (Jika ada file baru yang diunggah)
    if (payload.files && payload.files.length > 0) {
      // 1. Kumpulkan ID file yang ingin dipertahankan oleh frontend
      const idsToKeep = payload.files.map((f) => f.cloudinaryId);

      // 2. Cari file lama yang tidak ada di daftar yang ingin dipertahankan (berarti dihapus user)
      const filesToDelete = existingDoc.files.filter(
        (f) => !idsToKeep.includes(f.cloudinaryId),
      );

      // 3. Hapus HANYA file yang benar-benar dibuang dari Cloudinary
      if (filesToDelete.length > 0) {
        const deletePromises = filesToDelete.map((file) =>
          cloudinary.uploader.destroy(file.cloudinaryId),
        );
        await Promise.all(deletePromises);
      }

      // 4. Reset DB dan masukkan kombinasi file lama & baru
      await prisma.documentationFile.deleteMany({
        where: { documentationId: id },
      });
    }

    // Update data teks
    const { files, reportDate, ...textContent } = payload;

    const cleanData = Object.fromEntries(
      Object.entries(textContent).filter(([_, value]) => value !== undefined),
    );

    return await prisma.documentation.update({
      where: { id },
      data: {
        ...cleanData,
        updatedById: currentUser.id,
        ...(reportDate && { reportDate: this.parseReportDate(reportDate) }),
        ...(files && {
          files: {
            create: files.map((f) => ({
              fileUrl: f.fileUrl,
              cloudinaryId: f.cloudinaryId,
              fileType: f.fileType,
            })),
          },
        }),
      },
      include: { files: true },
    });
  }

  async delete(id: string, currentUser: IExistingUser) {
    if (currentUser.role !== UserRole.HEAD_WORKER) {
      throw new AppError(403, "Hanya head worker yang bisa delete dokumentasi");
    }

    const existingDoc = await this.getByIdAndValidateOwnership(id, currentUser);

    // Hapus semua file terkait di Cloudinary
    const deletePromises = existingDoc.files.map((file) =>
      cloudinary.uploader.destroy(file.cloudinaryId),
    );
    await Promise.all(deletePromises);

    return await prisma.documentation.delete({
      where: { id },
    });
  }

  async uploadFiles(files: Express.Multer.File[]) {
    return await uploader.uploadArray(files);
  }

  async deleteFileFromCloudinary(cloudinaryId: string) {
    return await cloudinary.uploader.destroy(cloudinaryId);
  }
}
