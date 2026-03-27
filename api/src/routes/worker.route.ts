import { Router } from "express";
import { WorkerController } from "../controllers/worker.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  assignWorkerSchema,
  createWorkerSchema,
} from "../validations/worker.validation.js";

const router = Router();
const workerController = new WorkerController();

router.post(
  "/",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard("MANDOR"),
  validate(createWorkerSchema),
  workerController.create,
);

router.post(
  "/assign",
  AuthMiddleWare.verifyToken,
  AuthMiddleWare.roleGuard("MANDOR"),
  validate(assignWorkerSchema),
  workerController.assign,
);

export default router;
