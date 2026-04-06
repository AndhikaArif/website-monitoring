import { prisma } from "../config/prisma.config.js";
import { AppError } from "../errors/app.error.js";
import { ProjectStatus } from "../generated/prisma/index.js";

export const resolveUserProject = async (
  currentUserId: string,
): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: { worker: true },
  });

  if (!user) {
    throw new AppError(404, "User tidak ditemukan");
  }

  let project;

  if (user.worker) {
    project = await prisma.project.findFirst({
      where: {
        headWorkerId: user.worker.id,
        status: ProjectStatus.AKTIF,
      },
    });
  } else {
    project = await prisma.project.findFirst({
      where: {
        mandorId: user.id,
        status: ProjectStatus.AKTIF,
      },
    });
  }

  if (!project) {
    throw new AppError(400, "User tidak punya project aktif");
  }

  return project.id;
};
