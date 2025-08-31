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

// 学生用户接口
export interface StudentUser {
  user_id: number;
  email: string;
  email_verified_at: string | null;
  username: string;
  autoFillUserId: string;
  role: UserRole;
  active_flag: number;
  created_at: string;
  created_user_id: number;
  updated_at: string;
  updated_user_id: number;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

// 获取所有学生用户列表（支持搜索和分页）
export const getStudentsDataRequest = async (
  params: {
    page?: number;
    per_page?: number;
    username?: string;
    email?: string;
  } = {}
): Promise<ApiResponse<PaginatedResponse<StudentUser>>> => {
  const { page = 1, per_page = 10, username, email, ...otherParams } = params;

  const queryParams: any = { page, per_page, ...otherParams };

  // 添加搜索参数
  if (username) queryParams.username = username;
  if (email) queryParams.email = email;

  const response = await apiClient.get("/admin/users/students", {
    params: queryParams,
  });
  return response.data;
};

// 更新用户权限
export const updateUserRoleRequest = async (
  userId: number,
  newRole: UserRole
): Promise<ApiResponse<AdminUser>> => {
  const response = await apiClient.put(`/admin/users/${userId}`, {
    role: newRole,
  });
  return response.data;
};

// 删除用户
export const deleteUserRequest = async (
  userId: number
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};
