import cron from "node-cron";
import { prisma } from "../config/prisma.config.js";
import cloudinary from "../config/cloudinary.config.js";

export function initOrphanedFilesCron() {
  // ⏳ Aturan Waktu: Berjalan setiap jam 02:00 pagi ("0 2 * * *")
  cron.schedule("0 2 * * *", async () => {
    console.log(
      "🧹 [Cron Job] Memulai pemindaian file yatim piatu di Cloudinary...",
    );

    try {
      // 1. Ambil daftar file dari Cloudinary menggunakan Admin API
      // (Bisa disesuaikan jika kamu menyimpan aset di folder spesifik, misal: prefix: "monitoring/")
      const result = await cloudinary.api.resources({
        type: "upload",
        max_results: 500,
      });

      const cloudFiles = result.resources || [];
      if (cloudFiles.length === 0) return;

      // 2. Saring file yang umurnya SUDAH LEBIH dari 24 jam
      // (File yang baru diupload beberapa menit lalu tidak boleh dihapus karena mungkin user sedang mengisi form)
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - TWENTY_FOUR_HOURS;

      const oldCloudFiles = cloudFiles.filter(
        (file: any) => new Date(file.created_at).getTime() < cutoffTime,
      );

      if (oldCloudFiles.length === 0) {
        console.log(
          "✨ [Cron Job] Server penyimpanan bersih. Tidak ada file lama terdeteksi.",
        );
        return;
      }

      // 3. Ambil SELURUH cloudinaryId yang tercatat sah di database PostgreSQL kita
      const dbFiles = await prisma.documentationFile.findMany({
        select: { cloudinaryId: true },
      });
      const validDbIds = new Set(dbFiles.map((f) => f.cloudinaryId));

      // 4. Deteksi "Yatim Piatu": Ada di Cloudinary lama, tapi ID-nya tidak ada di DB
      const orphanedFiles = oldCloudFiles.filter(
        (file: any) => !validDbIds.has(file.public_id),
      );

      // 5. Eksekusi Pembumihangusan Massal
      if (orphanedFiles.length > 0) {
        const deletePromises = orphanedFiles.map((file: any) =>
          cloudinary.uploader.destroy(file.public_id),
        );
        await Promise.all(deletePromises);

        console.log(
          `✅ [Cron Job] Sukses membersihkan ${orphanedFiles.length} file sampah abadi dari Cloudinary.`,
        );
      } else {
        console.log(
          "✨ [Cron Job] Pemindaian selesai. Seluruh file cloud memiliki referensi DB yang sah.",
        );
      }
    } catch (error) {
      console.error(
        "❌ [Cron Job] Gagal mengeksekusi pembersihan otomatis:",
        error,
      );
    }
  });
}
