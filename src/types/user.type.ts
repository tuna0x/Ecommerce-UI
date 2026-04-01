export interface IUser {
  id: number;
  name: string;
  email: string;
  image?: string;
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
