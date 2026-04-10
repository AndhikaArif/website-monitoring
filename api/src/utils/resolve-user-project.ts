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

  // ✅ HANYA WORKER BIASA
  if (user.worker && user.role === "WORKER") {
    const assignment = await prisma.workerAssignment.findFirst({
      where: {
        workerId: user.worker.id,
        endDate: null,
      },
      include: {
        project: true,
      },
    });

    if (!assignment || assignment.project.status !== ProjectStatus.AKTIF) {
      throw new AppError(400, "Worker tidak punya project aktif");
    }

    return assignment.project.id;
  }

  // ❌ selain worker tidak boleh auto resolve
  throw new AppError(400, "Silakan pilih project terlebih dahulu");
};

// export const resolveUserProject = async (
//   currentUserId: string,
// ): Promise<string> => {
//   const user = await prisma.user.findUnique({
//     where: { id: currentUserId },
//     include: { worker: true },
//   });

//   if (!user) {
//     throw new AppError(404, "User tidak ditemukan");
//   }

//   let project;

//   if (user.worker) {
//     project = await prisma.project.findFirst({
//       where: {
//         headWorkerId: user.worker.id,
//         status: ProjectStatus.AKTIF,
//       },
//     });
//   } else {
//     project = await prisma.project.findFirst({
//       where: {
//         mandorId: user.id,
//         status: ProjectStatus.AKTIF,
//       },
//     });
//   }

//   if (!project) {
//     throw new AppError(400, "User tidak punya project aktif");
//   }

//   return project.id;
// };
