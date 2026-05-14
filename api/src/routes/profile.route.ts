import { Router } from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { ProfileController } from "../controllers/profile.controller.js";
import { updateProfileSchema } from "../validations/profile.validation.js";

const profileController = new ProfileController();
const router = Router();

router.use(AuthMiddleWare.verifyToken);

// 🔥 GET PROFIL SENDIRI
router.get("/me", profileController.getMe);

// 🔥 UPDATE PROFIL
router.put(
  "/update",
  validate(updateProfileSchema),
  profileController.updateProfile,
);

/*
// 🔥 GANTI PASSWORD (Komen sementara)
router.put(
  "/change-password",
  validate(changePasswordSchema),
  profileController.changePassword
);
*/

export default router;
