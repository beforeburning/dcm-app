import { apiRequest } from "./client";
import {
  ApiResponse,
  StudentUser,
  PaginatedResponse,
  UserRole,
} from "@/types/api";

// 修改用户角色响应数据
export interface ChangeRoleResponse {
  user_id: number;
  username: string;
  email: string;
  old_role: number;
  old_role_name: string;
  new_role: number;
  new_role_name: string;
  updated_at: string;
}

// 重置密码响应数据
export interface ResetPasswordResponse {
  user_id: number;
  username: string;
  email: string;
  new_password: string;
}

// 获取所有学生用户列表（支持搜索和分页）
export const getStudentsDataRequest = async (
  params: {
    page?: number;
    per_page?: number;
    keyword?: string;
  } = {}
): Promise<ApiResponse<PaginatedResponse<StudentUser>>> => {
  const { page = 1, per_page = 10, keyword, ...otherParams } = params;
  const queryParams: any = { page, per_page, ...otherParams };
  
  // 添加搜索参数
  if (keyword) queryParams.keyword = keyword;
  
  return apiRequest.get<PaginatedResponse<StudentUser>>("/admin/users/students", queryParams);
};

// 更新用户权限
export const updateUserRoleRequest = async (
  userId: number,
  newRole: UserRole
): Promise<ApiResponse<ChangeRoleResponse>> => {
  return apiRequest.post<ChangeRoleResponse>("/admin/users/change-role", {
    user_id: userId,
    new_role: newRole,
  });
};

// 删除用户
export const deleteUserRequest = async (userId: number): Promise<ApiResponse<null>> => {
  return apiRequest.delete<null>(`/admin/users/${userId}`);
};

// 重置用户密码
export const resetUserPasswordRequest = async (userId: number): Promise<ApiResponse<ResetPasswordResponse>> => {
  return apiRequest.post<ResetPasswordResponse>("/admin/users/reset-password", {
    user_id: userId,
  });
};
