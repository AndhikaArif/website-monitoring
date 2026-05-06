export interface Owner {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface UpdateOwnerPayload {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}

export interface OwnerResponse {
  data: Owner[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
