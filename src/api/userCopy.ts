import { ApiResponse, apiClient } from ".";

export type DcmFile = {
  id: number;
  name: string;
  size: number;
  path: string;
  original_data_id: number;
};

export type DcmData = {
  id: number;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  status: 'active' | 'inactive';
  file_count: number;
  total_size: number;
  oss_bucket?: string;
  oss_path?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  files?: DcmFile[];
};

export type UserCopyData = {
  id: number;
  name: string;
  description?: string;
  original_data_id: number;
  user_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  original_data?: DcmData;
  files?: DcmFile[];
};

// 分页响应接口
export interface PaginatedUserCopyResponse {
  data: UserCopyData[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// 用户数据中心 - 获取用户所有数据
export const getUserDataCenterRequest = async (
  page: number = 1,
  per_page: number = 10,
  search?: string
): Promise<ApiResponse<{
  copied_data: PaginatedUserCopyResponse;
  accessible_original_data: any;
}>> => {
  const params: any = { page, per_page };
  if (search) params.search = search;
  
  const response = await apiClient.get('/user/data', { params });
  return response.data;
};

// 获取用户复制的数据列表
export const getUserCopyDataRequest = async (
  page: number = 1,
  per_page: number = 10,
  search?: string
): Promise<ApiResponse<PaginatedUserCopyResponse>> => {
  const params: any = { page, per_page };
  if (search) params.search = search;
  
  const response = await apiClient.get('/user/copy', { params });
  return response.data;
};

// 复制原始数据到用户账户
export const copyOriginalDataRequest = async (
  originalDataId: number,
  name?: string,
  description?: string
): Promise<ApiResponse<UserCopyData>> => {
  const data: any = {};
  if (name) data.name = name;
  if (description) data.description = description;
  
  const response = await apiClient.post(`/user/copy/${originalDataId}`, data);
  return response.data;
};

// 更新用户复制的数据
export const updateUserCopyDataRequest = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    status?: 'active' | 'inactive';
  }
): Promise<ApiResponse<UserCopyData>> => {
  const response = await apiClient.put(`/user/copy/${id}`, data);
  return response.data;
};

// 删除用户复制的数据
export const deleteUserCopyDataRequest = async (
  id: number
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete(`/user/copy/${id}`);
  return response.data;
};

// 管理员 - 查看所有用户复制的数据
export const getAllUserCopyDataRequest = async (
  page: number = 1,
  per_page: number = 10,
  search?: string,
  user_id?: number
): Promise<ApiResponse<PaginatedUserCopyResponse>> => {
  const params: any = { page, per_page };
  if (search) params.search = search;
  if (user_id) params.user_id = user_id;
  
  const response = await apiClient.get('/admin/user-copy', { params });
  return response.data;
};

// 兼容性函数，保持原有接口名称
export const copyDcmToStudentRequest = copyOriginalDataRequest;
export const getStudentDcmListRequest = getUserCopyDataRequest;
export const updateStudentDcmNameRequest = (dcmId: number, userId: number, newName: string) => 
  updateUserCopyDataRequest(dcmId, { name: newName });
export const searchAllStudentDataRequest = getAllUserCopyDataRequest;