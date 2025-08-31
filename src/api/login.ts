import { ApiResponse, apiClient } from ".";

// 类型定义
export type UserRole = 1 | 2 | 3; // 1: 超级管理员, 2: 教师, 3: 学生

export type UserInfo = {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  role_name: string;
  active_flag: number;
  created_at: string;
  updated_at: string;
};

export type LoginParams = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
};

export type RegisterParams = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

// 邮箱检查参数
export type CheckEmailParams = {
  email: string;
};

// 发送验证码参数
export type SendCodeParams = {
  email: string;
  name: string;
  password: string;
};

// 验证验证码参数
export type VerifyCodeParams = {
  email: string;
  code: string;
};

// 提交注册参数
export type SubmitRegisterParams = {
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
  code: string;
  verification_token?: string;
};

// 修改密码请求参数
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// 登录接口
export const loginRequest = async (
  params: LoginParams
): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiClient.post("/auth/login", params);

  // 如果登录成功，存储 token
  if (response.data.success && response.data.data?.access_token) {
    localStorage.setItem("access_token", response.data.data.access_token);
  }

  return response.data;
};

// 获取当前用户信息
export const getUserInfoRequest = async (): Promise<
  ApiResponse<{ user: UserInfo }>
> => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};

// 刷新 Token
export const refreshTokenRequest = async (): Promise<
  ApiResponse<{ access_token: string; token_type: string; expires_in: number }>
> => {
  const response = await apiClient.post("/auth/refresh");

  // 更新本地存储的 token
  if (response.data.success && response.data.data?.access_token) {
    localStorage.setItem("access_token", response.data.data.access_token);
  }

  return response.data;
};

// 登出接口
export const logoutRequest = async (): Promise<ApiResponse<null>> => {
  const response = await apiClient.post("/auth/logout");

  // 清除本地 token
  localStorage.removeItem("access_token");

  return response.data;
};

// 检查邮箱是否已注册
export const checkEmailRequest = async (
  params: CheckEmailParams
): Promise<ApiResponse<{ exists: boolean }>> => {
  const response = await apiClient.post("/register/check-email", params);
  return response.data;
};

// 发送注册验证码
export const sendVerificationCodeRequest = async (
  params: SendCodeParams
): Promise<ApiResponse<{ message: string }>> => {
  const response = await apiClient.post("/register/send-code", params);
  return response.data;
};

// 验证注册验证码
export const verifyCodeRequest = async (
  params: VerifyCodeParams
): Promise<
  ApiResponse<{
    verification_token?: string;
    verified?: boolean;
    remaining_time?: number;
  }>
> => {
  const response = await apiClient.post("/register/verify-code", params);
  return response.data;
};

// 提交注册
export const submitRegisterRequest = async (
  params: SubmitRegisterParams
): Promise<ApiResponse<UserInfo>> => {
  const response = await apiClient.post("/register/submit", params);
  return response.data;
};

// 获取验证码状态
export const getVerificationStatusRequest = async (
  email: string
): Promise<ApiResponse<{ status: string; expires_at?: string }>> => {
  const response = await apiClient.get(
    `/register/verification-status?email=${encodeURIComponent(email)}`
  );
  return response.data;
};

// 修改密码
export const changePasswordRequest = async (
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> => {
  const response = await apiClient.post("/user/change-password", data);
  return response.data;
};
