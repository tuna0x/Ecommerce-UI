export interface ILoginResponse {
  access_token: string;
  user: IUser;
}

export interface IUser {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  image?: string;
  age?: number;
  gender?: "MALE" | "FEMALE";
  role: IRole;
}

export interface IRole {
  id: number;
  name: string;
}

export interface ILoginPayload {
  username: string;
  password: string;
}

export interface IRegister {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}
