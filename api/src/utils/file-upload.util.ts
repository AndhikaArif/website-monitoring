import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";
import { AppError } from "../errors/app.error.js";

// Buat interface untuk hasil balikan Cloudinary biar rapi
export interface ICloudinaryResponse {
  url: string;
  cloudinaryId: string;
  fileType: "VIDEO" | "PHOTO";
}

export class FileUpload {
  async uploadToCloudinary(filePath: string): Promise<ICloudinaryResponse> {
    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
        folder: "documentation_project",
      });

      const isVideo = uploadResult.resource_type === "video";
      let finalUrl = "";

      if (isVideo) {
        // 🔥 OPTIMASI UNTUK VIDEO:
        // Tambahkan ".mp4" di belakang public_id agar browser mengenali formatnya
        finalUrl = cloudinary.url(`${uploadResult.public_id}.mp4`, {
          resource_type: "video",
          secure: true, // Pastikan pakai HTTPS
        });
      } else {
        // 🔥 OPTIMASI UNTUK GAMBAR:
        // Tetap pertahankan kompresi otomatis Cloudinary
        finalUrl = cloudinary.url(uploadResult.public_id, {
          resource_type: "image",
          fetch_format: "auto", // Otomatis diubah ke WebP/AVIF sesuai browser
          quality: "auto", // Otomatis dikompres ukurannya
          secure: true,
        });
      }

      return {
        url: finalUrl,
        cloudinaryId: uploadResult.public_id,
        fileType: isVideo ? "VIDEO" : "PHOTO",
      };
    } catch (error) {
      throw error;
    } finally {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Failed to delete local file:", err);
      }
    }
  }

  async uploadSingle(filePath: string): Promise<ICloudinaryResponse> {
    return await this.uploadToCloudinary(filePath);
  }

  // Pastikan kembaliannya adalah array dari object ICloudinaryResponse
  async uploadArray(
    files: Express.Multer.File[],
  ): Promise<ICloudinaryResponse[]> {
    return Promise.all(
      files.map((file) => {
        return this.uploadToCloudinary(file.path);
      }),
    );
  }

  // Menyesuaikan tipe Record untuk menampung array of object
  async uploadFields(fields: Record<string, Express.Multer.File[]>) {
    const result: Record<string, ICloudinaryResponse[]> = {};

    for (const fieldName in fields) {
      const files = fields[fieldName];

      // Tambah pengecekan length biar lebih aman
      if (!files || files.length === 0) continue;

      result[fieldName] = await this.uploadArray(files);
    }

    return result;
  }

  async deleteFromCloudinary(
    cloudinaryId: string,
    fileType: "VIDEO" | "PHOTO" = "PHOTO",
  ): Promise<void> {
    try {
      // Penentu maut agar Video bisa ikut terhapus!
      const resourceType = fileType === "VIDEO" ? "video" : "image";

      const result = await cloudinary.uploader.destroy(cloudinaryId, {
        resource_type: resourceType,
        invalidate: true, // Bersihkan CDN Cache global
      });

      if (result.result !== "ok" && result.result !== "not found") {
        console.warn("Peringatan dari Cloudinary:", result);
      }
    } catch (error) {
      console.error("Gagal menghapus file dari Cloudinary:", error);
      throw new AppError(
        500,
        "Terjadi kesalahan saat menghapus file di penyimpanan awan.",
      );
    }
  }
}
