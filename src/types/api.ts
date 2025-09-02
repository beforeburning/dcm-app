// 基础API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 分页响应接口
export interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  pagination: PaginationInfo;
}

// 用户相关类型
export type UserRole = 1 | 2 | 3; // 1: 超级管理员, 2: 教师, 3: 学生

export interface UserInfo {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  role_name: string;
  active_flag: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

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

// 认证相关类型
export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// DICOM数据相关类型
export interface Tag {
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
}

export interface User {
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
}

export interface DcmFile {
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
}

export interface DcmData {
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
}

export interface StudentListItem {
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
}

// 学生数据详情接口
export interface StudentDataDetail {
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
  original_data: DcmData;
  creator: User;
  last_annotation: any | null;
}

// 学生复制数据详情接口（新的完整结构）
export interface StudentCopyDataDetail {
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
  original_data: {
    original_id: number;
    name: string;
    remark: string;
    category: number;
    last_annotation_id: number | null;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
    files: DcmFile[];
  };
  creator: User;
  last_annotation: {
    annotations_id: number;
    user_copy_id: number;
    original_id: number | null;
    user_id: number;
    annotation: string;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
  } | null;
  files: DcmFile[];
}

// 原始数据详情接口（新的结构，匹配API返回）
export interface OriginalDataDetail {
  original_id: number;
  name: string;
  remark: string;
  category: number;
  last_annotation_id: number | null;
  active_flag: number;
  created_at: string;
  created_user_id: number;
  updated_at: string;
  updated_user_id: number;
  last_annotation: {
    annotations_id: number;
    user_copy_id: number | null;
    original_id: number;
    user_id: number;
    annotation: string;
    active_flag: number;
    created_at: string;
    created_user_id: number;
    updated_at: string;
    updated_user_id: number;
  } | null;
  creator: User;
  files: DcmFile[];
}

// OSS相关类型
export interface OssConnectionTest {
  status: string;
  message: string;
  config?: any;
}

export interface OssUploadResponse {
  success: boolean;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  original_annotation: string;
}

export interface OssConfigDiagnosis {
  config: any;
  issues: string[];
}

// 文件下载相关类型
export interface FileDownloadUrl {
  url: string;
  expires_at: string;
}

export interface BatchFileDownloadUrls {
  files: Array<{
    id: number;
    url: string;
    expires_at: string;
  }>;
}

// 注释相关类型
export interface AnnotationSaveResponse {
  id: number;
  updated_at: string;
}

export interface AnnotationData {
  id: number;
  annotations: any;
  updated_at: string;
}

// 学生用户复制数据列表响应类型
export interface StudentUserCopyListResponse {
  list: StudentListItem[];
  pagination: PaginationInfo;
}
