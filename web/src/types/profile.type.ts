export interface ProfileTarget {
  id: string;
  name: string;
  username: string;
  role?: string;
  email?: string;
  phoneNumber?: string | null;
  address?: string | null;
}
