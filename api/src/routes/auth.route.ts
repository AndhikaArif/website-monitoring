import express from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { AuthController } from "../controllers/auth.controller.js";

const router = express.Router();
const authController = new AuthController();

router.post(
  "/mandor",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard("ADMIN"),
  authController.createMandor,
);
router.post("/login", authController.login);

router.get("/logout", AuthMiddleWare.verifyToken, authController.logout);

export default router;
