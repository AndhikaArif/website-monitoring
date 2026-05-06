import axios from "axios";
import { OwnerResponse, UpdateOwnerPayload } from "../types/owner.type";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

export const getOwners = async (page = 1, limit = 10, search = "") => {
  const res = await axios.get<OwnerResponse>(
    `${API_URL}/api/owner?page=${page}&limit=${limit}&search=${search}`,
    { withCredentials: true },
  );

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

export const getTrashedOwners = (page = 1, limit = 10, search = "") =>
  axios
    .get(
      `${API_URL}/api/owner/trashed?page=${page}&limit=${limit}&search=${search}`,
      {
        withCredentials: true,
      },
    )
    .then((res) => res.data);

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
