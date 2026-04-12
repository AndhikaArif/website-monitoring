import axios from "axios";
import { MandorResponse, UpdateMandorPayload } from "../types/mandor.type";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

export const getMandors = async (page = 1, limit = 10) => {
  const res = await axios.get<MandorResponse>(
    `${API_URL}/api/auth/mandor?page=${page}&limit=${limit}`,
    { withCredentials: true },
  );

  console.log("FETCH URL:", res);

  return res.data;
};

export const getMandorById = async (id: string) => {
  const res = await axios.get(`${API_URL}/api/auth/mandor/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateMandor = async (id: string, data: UpdateMandorPayload) => {
  const res = await axios.put(`${API_URL}/api/auth/mandor/${id}`, data, {
    withCredentials: true,
  });
  return res.data;
};
export const deleteMandor = async (id: string) => {
  await axios.delete(`${API_URL}/api/auth/mandor/${id}`, {
    withCredentials: true,
  });
};

export const getTrashedMandors = (page = 1, limit = 10) =>
  axios
    .get(`${API_URL}/api/auth/mandor/trashed?page=${page}&limit=${limit}`, {
      withCredentials: true,
    })
    .then((res) => res.data);

export const restoreMandor = (id: string) =>
  axios.put(
    `${API_URL}/api/auth/mandor/${id}/restore`,
    {},
    { withCredentials: true },
  );

export const hardDeleteMandor = (id: string) =>
  axios.delete(`${API_URL}/api/auth/mandor/${id}/hard-delete`, {
    withCredentials: true,
  });
