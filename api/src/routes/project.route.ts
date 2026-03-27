import { Router } from "express";
import { ProjectController } from "../controllers/project.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createProjectSchema } from "../validations/project.validation.js";

const router = Router();
const projectController = new ProjectController();

router.post(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard("MANDOR"),
  validate(createProjectSchema),
  projectController.create,
);

export default router;
