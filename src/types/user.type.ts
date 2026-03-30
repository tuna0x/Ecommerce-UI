export interface IUser {
  id: number;
  name: string;
  email: string;
  address?: string;
  age?: number;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updateBy?: string;
  active: boolean;
  role: {
    id: number;
    name: string;
  };
}
