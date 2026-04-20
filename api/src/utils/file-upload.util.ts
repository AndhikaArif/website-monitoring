import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";

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

      // 🔥 OPTIMASI CLOUDINARY
      // Kita generate URL yang sudah dikompres otomatis oleh Cloudinary (f_auto, q_auto)
      const optimizedUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: uploadResult.resource_type,
        fetch_format: "auto", // Otomatis diubah ke WebP/AVIF sesuai browser
        quality: "auto", // Otomatis dikompres ukurannya
        secure: true, // Pastikan pakai HTTPS
      });

      return {
        url: optimizedUrl,
        cloudinaryId: uploadResult.public_id,
        fileType: uploadResult.resource_type === "video" ? "VIDEO" : "PHOTO",
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
}
