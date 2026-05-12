import type { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service.js";
import type { UpdateProfileDTO } from "../validations/profile.validation.js";

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
