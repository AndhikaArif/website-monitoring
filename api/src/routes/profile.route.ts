import { Router } from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { ProfileController } from "../controllers/profile.controller.js";

const profileController = new ProfileController();

const router = Router();

router.get("/me", AuthMiddleWare.verifyToken, profileController.getMe);

export default router;
