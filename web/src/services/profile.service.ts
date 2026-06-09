import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

export interface UpdateProfilePayload {
  name?: string;
  phoneNumber?: string | null;
  address?: string | null;
}

export const getMyProfile = async () => {
  const res = await axios.get(`${API_URL}/api/me`, {
    withCredentials: true,
  });

  return res.data;
};

export const updateMyProfile = async (data: UpdateProfilePayload) => {
  const res = await axios.put(`${API_URL}/api/update`, data, {
    withCredentials: true,
  });

  return res.data;
};
