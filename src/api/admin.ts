import { ApiResponse, apiClient } from ".";
import type { UserRole } from "./login";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// 获取所有用户列表
export const getAllUsersRequest = async (
  page: number = 1,
  per_page: number = 10
): Promise<ApiResponse<PaginatedResponse<AdminUser>>> => {
  const response = await apiClient.get('/admin/users', {
    params: { page, per_page }
  });
  return response.data;
};

// 更新用户权限
export const updateUserRoleRequest = async (
  userId: number,
  newRole: UserRole
): Promise<ApiResponse<AdminUser>> => {
  const response = await apiClient.put(`/admin/users/${userId}`, {
    role: newRole
  });
  return response.data;
};

// 搜索用户（支持分页）
export const searchUsersRequest = async (
  searchTerm: string = '',
  role?: UserRole | "all",
  page: number = 1,
  per_page: number = 10
): Promise<ApiResponse<PaginatedResponse<AdminUser>>> => {
  const params: any = { page, per_page };
  
  if (searchTerm) {
    params.search = searchTerm;
  }
  
  if (role && role !== "all") {
    params.role = role;
  }
  
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

// 删除用户
export const deleteUserRequest = async (
  userId: number
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};
