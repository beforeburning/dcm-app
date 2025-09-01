import { ApiResponse, apiClient } from ".";
import { StudentCopyDataDetail, OriginalDataDetail } from "@/types/api";

// 通用类型定义
export type Tag = {
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
};

export type User = {
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

export type DcmFile = {
  file_id: number;
  original_id: number;
  file_path: string;
  file_url: string;
  fresh_url: string;
  file_name: string;
  file_size: number;
  original_annotation: string;
  created_at: string;
  updated_at: string;
};

export type DcmData = {
  original_id: number;
  name: string;
  remark: string;
  category: number;
  active_flag: number;
  created_at: string;
  created_user_id: number;
  updated_at: string;
  updated_user_id: number;
  tags: Tag[];
  creator: User;
  files: DcmFile[];
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
  remark: string;
  files: Array<{
    file_name: string;
    file_path: string;
    file_url: string;
    file_size: number;
  }>;
}): Promise<ApiResponse<DcmData>> => {
  const response = await apiClient.post("/admin/original-data/store", data);
  return response.data;
};

// 学生 - 获取列表
export type StudentListItem = {
  user_copy_id: number;
  original_id: number;
  user_id: number;
  copy_name: string;
  last_annotation_id: number;
  active_flag: number;
  created_at: string;
  created_user_id: number;
  updated_at: string;
  updated_user_id: number;
  user: User;
  original_data: {
    original_id: number;
    name: string;
    remark: string;
    category: number;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
  };
};
export const getUserCopyListRequest = async (data: {
  original_id: number;
}): Promise<
  ApiResponse<{
    list: Array<StudentListItem>;
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  }>
> => {
  const response = await apiClient.get("/student/userCopy", {
    params: data,
  });
  return response.data;
};

// 删除原始数据
export const deleteOriginalDataRequest = async (
  userCopyId: number
): Promise<ApiResponse<any[]>> => {
  const response = await apiClient.post("/student/del", {
    user_copy_id: userCopyId,
  });
  return response.data;
};

// 修改复制名称
export const updateCopyNameRequest = async (
  userCopyId: number,
  copyName: string
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post("/student/update-copy-name", {
    user_copy_id: userCopyId,
    copy_name: copyName,
  });
  return response.data;
};

// 获取单个原始数据  - 已对接
export const getOriginalDataDetailRequest = async (
  id: number
): Promise<ApiResponse<OriginalDataDetail>> => {
  const response = await apiClient.get(
    `/admin/original-data/detail?original_id=${id}`
  );
  return response.data;
};

// 管理员 - 更新原始数据  - 已对接
export const updateOriginalDataRequest = async (
  id: number,
  data: {
    name?: string;
    remark?: string;
    category?: number;
  }
): Promise<ApiResponse<DcmData>> => {
  const response = await apiClient.post(`/admin/original-data/update`, {
    original_id: id,
    ...data,
  });
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
  original_id: number;
  copy_name: string;
}): Promise<ApiResponse<DcmData>> => {
  const response = await apiClient.post("/student/copy", data);
  return response.data;
};

// 学生 - 获取单条数据详情（含最新的标记数据）
export const getStudentDataDetailRequest = async (
  userCopyId: number
): Promise<ApiResponse<StudentCopyDataDetail>> => {
  const response = await apiClient.get(
    `/student/copy/detail?user_copy_id=${userCopyId}`
  );
  return response.data;
};
