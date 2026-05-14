import type { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service.js";
import type { UpdateProfileDTO } from "../validations/profile.validation.js";
import { UserRole } from "../generated/prisma/index.js";
import { AppError } from "../errors/app.error.js";

const profileService = new ProfileService();

export class ProfileController {
  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await profileService.getMyProfile(req.currentUser!.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.currentUser!.role === UserRole.ADMIN) {
        throw new AppError(
          403,
          "Admin tidak diizinkan mengubah profil mandiri",
        );
      }

      const updateData = req.validatedBody as UpdateProfileDTO;
      const updatedUser = await profileService.updateProfile(
        req.currentUser!.id,
        updateData,
      );

      res.json({
        message: "Profil berhasil diperbarui",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.validatedBody;
      const result = await profileService.changePassword(
        req.currentUser!.id,
        oldPassword,
        newPassword
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
  */
}
