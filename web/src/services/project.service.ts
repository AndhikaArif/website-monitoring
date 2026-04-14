import axios from "axios";
import {
  CreateProjectPayload,
  ProjectResponse,
  ProjectDetailResponse,
  AssignedProjectResponse,
} from "../types/project.type";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

export const getMyProjects = async (
  page = 1,
  limit = 10,
  status = "",
  sortBy = "createdAt",
  order = "desc",
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status && { status }),
    sortBy,
    order,
  });

  const res = await axios.get<ProjectResponse>(
    `${API_URL}/api/project/my-projects?${params}`,
    { withCredentials: true },
  );

  return res.data;
};

export const getMyTrashedProjects = async (
  page = 1,
  limit = 10,
  status = "",
  sortBy = "createdAt",
  order = "desc",
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status && { status }),
    sortBy,
    order,
  });

  const res = await axios.get<ProjectResponse>(
    `${API_URL}/api/project/trashed?${params}`,
    { withCredentials: true },
  );

  return res.data;
};

export const createProject = async (data: CreateProjectPayload) => {
  const res = await axios.post(`${API_URL}/api/project/create`, data, {
    withCredentials: true,
  });
  return res.data;
};

export const updateProject = async (id: string, data: CreateProjectPayload) => {
  const res = await axios.put(`${API_URL}/api/project/${id}`, data, {
    withCredentials: true,
  });
  return res.data;
};

export const getProjectDetail = async (
  id: string,
): Promise<ProjectDetailResponse> => {
  const res = await axios.get<ProjectDetailResponse>(
    `${API_URL}/api/project/${id}`,
    { withCredentials: true },
  );
  return res.data;
};

export const deleteProject = async (id: string) => {
  const res = await axios.delete(`${API_URL}/api/project/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

export const restoreProject = async (id: string) => {
  const res = await axios.put(
    `${API_URL}/api/project/${id}/restore`,
    {}, // Body kosong karena hanya butuh ID di params
    { withCredentials: true },
  );
  return res.data;
};

export const hardDeleteProject = async (id: string) => {
  const res = await axios.delete(`${API_URL}/api/project/${id}/hard-delete`, {
    withCredentials: true,
  });
  return res.data;
};

export const assignHeadWorker = async (
  projectId: string,
  data: { headWorkerIds: string[] },
) => {
  const res = await axios.post(
    `${API_URL}/api/project/${projectId}/assign`,
    data,
    { withCredentials: true },
  );
  return res.data;
};

export const unassignHeadWorker = async (
  projectId: string,
  data: { headWorkerIds: string[] },
) => {
  const res = await axios.post(
    `${API_URL}/api/project/${projectId}/unassign`,
    data,
    { withCredentials: true },
  );
  return res.data;
};

export const getAssignedProjects = async (
  page = 1,
  limit = 10,
  status = "",
  sortBy = "startDate",
  order = "desc",
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status && { status }),
    sortBy,
    order,
  });

  const res = await axios.get<AssignedProjectResponse>(
    `${API_URL}/api/project/assigned`,
    {
      params, // Axios otomatis handle query string jika pakai field params
      withCredentials: true,
    },
  );

  return res.data;
};
