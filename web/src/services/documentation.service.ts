import axios from "axios";
import type {
  Documentation,
  DocsResponse,
  GetDocsParams,
  CreateDocPayload,
  UpdateDocPayload,
  ApiResponse,
  DocumentationFile,
} from "../types/documentation.type";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

// Mengambil list dokumentasi berdasarkan project (mengembalikan DocsResponse)
export const getProjectDocumentations = async (
  params: GetDocsParams,
): Promise<DocsResponse> => {
  const res = await axios.get<DocsResponse>(`${API_URL}/api/documentation/`, {
    params,
    withCredentials: true,
  });
  return res.data;
};

// Membuat dokumentasi baru
export const createDocumentation = async (
  data: CreateDocPayload,
): Promise<ApiResponse<Documentation>> => {
  const res = await axios.post<ApiResponse<Documentation>>(
    `${API_URL}/api/documentation/`,
    data,
    {
      withCredentials: true,
    },
  );
  return res.data;
};

// Memperbarui dokumentasi yang ada
export const updateDocumentation = async (
  id: string,
  data: UpdateDocPayload,
): Promise<ApiResponse<Documentation>> => {
  const res = await axios.put<ApiResponse<Documentation>>(
    `${API_URL}/api/documentation/${id}`,
    data,
    {
      withCredentials: true,
    },
  );
  return res.data;
};

// Menghapus dokumentasi
export const deleteDocumentation = async (id: string): Promise<void> => {
  const res = await axios.delete(`${API_URL}/api/documentation/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

// Tambahkan fungsi uploadFiles ini
export const uploadDocumentationFiles = async (
  files: File[],
): Promise<ApiResponse<DocumentationFile[]>> => {
  // Gunakan FormData untuk mengirim file
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file); // "files" harus sama dengan nama field di multer backend: .array("files")
  });

  const res = await axios.post<ApiResponse<DocumentationFile[]>>(
    `${API_URL}/api/documentation/upload`,
    formData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data", // Wajib untuk upload file
      },
    },
  );
  return res.data;
};

// Tambahkan di src/services/documentation.service.ts
export const deleteCloudinaryFile = async (
  cloudinaryId: string,
): Promise<void> => {
  const res = await axios.delete(`${API_URL}/api/documentation/upload`, {
    data: { cloudinaryId },
    withCredentials: true,
  });
  return res.data;
};
