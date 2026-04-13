import multer from "multer";
import fs from "fs";
import path from "path";
import { AppError } from "../errors/app.error.js";

export function fileUpload() {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), "public");

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix =
          "POJOK" + "-" + Math.round(Math.random() * 1e9) + Date.now();

        const ext = path.extname(file.originalname).toLowerCase();

        const fileName =
          file.fieldname.toUpperCase() + "-" + uniqueSuffix + ext;

        cb(null, fileName);
      },
    }),
    limits: {
      fileSize: 1024 * 1024 * 50, // 50MB
      files: 50,
    },
    fileFilter: (req, file, cb) => {
      const allowedExt = [".jpg", ".jpeg", ".png", ".gif", ".mp4"];
      const ext = path.extname(file.originalname).toLowerCase();

      if (!allowedExt.includes(ext)) {
        return cb(
          new AppError(
            400,
            "Invalid file type. Only JPG, JPEG, PNG, GIF, and MP4 are allowed",
          ),
        );
      }

      cb(null, true);
    },
  });
}
