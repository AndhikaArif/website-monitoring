export interface Mandor {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface UpdateMandorPayload {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}

export interface MandorResponse {
  data: Mandor[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
