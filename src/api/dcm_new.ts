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

// 分页响应接口
export interface PaginatedDcmResponse {
  data: DcmData[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// 管理员 - 获取原始数据列表
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
  
  const response = await apiClient.get('/admin/original-data', { params });
  return response.data;
};

// 管理员 - 创建原始数据
export const createOriginalDataRequest = async (
  data: {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    files: File[];
  }
): Promise<ApiResponse<DcmData>> => {
  const formData = new FormData();
  formData.append('name', data.name);
  
  if (data.description) formData.append('description', data.description);
  if (data.category) formData.append('category', data.category);
  if (data.tags) formData.append('tags', JSON.stringify(data.tags));
  
  data.files.forEach((file, index) => {
    formData.append(`files[${index}]`, file);
  });

  const response = await apiClient.post('/admin/original-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 管理员 - 获取单个原始数据
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
    status?: 'active' | 'inactive';
  }
): Promise<ApiResponse<DcmData>> => {
  const response = await apiClient.put(`/admin/original-data/${id}`, data);
  return response.data;
};

// 管理员 - 删除原始数据
export const deleteOriginalDataRequest = async (
  id: number
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete(`/admin/original-data/${id}`);
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
  
  const response = await apiClient.get('/user/original-data', { params });
  return response.data;
};

// OSS 连接测试
export const testOssConnectionRequest = async (): Promise<ApiResponse<{
  status: string;
  message: string;
  config?: any;
}>> => {
  const response = await apiClient.get('/admin/original-data/test-oss/connection');
  return response.data;
};

// OSS 配置诊断
export const diagnoseOssConfigRequest = async (): Promise<ApiResponse<{
  config: any;
  issues: string[];
}>> => {
  const response = await apiClient.get('/admin/original-data/diagnose-oss/config');
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
): Promise<ApiResponse<{ files: Array<{ id: number; url: string; expires_at: string }> }>> => {
  const response = await apiClient.post('/user/dcm-files/batch-urls', { file_ids: fileIds });
  return response.data;
};

// 保存DCM注释数据
export const saveDcmAnnotationsRequest = async (
  dataId: number,
  annotations: any
): Promise<ApiResponse<{ id: number; updated_at: string }>> => {
  const response = await apiClient.post(`/user/dcm-data/${dataId}/annotations`, {
    annotations: JSON.stringify(annotations)
  });
  return response.data;
};

// 获取DCM注释数据
export const getDcmAnnotationsRequest = async (
  dataId: number
): Promise<ApiResponse<{ id: number; annotations: any; updated_at: string }>> => {
  const response = await apiClient.get(`/user/dcm-data/${dataId}/annotations`);
  return response.data;
};

// 兼容性函数，保持原有接口名称
export const getDcmListRequest = getUserAccessibleDataRequest;
export const getDcmDetailRequest = getOriginalDataDetailRequest;
export const uploadDcmRequest = createOriginalDataRequest;

// 保持原有的七牛云URL配置
export const qiniuBaseUrl = "http://t1am3584v.hn-bkt.clouddn.com/";