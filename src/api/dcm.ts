import { ApiResponse, apiClient } from ".";
import type { UserRole } from "./login";

export type DcmFile = {
  id: number;
  name: string;
  size: number;
  path: string;
  original_data_id: number;
};

export type DcmData = {
  original_id: number;
  name: string;
  category: number;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size: number;
  original_annotation: string;
  active_flag: number;
  created_at: string;
  created_user_id: number;
  updated_at: string;
  updated_user_id: number;
  tags: any[];
  creator: {
    user_id: number;
    email: string;
    email_verified_at: string | null;
    username: string;
    autoFillUserId: string;
    role: number;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
  };
};

// 分页响应接口
export interface PaginatedDcmResponse {
  list: DcmData[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

// 获取原始数据列表 - 已对接
export const getOriginalDataListRequest = async (
  page: number = 1,
  per_page: number = 10,
  search?: string,
  category?: string,
  status?: string
): Promise<ApiResponse<PaginatedDcmResponse>> => {
  const params: any = { page, per_page };

  if (search) params.search = search;
  if (category) params.category = category;
  if (status) params.status = status;

  const response = await apiClient.get("/admin/original-data", { params });
  return response.data;
};

// 管理员 - 创建原始数据 - 已对接
export const createOriginalDataRequest = async (data: {
  name: string;
  category: number;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size: number;
  original_annotation?: string;
  tag_ids?: number[];
}): Promise<
  ApiResponse<{
    original_id: number;
    name: string;
    category: number;
    file_path: string;
    file_url: string;
    file_name: string;
    file_size: number;
    original_annotation: string;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
    tags: any[];
    creator: {
      user_id: number;
      email: string;
      email_verified_at: string | null;
      username: string;
      autoFillUserId: string;
      role: number;
      active_flag: number;
      created_at: string;
      created_user_id: number;
      updated_at: string;
      updated_user_id: number;
    };
  }>
> => {
  const response = await apiClient.post("/admin/original-data/store", data);
  return response.data;
};

// 管理员 - 删除原始数据 - 已对接
export const deleteOriginalDataRequest = async (
  userCopyId: number
): Promise<ApiResponse<any[]>> => {
  const response = await apiClient.post("/student/del", {
    user_copy_id: userCopyId,
  });
  return response.data;
};

// 管理员 - 删除公共数据
export const deletePublicDataRequest = async (
  originalId: number
): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete(`/admin/original-data/${originalId}`);
  return response.data;
};

// 获取单个原始数据
export const getOriginalDataDetailRequest = async (
  id: number
): Promise<ApiResponse<DcmData>> => {
  const response = await apiClient.get(`/admin/original-data/${id}`);
  return response.data;
};

// 管理员 - 更新原始数据
export const updateOriginalDataRequest = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    status?: "active" | "inactive";
  }
): Promise<ApiResponse<DcmData>> => {
  const response = await apiClient.put(`/admin/original-data/${id}`, data);
  return response.data;
};

// 用户 - 获取可访问的原始数据列表
export const getUserAccessibleDataRequest = async (
  page: number = 1,
  per_page: number = 10,
  search?: string,
  category?: string
): Promise<ApiResponse<PaginatedDcmResponse>> => {
  const params: any = { page, per_page };

  if (search) params.search = search;
  if (category) params.category = category;

  const response = await apiClient.get("/user/original-data", { params });
  return response.data;
};

// 获取DCM文件下载链接
export const getDcmFileUrlRequest = async (
  fileId: number
): Promise<ApiResponse<{ url: string; expires_at: string }>> => {
  const response = await apiClient.get(`/user/dcm-file/${fileId}/url`);
  return response.data;
};

// 批量获取DCM文件下载链接
export const getBatchDcmFileUrlsRequest = async (
  fileIds: number[]
): Promise<
  ApiResponse<{ files: Array<{ id: number; url: string; expires_at: string }> }>
> => {
  const response = await apiClient.post("/user/dcm-files/batch-urls", {
    file_ids: fileIds,
  });
  return response.data;
};

// 保存DCM注释数据
export const saveDcmAnnotationsRequest = async (
  dataId: number,
  annotations: any
): Promise<ApiResponse<{ id: number; updated_at: string }>> => {
  const response = await apiClient.post(
    `/user/dcm-data/${dataId}/annotations`,
    {
      annotations: JSON.stringify(annotations),
    }
  );
  return response.data;
};

// 获取DCM注释数据
export const getDcmAnnotationsRequest = async (
  dataId: number
): Promise<
  ApiResponse<{ id: number; annotations: any; updated_at: string }>
> => {
  const response = await apiClient.get(`/user/dcm-data/${dataId}/annotations`);
  return response.data;
};

// 兼容性函数，保持原有接口名称
export const getDcmListRequest = getUserAccessibleDataRequest;
export const uploadDcmRequest = createOriginalDataRequest;

// 学生 - 复制公共数据到私有
export const copyPublicDataToPrivateRequest = async (data: {
  original_data_id: number;
}): Promise<ApiResponse<DcmData>> => {
  const response = await apiClient.post("/student/copy", data);
  return response.data;
};

// 学生数据项类型定义
export type StudentDataItem = {
  original_id: number;
  name: string;
  category: number;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size: number;
  original_annotation: string;
  active_flag: number;
  created_at: string;
  created_user_id: number | null;
  updated_at: string;
  updated_user_id: number | null;
  tags: Array<{
    tag_id: number;
    tag_name: string;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
    pivot: {
      relate_id: number;
      tag_id: number;
    };
  }>;
  creator: {
    user_id: number;
    email: string;
    email_verified_at: string | null;
    username: string;
    autoFillUserId: string;
    role: number;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
  } | null;
};

// 学生数据列表响应类型
export type StudentDataListResponse = {
  list: StudentDataItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
};

// 学生数据列表分页响应类型（兼容 PaginatedDcmResponse 格式）
export type StudentDataPaginatedResponse = {
  data: StudentDataItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
};

// 学生 - 获取单条数据详情（含最新的标记数据）
export const getStudentDataDetailRequest = async (
  userCopyId: number
): Promise<ApiResponse<DcmData & { annotations?: any }>> => {
  const response = await apiClient.get(
    `/student/copy/detail?user_copy_id=${userCopyId}`
  );
  return response.data;
};

// 学生 - 获取个人数据列表
export const getStudentDataListRequest = async (
  page: number = 1,
  per_page: number = 10
): Promise<ApiResponse<StudentDataListResponse>> => {
  const response = await apiClient.get("/student/copy/list", {
    params: { page, per_page },
  });
  return response.data;
};

// 保持原有的七牛云URL配置
export const qiniuBaseUrl = "http://t1am3584v.hn-bkt.clouddn.com/";
