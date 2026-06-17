export interface HeadWorker {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  address?: string | null;
  createdAt: string;
  deletedAt?: string;
  mandor?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface UpdateHeadWorkerPayload {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}

export interface HeadWorkerResponse {
  data: HeadWorker[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
