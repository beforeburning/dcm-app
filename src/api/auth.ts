import { apiRequest } from "./client";
import {
  ApiResponse,
  LoginParams,
  LoginResponse,
  UserInfo,
  RegisterParams,
  ChangePasswordRequest,
  CheckEmailParams,
  SendCodeParams,
  VerifyCodeParams,
  SubmitRegisterParams,
} from "@/types/api";

// 邮箱检查参数
export interface CheckEmailParams {
  email: string;
}

// 发送验证码参数
export interface SendCodeParams {
  email: string;
  name: string;
  password: string;
}

// 验证验证码参数
export interface VerifyCodeParams {
  email: string;
  code: string;
}

// 提交注册参数
export interface SubmitRegisterParams {
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
  code: string;
  verification_token?: string;
}

// 登录接口
export const loginRequest = async (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiRequest.post<LoginResponse>("/auth/login", params);
  
  // 如果登录成功，存储 token
  if (response.success && response.data?.access_token) {
    localStorage.setItem("access_token", response.data.access_token);
  }
  
  return response;
};

// 获取当前用户信息
export const getUserInfoRequest = async (): Promise<ApiResponse<{ user: UserInfo }>> => {
  return apiRequest.get<{ user: UserInfo }>("/auth/me");
};

// 刷新 Token
export const refreshTokenRequest = async (): Promise<ApiResponse<{ access_token: string; token_type: string; expires_in: number }>> => {
  const response = await apiRequest.post<{ access_token: string; token_type: string; expires_in: number }>("/auth/refresh");
  
  // 更新本地存储的 token
  if (response.success && response.data?.access_token) {
    localStorage.setItem("access_token", response.data.access_token);
  }
  
  return response;
};

// 登出接口
export const logoutRequest = async (): Promise<ApiResponse<null>> => {
  const response = await apiRequest.post<null>("/auth/logout");
  
  // 清除本地 token
  localStorage.removeItem("access_token");
  
  return response;
};

// 检查邮箱是否已注册
export const checkEmailRequest = async (params: CheckEmailParams): Promise<ApiResponse<{ exists: boolean }>> => {
  return apiRequest.post<{ exists: boolean }>("/register/check-email", params);
};

// 发送注册验证码
export const sendVerificationCodeRequest = async (params: SendCodeParams): Promise<ApiResponse<{ message: string }>> => {
  return apiRequest.post<{ message: string }>("/register/send-code", params);
};

// 验证注册验证码
export const verifyCodeRequest = async (params: VerifyCodeParams): Promise<ApiResponse<{
  verification_token?: string;
  verified?: boolean;
  remaining_time?: number;
}>> => {
  return apiRequest.post<{
    verification_token?: string;
    verified?: boolean;
    remaining_time?: number;
  }>("/register/verify-code", params);
};

// 提交注册
export const submitRegisterRequest = async (params: SubmitRegisterParams): Promise<ApiResponse<UserInfo>> => {
  return apiRequest.post<UserInfo>("/register/submit", params);
};

// 获取验证码状态
export const getVerificationStatusRequest = async (email: string): Promise<ApiResponse<{ status: string; expires_at?: string }>> => {
  return apiRequest.get<{ status: string; expires_at?: string }>(`/register/verification-status?email=${encodeURIComponent(email)}`);
};

// 修改密码
export const changePasswordRequest = async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>("/user/change-password", data);
};
