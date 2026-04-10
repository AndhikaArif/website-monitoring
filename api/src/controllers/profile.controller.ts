import type { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service.js";

const profileService = new ProfileService();

export class ProfileController {
  async getMe(req: Request, res: Response) {
    const user = await profileService.getMyProfile(req.currentUser!.id);

    return res.json(user);
  }
}
