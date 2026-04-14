export type FileType = "PHOTO" | "VIDEO";
export type DocumentationSession = "PAGI" | "SORE";

export interface DocumentationFile {
  fileUrl: string;
  cloudinaryId: string;
  fileType: FileType;
}

export interface Documentation {
  id: string;
  reportDate: string;
  session: DocumentationSession;
  workArea: string;
  task: string;
  target?: string;
  progress?: string;
  projectId: string;
  files: DocumentationFile[];
  project?: { projectName: string };
  createdBy?: { name: string };
}

// ----------------------------------------------------
// DTO (Data Transfer Objects) untuk Request & Response
// ----------------------------------------------------

// Tipe parameter untuk axios.get (query string)
export interface GetDocsParams {
  projectId: string;
  page?: number;
  limit?: number;
  sortBy?: "reportDate" | "createdAt" | "session";
  order?: "asc" | "desc";
  status?: string;
}

// Tipe parameter untuk axios.post (Create)
export interface CreateDocPayload {
  projectId: string;
  reportDate: string; // Format harus DD-MM-YYYY
  session: DocumentationSession;
  workArea: string;
  task: string;
  target?: string;
  progress?: string;
  files: DocumentationFile[]; // File yang sudah di-upload ke Cloudinary
}

// Tipe parameter untuk axios.put (Update) - Menggunakan Partial karena field bisa opsional
export interface UpdateDocPayload {
  projectId?: string;
  reportDate?: string; // Format harus DD-MM-YYYY
  session?: DocumentationSession;
  workArea?: string;
  task?: string;
  target?: string;
  progress?: string;
  files?: DocumentationFile[];
}

// Tipe untuk respon listDocumentationHistory dari Backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// DocsResponse sedikit disesuaikan agar cocok dengan output Controller backend
export interface DocsResponse {
  success: boolean;
  message: string;
  data: Documentation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
