import axios from "axios";
import { OwnerResponse, UpdateOwnerPayload } from "../types/owner.type";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

export const getOwners = async (page = 1, limit = 10, mandorId?: string) => {
  const params: { page: number; limit: number; mandorId?: string } = {
    page,
    limit,
  };

  if (mandorId) {
    params.mandorId = mandorId;
  }

  const res = await axios.get<OwnerResponse>(`${API_URL}/api/owner`, {
    params,
    withCredentials: true,
  });

  console.log("FETCH URL:", res);

  return res.data;
};

export const getOwnerById = async (id: string) => {
  const res = await axios.get(`${API_URL}/api/owner/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateOwner = async (id: string, data: UpdateOwnerPayload) => {
  const res = await axios.put(`${API_URL}/api/owner/${id}`, data, {
    withCredentials: true,
  });
  return res.data;
};

export const deleteOwner = async (id: string) => {
  await axios.delete(`${API_URL}/api/owner/${id}`, {
    withCredentials: true,
  });
};

export const getTrashedOwners = (page = 1, limit = 10, mandorId?: string) => {
  const params: { page: number; limit: number; mandorId?: string } = {
    page,
    limit,
  };

  // Jika mandorId ada (Admin memilih filter), masukkan ke query params
  if (mandorId) {
    params.mandorId = mandorId;
  }

  return axios
    .get(`${API_URL}/api/owner/trashed`, {
      params,
      withCredentials: true,
    })
    .then((res) => res.data);
};

export const restoreOwner = (id: string) =>
  axios.put(
    `${API_URL}/api/owner/${id}/restore`,
    {},
    { withCredentials: true },
  );

export const hardDeleteOwner = (id: string) =>
  axios.delete(`${API_URL}/api/owner/${id}/hard-delete`, {
    withCredentials: true,
  });
