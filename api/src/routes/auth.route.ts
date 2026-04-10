import express from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.middleware.js";

import {
  createMandorSchema,
  updateMandorSchema,
  loginSchema,
  mandorParamsSchema,
  listMandorQuerySchema,
} from "../validations/auth.validation.js";
import { UserRole } from "../generated/prisma/index.js";

const router = express.Router();
const authController = new AuthController();

router.get(
  "/mandor",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(listMandorQuerySchema, "query"),
  authController.listMandor,
);

router.get(
  "/mandor/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(mandorParamsSchema, "params"),
  authController.getMandorById,
);

router.post(
  "/mandor",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(createMandorSchema),
  authController.createMandor,
);

router.put(
  "/mandor/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(mandorParamsSchema, "params"),
  validate(updateMandorSchema),
  authController.updateMandor,
);

router.delete(
  "/mandor/:id",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard(UserRole.ADMIN),
  validate(mandorParamsSchema, "params"),
  authController.deleteMandor,
);

router.post("/login", validate(loginSchema), authController.login);

router.post("/logout", AuthMiddleWare.verifyToken, authController.logout);

export default router;
