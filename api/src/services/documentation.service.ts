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

type SortField = "reportDate" | "uploadedAt" | "session";

const ALLOWED_SORT: SortField[] = ["reportDate", "uploadedAt", "session"];

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
        project: {
          select: {
            projectName: true,
            location: true,
            mandorId: true,
            ownerId: true,
            // pengecekan daftar kepala tukang di proyek ini
            kepalaTukang: { select: { id: true, name: true, username: true } },
          },
        },
        files: true,
        createdBy: { select: { name: true, username: true } },
      },
    });

    if (!doc) throw new AppError(404, "Dokumentasi tidak ditemukan");

    if (currentUser.role === UserRole.ADMIN) return doc;

    if (currentUser.role === UserRole.KEPALA_TUKANG) {
      const isAssignedToProject = doc.project.kepalaTukang.some(
        (worker) => worker.id === currentUser.id,
      );
      if (!isAssignedToProject) {
        throw new AppError(
          403,
          "Akses ditolak. Anda tidak ditugaskan di proyek ini.",
        );
      }
    }

    if (
      currentUser.role === UserRole.OWNER &&
      doc.project.ownerId !== currentUser.id
    ) {
      throw new AppError(
        403,
        "Akses ditolak. Ini bukan laporan dari proyek Anda.",
      );
    }

    if (
      currentUser.role === UserRole.MANDOR &&
      doc.project.mandorId !== currentUser.id
    ) {
      throw new AppError(
        403,
        "Akses ditolak. Proyek ini bukan di bawah pengawasan Anda.",
      );
    }

    return doc;
  }

  async create(currentUser: IExistingUser, payload: CreateDocDTO) {
    if (currentUser.role !== UserRole.KEPALA_TUKANG) {
      throw new AppError(
        403,
        "Hanya kepala tukang yang bisa update documentation",
      );
    }

    // SECURITY FIX: Pastikan Kepala Tukang terdaftar di project ini
    const projectAssignment = await prisma.project.findFirst({
      where: {
        id: payload.projectId,
        kepalaTukang: { some: { id: currentUser.id } },
      },
    });

    if (!projectAssignment) {
      throw new AppError(403, "Anda tidak ditugaskan di project ini.");
    }

    const formattedDate = this.parseReportDate(payload.reportDate);

    // 🎯 VALIDASI BARU (KEBAL TIMEZONE SERVER): Selalu patokan pada Waktu Indonesia Barat
    const now = new Date();
    const wibFormatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta", // Paksa jadi Waktu Indonesia
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Format id-ID menghasilkan "DD/MM/YYYY" (contoh: 19/05/2026)
    const [wibDay, wibMonth, wibYear] = wibFormatter.format(now).split("/");
    const todayNumber = parseInt(`${wibYear}${wibMonth}${wibDay}`); // Hasil: 20260519

    // Tanggal dari FE
    const [reqDay, reqMonth, reqYear] = payload.reportDate.split("-");
    const requestDateNumber = parseInt(`${reqYear}${reqMonth}${reqDay}`);

    if (requestDateNumber > todayNumber) {
      throw new AppError(
        400,
        "Tidak dapat membuat laporan untuk tanggal di masa depan. Harap masukkan tanggal hari ini atau sebelumnya.",
      );
    }

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
    const allowedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.MANDOR,
      UserRole.KEPALA_TUKANG,
      UserRole.OWNER,
    ];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new AppError(403, "Akses ditolak untuk role Anda.");
    }

    const { page, limit, skip, sortBy, order } = this.buildQueryOptions(query);

    // Tentukan filter dasar (Visibility/Penglihatan) berdasarkan Role
    let roleFilter = {};
    if (currentUser.role === UserRole.ADMIN) {
      roleFilter = {}; // Admin tidak difilter (Melihat Semua)
    } else if (currentUser.role === UserRole.KEPALA_TUKANG) {
      roleFilter = {
        project: {
          kepalaTukang: {
            some: { id: currentUser.id },
          },
        },
      }; // Kepala Tukang bisa melihat SEMUA laporan di proyek tempat dia ditugaskan saat ini
    } else if (currentUser.role === UserRole.MANDOR) {
      roleFilter = { project: { mandorId: currentUser.id } }; // Mandor lihat semua di bawah dia
    } else if (currentUser.role === UserRole.OWNER) {
      roleFilter = { project: { ownerId: currentUser.id } }; // Klien cuma lihat laporan dari rumahnya
    }

    let searchDate: Date | undefined;
    if (query.search) {
      // Memeriksa apakah pengguna mengetik format DD-MM-YYYY
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (dateRegex.test(query.search)) {
        try {
          // Konversi teks menjadi objek Date menggunakan fungsi bantuan milikmu
          searchDate = this.parseReportDate(query.search);
        } catch (e) {
          // Abaikan secara diam-diam jika terjadi kegagalan parsing
        }
      }
    }

    const whereClause: any = {
      ...roleFilter,
      ...(query.status && { project: { status: query.status } }), // Filter status project jika perlu
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.search && {
        OR: [
          { workArea: { contains: query.search, mode: "insensitive" } },
          { task: { contains: query.search, mode: "insensitive" } },
          ...(searchDate ? [{ reportDate: searchDate }] : []),
        ],
      }),
    };

    let prismaOrderBy: any;

    if (sortBy === "reportDate") {
      // Jika disortir berdasarkan tanggal, terapkan urutan 3 lapis yang rapi
      prismaOrderBy = [
        { reportDate: order }, // Lapis 1: Tanggal (desc / terbaru di atas)
        { project: { projectName: "asc" } }, // Lapis 2: Kelompokkan per Proyek/Rumah dulu (Penyelamat untuk Admin!)        { createdBy: { name: "asc" } }, // Lapis 2: Kelompokkan orang yang sama (Sesuai abjad)
        { session: "asc" }, // Lapis 3: PAGI (P) selalu di kiri, SORE (S) di kanan
      ];
    } else {
      // Jika disortir berdasarkan kolom lain (misal: uploadedAt)
      prismaOrderBy = { [sortBy]: order };
    }

    const [docs, total] = await Promise.all([
      prisma.documentation.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: prismaOrderBy,
        include: {
          project: { select: { projectName: true } },
          files: true,
          createdBy: { select: { id: true, name: true, username: true } }, // Mandor perlu tahu siapa yang lapor
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
    if (currentUser.role !== UserRole.KEPALA_TUKANG) {
      throw new AppError(
        403,
        "Hanya kepala tukang yang bisa update dokumentasi",
      );
    }

    // 1. Ambil dokumen (Fungsi ini sekarang meloloskan asalkan user satu proyek)
    const existingDoc = await this.getByIdAndValidateOwnership(id, currentUser);

    // GEMBOK KEPEMILIKAN MUTLAK UNTUK UPDATE
    if (existingDoc.createdById !== currentUser.id) {
      throw new AppError(
        403,
        "Akses modifikasi ditolak. Anda hanya diizinkan mengedit laporan yang Anda buat sendiri.",
      );
    }

    // TIME-BASED LOCK: Batas edit maksimal 24 jam (86.400.000 ms)
    const timeElapsed = Date.now() - new Date(existingDoc.uploadedAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (timeElapsed > TWENTY_FOUR_HOURS) {
      throw new AppError(
        403,
        "Batas waktu modifikasi habis. Laporan yang sudah melewati 1x24 jam telah dikunci permanen oleh sistem.",
      );
    }

    // Cek konflik unik jika reportDate atau session diubah
    if (payload.reportDate || payload.session) {
      const newDate = payload.reportDate
        ? this.parseReportDate(payload.reportDate)
        : existingDoc.reportDate;

      // 🎯 VALIDASI UPDATE (KEBAL TIMEZONE):
      if (payload.reportDate) {
        const now = new Date();
        const wibFormatter = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        const [wibDay, wibMonth, wibYear] = wibFormatter.format(now).split("/");
        const todayNumber = parseInt(`${wibYear}${wibMonth}${wibDay}`);

        const [reqDay, reqMonth, reqYear] = payload.reportDate.split("-");
        const requestDateNumber = parseInt(`${reqYear}${reqMonth}${reqDay}`);

        if (requestDateNumber > todayNumber) {
          throw new AppError(
            400,
            "Tidak dapat mengubah laporan ke tanggal di masa depan.",
          );
        }
      }

      const newSession = payload.session ?? existingDoc.session;

      const conflict = await prisma.documentation.findFirst({
        where: {
          projectId: existingDoc.projectId,
          reportDate: newDate,
          session: newSession,
          createdById: currentUser.id,
          NOT: { id }, // Abaikan baris dokumen yang sedang diedit
        },
      });

      if (conflict) {
        throw new AppError(
          400,
          `Laporan sesi ${newSession} di tanggal tersebut sudah ada`,
        );
      }
    }

    // Hapus dari Cloudinary, wipe relasi DB, lalu recreate
    if (payload.files && payload.files.length > 0) {
      const idsToKeep = payload.files.map((f) => f.cloudinaryId);
      const filesToDelete = existingDoc.files.filter(
        (f) => !idsToKeep.includes(f.cloudinaryId),
      );

      if (filesToDelete.length > 0) {
        const deletePromises = filesToDelete.map((file) =>
          cloudinary.uploader.destroy(file.cloudinaryId),
        );
        await Promise.all(deletePromises);
      }

      await prisma.documentationFile.deleteMany({
        where: { documentationId: id },
      });
    }

    const { files, reportDate, ...textContent } = payload;
    const cleanData = Object.fromEntries(
      Object.entries(textContent).filter(([_, value]) => value !== undefined),
    );

    return await prisma.documentation.update({
      where: { id },
      data: {
        ...cleanData,
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
    if (currentUser.role !== UserRole.KEPALA_TUKANG) {
      throw new AppError(
        403,
        "Hanya kepala tukang yang bisa delete dokumentasi",
      );
    }

    const existingDoc = await this.getByIdAndValidateOwnership(id, currentUser);

    // GEMBOK KEPEMILIKAN MUTLAK UNTUK DELETE
    if (existingDoc.createdById !== currentUser.id) {
      throw new AppError(
        403,
        "Akses hapus ditolak. Laporan ini milik rekan kerja Anda dan tidak dapat Anda hapus.",
      );
    }

    // TIME-BASED LOCK: Mencegah penghapusan laporan yang sudah lama
    const timeElapsed = Date.now() - new Date(existingDoc.uploadedAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (timeElapsed > TWENTY_FOUR_HOURS) {
      throw new AppError(
        403,
        "Laporan tidak dapat dihapus karena telah melewati batas waktu 1x24 jam sejak diunggah.",
      );
    }

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

  async deleteFileFromCloudinary(
    cloudinaryId: string,
    fileType?: "VIDEO" | "PHOTO",
  ) {
    // 🎯 Langsung panggil utilitasnya, karena try-catch sudah ada di dalam uploader
    return await uploader.deleteFromCloudinary(cloudinaryId, fileType);
  }

  // --- FUNGSI DARURAT KHUSUS ADMIN ---

  async adminDeleteDocumentation(id: string, currentUser: IExistingUser) {
    // 1. Lapisan Keamanan Mutlak: Hanya untuk Admin
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(
        403,
        "Akses ditolak. Hanya Admin yang memiliki wewenang untuk menghapus sepihak arsip dokumentasi sistem.",
      );
    }

    // 2. Cari dokumen target beserta lampiran file di dalamnya
    const existingDoc = await prisma.documentation.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!existingDoc) {
      throw new AppError(404, "Arsip dokumentasi target tidak ditemukan.");
    }

    // 3. Bersihkan aset berat (Foto/Video) dari server Cloudinary terlebih dahulu
    if (existingDoc.files && existingDoc.files.length > 0) {
      const deletePromises = existingDoc.files.map((file) =>
        cloudinary.uploader.destroy(file.cloudinaryId),
      );
      await Promise.all(deletePromises);
    }

    // 4. Hapus baris induk dari PostgreSQL
    // (Baris data di tabel DocumentationFile akan otomatis lenyap berkat aturan onDelete: Cascade)
    await prisma.documentation.delete({
      where: { id },
    });

    return {
      message:
        "Arsip dokumentasi beserta lampiran fisiknya berhasil dihapus oleh Admin.",
    };
  }
}
