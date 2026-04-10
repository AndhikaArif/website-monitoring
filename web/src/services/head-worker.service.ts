// services/mandor.service.ts

import axios from "axios";
import {
  HeadWorkerResponse,
  UpdateHeadWorkerPayload,
} from "../types/head-worker.type";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

export const getHeadWorkers = async (page = 1, limit = 10) => {
  const res = await axios.get<HeadWorkerResponse>(
    `${API_URL}/api/head-worker?page=${page}&limit=${limit}`,
    { withCredentials: true },
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
