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
            createdAt: true,
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

    // Pastikan Kepala Tukang terdaftar di project ini
    const projectAssignment = await prisma.project.findFirst({
      where: {
        id: payload.projectId,
        kepalaTukang: { some: { id: currentUser.id } },
      },
      select: {
        id: true,
        createdAt: true, //  Ambil tanggal dibuatnya proyek dari DB
      },
    });

    if (!projectAssignment) {
      throw new AppError(403, "Anda tidak ditugaskan di project ini.");
    }

    const formattedDate = this.parseReportDate(payload.reportDate);

    // Mencegah laporan sebelum proyek dimulai
    const projectStartDate = new Date(projectAssignment.createdAt);
    projectStartDate.setUTCHours(0, 0, 0, 0); // Set ke jam 00:00 agar perbandingan adil per hari

    if (formattedDate < projectStartDate) {
      throw new AppError(
        400,
        "Tidak dapat membuat laporan untuk tanggal sebelum proyek resmi didaftarkan/dimulai.",
      );
    }

    // (KEBAL TIMEZONE SERVER): Selalu patokan pada Waktu Indonesia Barat
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

    const totalFiles = payload.files?.length ?? 0;

    if (totalFiles < 4) {
      throw new AppError(
        400,
        `Anda mencoba menyimpan ${totalFiles} file, batas minimal adalah 4 file per laporan.`,
      );
    }

    if (totalFiles > 20) {
      throw new AppError(
        400,
        `Batas maksimal tercapai. Anda mencoba menyimpan ${totalFiles} file, batas maksimal adalah 20 file per laporan.`,
      );
    }

    // Cek Constraint @@unique: 1 Project, 1 Hari, 1 Sesi = 1 laporan
    const existing = await prisma.documentation.findFirst({
      where: {
        projectId: payload.projectId,
        reportDate: formattedDate,
        session: payload.session,
        createdById: currentUser.id,
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

    const sortBy = ALLOWED_SORT.includes(query.sortBy as SortField)
      ? (query.sortBy as SortField)
      : "reportDate";
    const order = query.order === "asc" ? "asc" : "desc";

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

    // Tentukan rentang waktu jika frontend mengirim parameter bulan dan tahun
    let dateRangeFilter = {};

    if (query.month && query.year) {
      // JavaScript menghitung bulan dari 0 (0 = Januari, 5 = Juni)
      const targetMonth = Number(query.month) - 1;
      const targetYear = Number(query.year);

      // Tanggal 1 di bulan tersebut, jam 00:00:00
      const startDate = new Date(targetYear, targetMonth, 1);

      // Tanggal terakhir di bulan tersebut (menggunakan 0 di parameter hari akan menghasilkan hari terakhir bulan sebelumnya)
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      // Tambahkan filter ini untuk Prisma
      dateRangeFilter = {
        reportDate: {
          gte: startDate,
          lte: endDate,
        },
      };
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
      ...dateRangeFilter,
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
        orderBy: prismaOrderBy,
        include: {
          project: { select: { projectName: true } },
          files: true,
          createdBy: { select: { id: true, name: true, username: true } }, // Mandor perlu tahu siapa yang lapor
        },
      }),
      prisma.documentation.count({ where: whereClause }),
    ]);

    // Pengelompokan berdasarkan tanggal
    const groupedDocsMap = new Map();

    docs.forEach((doc) => {
      // Ambil format YYYY-MM-DD sebagai referensi pengelompokan
      const dateString = doc.reportDate.toISOString().split("T")[0];

      // Kunci unik gabungan agar data tidak tercampur jika melihat banyak proyek sekaligus
      const groupKey = `${doc.projectId}_${dateString}`;

      // Jika wadah untuk tanggal ini belum ada, buat struktur dasarnya
      if (!groupedDocsMap.has(groupKey)) {
        groupedDocsMap.set(groupKey, {
          projectId: doc.projectId,
          projectName: doc.project.projectName,
          reportDate: doc.reportDate,
          sessions: {
            PAGI: [],
            SORE: [],
          },
          // TRACKING: Mengetahui kondisi asli data di Database
          existingSessions: {
            PAGI: false,
            SORE: false,
          },
        });
      }

      // Masukkan detail dokumen ke dalam slot sesi yang sesuai (PAGI atau SORE)
      groupedDocsMap.get(groupKey).sessions[doc.session].push(doc);

      // Karena dokumen ini lolos filter pencarian, otomatis statusnya ADA di DB
      groupedDocsMap.get(groupKey).existingSessions[doc.session] = true;
    });

    // Jika user sedang melakukan pencarian teks, perkaya info data asli dari DB
    if (query.search && docs.length > 0) {
      const uniquePairs = Array.from(groupedDocsMap.values()).map((g) => ({
        projectId: g.projectId,
        reportDate: g.reportDate,
      }));

      // Tarik info sesi apa saja yang sebenarnya eksis di DB untuk tanggal-tanggal yang COCOK ini
      const realSessions = await prisma.documentation.findMany({
        where: {
          OR: uniquePairs.map((p) => ({
            projectId: p.projectId,
            reportDate: p.reportDate,
          })),
        },
        select: {
          projectId: true,
          reportDate: true,
          session: true,
        },
      });

      // Tandai true jika sesinya memang ada di DB asli
      realSessions.forEach((rs) => {
        const dateString = rs.reportDate.toISOString().split("T")[0];
        const groupKey = `${rs.projectId}_${dateString}`;
        if (groupedDocsMap.has(groupKey)) {
          groupedDocsMap.get(groupKey).existingSessions[rs.session] = true;
        }
      });
    } else if (!query.search) {
      // Jika tidak sedang searching, kondisi asli DB pasti sama dengan panjang array hasil filter
      groupedDocsMap.forEach((group) => {
        group.existingSessions.PAGI = group.sessions.PAGI.length > 0;
        group.existingSessions.SORE = group.sessions.SORE.length > 0;
      });
    }

    // Ubah kembali Map menjadi bentuk Array untuk dikirim ke frontend
    const finalGroupedData = Array.from(groupedDocsMap.values());

    return {
      data: finalGroupedData,
      meta: { total },
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

      //  VALIDASI UPDATE (KEBAL TIMEZONE):
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

        // Mencegah update ke tanggal masa depan
        if (requestDateNumber > todayNumber) {
          throw new AppError(
            400,
            "Tidak dapat mengubah laporan ke tanggal di masa depan.",
          );
        }

        // Mencegah update ke tanggal sebelum proyek dimulai
        const projectStartDate = new Date(existingDoc.project.createdAt);
        projectStartDate.setUTCHours(0, 0, 0, 0);

        if (newDate < projectStartDate) {
          throw new AppError(
            400,
            "Tidak dapat mengubah laporan ke tanggal sebelum proyek resmi didaftarkan/dimulai.",
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

    const totalFiles = payload.files?.length ?? 0;

    if (totalFiles < 4) {
      throw new AppError(
        400,
        `Anda mencoba menyimpan ${totalFiles} file, batas minimal adalah 4 file per laporan.`,
      );
    }

    if (totalFiles > 20) {
      throw new AppError(
        400,
        `Batas maksimal tercapai. Anda mencoba menyimpan ${totalFiles} file, batas maksimal adalah 20 file per laporan.`,
      );
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
      throw new AppError(403, "Hanya kepala tukang yang bisa hapus laporan");
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

    const deletedDoc = await prisma.documentation.delete({
      where: { id },
    });

    // Hapus semua file terkait di Cloudinary
    if (existingDoc.files && existingDoc.files.length > 0) {
      try {
        const deletePromises = existingDoc.files.map((file) =>
          cloudinary.uploader.destroy(file.cloudinaryId),
        );
        await Promise.all(deletePromises);
      } catch (error) {
        // Jika Cloudinary gagal/timeout, tangkap errornya agar tidak menggagalkan response sukses
        console.error(
          `[Cloudinary Cleanup Error] Gagal menghapus aset untuk laporan ${id}:`,
          error,
        );
      }
    }

    return deletedDoc;
  }

  async uploadFiles(files: Express.Multer.File[]) {
    return await uploader.uploadArray(files);
  }

  async deleteFileFromCloudinary(
    cloudinaryId: string,
    fileType?: "VIDEO" | "PHOTO",
  ) {
    // Langsung panggil utilitasnya, karena try-catch sudah ada di dalam uploader
    return await uploader.deleteFromCloudinary(cloudinaryId, fileType);
  }

  async adminDeleteDocumentation(id: string, currentUser: IExistingUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new AppError(
        403,
        "Akses ditolak. Hanya Admin yang memiliki wewenang untuk menghapus sepihak laporan sistem.",
      );
    }

    // Cari laporan target beserta lampiran file di dalamnya
    const existingDoc = await prisma.documentation.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!existingDoc) {
      throw new AppError(404, "Laporan target tidak ditemukan.");
    }

    // (Aturan onDelete: Cascade akan otomatis menghapus relasi di tabel DocumentationFile)
    await prisma.documentation.delete({
      where: { id },
    });

    // Bersihkan aset berat (Foto/Video) dari server Cloudinary terlebih dahulu
    if (existingDoc.files && existingDoc.files.length > 0) {
      try {
        const deletePromises = existingDoc.files.map((file) =>
          cloudinary.uploader.destroy(file.cloudinaryId),
        );
        await Promise.all(deletePromises);
      } catch (error) {
        // Tangkap error pihak ketiga agar alur aplikasi untuk admin tetap berjalan lancar
        console.error(
          `[Cloudinary Admin Cleanup Error] Gagal menghapus aset untuk dokumen ${id}:`,
          error,
        );
      }
    }

    return {
      message: "Laporan beserta dokumentasinya berhasil dihapus oleh Admin.",
    };
  }
}
