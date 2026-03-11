import axiosInstance from "./axiosInstance";
import type { IApiResponse } from "../types/api.type";
import type {
  ILoginPayload,
  ILoginResponse,
  IRegister,
} from "../types/auth.type";

export const loginApi = async (data: ILoginPayload) => {
  const response = await axiosInstance.post<IApiResponse<ILoginResponse>>(
    "/auth/login",
    data,
  );
  return response.data;
};

export const registerApi = async (data: IRegister) => {
  const response = await axiosInstance.post<IApiResponse<IRegister>>(
    "/auth/register",

    data,
  );
  return response.data;
};
