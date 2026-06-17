import axios from "axios";
import {
  HeadWorkerResponse,
  UpdateHeadWorkerPayload,
} from "../types/head-worker.type";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

export const getHeadWorkers = async (
  page = 1,
  limit = 10,
  mandorId?: string,
) => {
  const params: { page: number; limit: number; mandorId?: string } = {
    page,
    limit,
  };

  if (mandorId) {
    params.mandorId = mandorId;
  }

  const res = await axios.get<HeadWorkerResponse>(
    `${API_URL}/api/head-worker`,
    {
      params,
      withCredentials: true,
    },
  );

  console.log("FETCH URL:", res);

  return res.data;
};

export const getHeadWorkerById = async (id: string) => {
  const res = await axios.get(`${API_URL}/api/head-worker/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateHeadWorker = async (
  id: string,
  data: UpdateHeadWorkerPayload,
) => {
  const res = await axios.put(`${API_URL}/api/head-worker/${id}`, data, {
    withCredentials: true,
  });
  return res.data;
};

export const deleteHeadWorker = async (id: string) => {
  await axios.delete(`${API_URL}/api/head-worker/${id}`, {
    withCredentials: true,
  });
};

export const getTrashedHeadWorkers = (
  page = 1,
  limit = 10,
  mandorId?: string,
) => {
  const params: { page: number; limit: number; mandorId?: string } = {
    page,
    limit,
  };

  // Jika mandorId ada (Admin memilih filter), masukkan ke query params
  if (mandorId) {
    params.mandorId = mandorId;
  }

  return axios
    .get(`${API_URL}/api/head-worker/trashed`, {
      params,
      withCredentials: true,
    })
    .then((res) => res.data);
};

export const restoreHeadWorker = (id: string) =>
  axios.put(
    `${API_URL}/api/head-worker/${id}/restore`,
    {},
    { withCredentials: true },
  );

export const hardDeleteHeadWorker = (id: string) =>
  axios.delete(`${API_URL}/api/head-worker/${id}/hard-delete`, {
    withCredentials: true,
  });
