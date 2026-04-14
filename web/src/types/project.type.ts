export interface Project {
  id: string;
  projectName: string;
  location: string;
  status: "AKTIF" | "LIBUR" | "SELESAI";
  createdAt: string;
}

export interface CreateProjectPayload {
  projectName: string;
  location: string;
  description?: string | null;
}

export interface ProjectResponse {
  data: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HeadWorker {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface LatestDocumentation {
  id: string;
  reportDate: string;
  session: string;
}

export interface ProjectDetail {
  id: string;
  projectName: string;
  location: string;
  status: "AKTIF" | "LIBUR" | "SELESAI";
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  createdAt: string;
  headWorkers: HeadWorker[];
  latestDocumentation?: LatestDocumentation | null;
  _count: {
    documentations: number;
  };
}

// Response wrapper jika API membungkusnya dalam objek 'data'
export interface ProjectDetailResponse {
  data: ProjectDetail;
  message?: string;
}

export interface AssignedProject {
  id: string;
  projectName: string;
  location: string;
  status: "AKTIF" | "LIBUR" | "SELESAI";
  startDate: string;
}

export interface AssignedProjectResponse {
  data: AssignedProject[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
