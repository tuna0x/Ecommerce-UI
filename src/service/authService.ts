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
  const response = await axiosInstance.post<IApiResponse<ILoginResponse>>(
    "/auth/register",
    data,
  );
  return response.data;
};

export const sendOtpApi = async (email: string) => {
  const response = await axiosInstance.post<IApiResponse<void>>(
    "/auth/otp/send",
    { email },
  );
  return response.data;
};

export const verifyOtpApi = async (email: string, otp: string) => {
  const response = await axiosInstance.post<IApiResponse<void>>(
    "/auth/otp/verify",
    { email, otp },
  );
  return response.data;
};

export const socialLoginApi = async (idToken: string) => {
  const response = await axiosInstance.post<IApiResponse<ILoginResponse>>(
    "/auth/social-login",
    { idToken },
  );
  return response.data;
};
