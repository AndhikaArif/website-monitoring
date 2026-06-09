export interface Project {
  id: string;
  projectName: string;
  location: string;
  status: "AKTIF" | "LIBUR" | "SELESAI";
  createdAt: string;
  owner?: {
    name: string;
    username: string;
  } | null;
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

export interface ProjectOwner {
  id: string;
  name: string;
  username: string;
  email: string;
  mandorId: string;
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
  mandorId: string;
  kepalaTukang: HeadWorker[];
  owner?: ProjectOwner | null;
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

export interface AdminProject {
  id: string;
  projectName: string;
  location: string;
  status: "AKTIF" | "LIBUR" | "SELESAI";
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  mandor: {
    id: string;
    name: string;
    username: string;
  };
  owner?: {
    id: string;
    name: string;
    username: string;
  } | null;
  kepalaTukang?: {
    id: string;
    name: string;
    username: string;
  }[];
  _count: {
    kepalaTukang: number;
  };
}

export interface AdminProjectResponse {
  data: AdminProject[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Payload untuk endpoint pemindahan Mandor
export interface TransferMandorPayload {
  newMandorId: string;
  keepKepalaTukang: boolean;
}
