import { prisma } from "../config/prisma.config.js";
import type { CreateProjectDTO } from "../validations/project.validation.js";

export class ProjectService {
  async createProject(data: CreateProjectDTO, mandorId: string) {
    return prisma.project.create({
      data: {
        projectName: data.name,
        location: data.location,
        startDate: data.startDate,
        description: data.description ?? null,
        mandorId,
      },
    });
  }
}
