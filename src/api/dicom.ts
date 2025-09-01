import { apiRequest } from "./client";
import {
  ApiResponse,
  DcmData,
  StudentListItem,
  StudentDataDetail,
  PaginatedResponse,
  FileDownloadUrl,
  BatchFileDownloadUrls,
  AnnotationSaveResponse,
  AnnotationData,
} from "@/types/api";

// ==================== 管理员API ====================

// 获取原始数据列表（管理员）
export const getOriginalDataListRequest = async (
  page: number = 1,
  per_page: number = 10,
  search?: string,
  category?: string,
  status?: string
): Promise<ApiResponse<PaginatedResponse<DcmData>>> => {
  const params: any = { page, per_page };
  if (search) params.search = search;
  if (category) params.category = category;
  if (status) params.status = status;

  return apiRequest.get<PaginatedResponse<DcmData>>(
    "/admin/original-data",
    params
  );
};

// 创建原始数据（管理员）
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
  return apiRequest.post<DcmData>("/admin/original-data/store", data);
};

// 获取单个原始数据详情（管理员）
export const getOriginalDataDetailRequest = async (
  id: number
): Promise<ApiResponse<DcmData>> => {
  return apiRequest.get<DcmData>(
    `/admin/original-data/detail?original_id=${id}`
  );
};

// 更新原始数据（管理员）
export const updateOriginalDataRequest = async (
  id: number,
  data: {
    name?: string;
    remark?: string;
    category?: number;
  }
): Promise<ApiResponse<DcmData>> => {
  return apiRequest.post<DcmData>("/admin/original-data/update", {
    original_id: id,
    ...data,
  });
};

// ==================== 用户API ====================

// 获取用户可访问的原始数据列表
export const getUserAccessibleDataRequest = async (
  page: number = 1,
  per_page: number = 10,
  search?: string,
  category?: string
): Promise<ApiResponse<PaginatedResponse<DcmData>>> => {
  const params: any = { page, per_page };
  if (search) params.search = search;
  if (category) params.category = category;

  return apiRequest.get<PaginatedResponse<DcmData>>(
    "/user/original-data",
    params
  );
};

// 获取DCM文件下载链接
export const getDcmFileUrlRequest = async (
  fileId: number
): Promise<ApiResponse<FileDownloadUrl>> => {
  return apiRequest.get<FileDownloadUrl>(`/user/dcm-file/${fileId}/url`);
};

// 批量获取DCM文件下载链接
export const getBatchDcmFileUrlsRequest = async (
  fileIds: number[]
): Promise<ApiResponse<BatchFileDownloadUrls>> => {
  return apiRequest.post<BatchFileDownloadUrls>("/user/dcm-files/batch-urls", {
    file_ids: fileIds,
  });
};

// 保存DCM注释数据
export const saveDcmAnnotationsRequest = async (
  dataId: number,
  annotations: any
): Promise<ApiResponse<AnnotationSaveResponse>> => {
  return apiRequest.post<AnnotationSaveResponse>(
    `/user/dcm-data/${dataId}/annotations`,
    {
      annotations: JSON.stringify(annotations),
    }
  );
};

// 获取DCM注释数据
export const getDcmAnnotationsRequest = async (
  dataId: number
): Promise<ApiResponse<AnnotationData>> => {
  return apiRequest.get<AnnotationData>(`/user/dcm-data/${dataId}/annotations`);
};

// ==================== 学生API ====================

// 获取学生复制的数据列表
export const getUserCopyListRequest = async (data: {
  original_id: number;
}): Promise<ApiResponse<PaginatedResponse<StudentListItem>>> => {
  return apiRequest.get<PaginatedResponse<StudentListItem>>(
    "/student/userCopy",
    data
  );
};

// 复制公共数据到私有（学生）
export const copyPublicDataToPrivateRequest = async (data: {
  original_id: number;
  copy_name: string;
}): Promise<ApiResponse<DcmData>> => {
  return apiRequest.post<DcmData>("/student/copy", data);
};

// 获取学生单条数据详情（含最新的标记数据）
export const getStudentDataDetailRequest = async (
  userCopyId: number
): Promise<ApiResponse<StudentDataDetail>> => {
  return apiRequest.get<StudentDataDetail>(
    `/student/copy/detail?user_copy_id=${userCopyId}`
  );
};

// 删除学生复制的数据
export const deleteOriginalDataRequest = async (
  userCopyId: number
): Promise<ApiResponse<any[]>> => {
  return apiRequest.post<any[]>("/student/del", { user_copy_id: userCopyId });
};

// 修改复制名称（学生）
export const updateCopyNameRequest = async (
  userCopyId: number,
  copyName: string
): Promise<ApiResponse<any>> => {
  return apiRequest.post<any>("/student/update-copy-name", {
    user_copy_id: userCopyId,
    copy_name: copyName,
  });
};

// ==================== 兼容性函数 ====================

// 保持原有的七牛云URL配置
export const qiniuBaseUrl = "http://t1am3584v.hn-bkt.clouddn.com/";

// 兼容性函数，保持原有接口名称
export const getDcmListRequest = getUserAccessibleDataRequest;
export const uploadDcmRequest = createOriginalDataRequest;
