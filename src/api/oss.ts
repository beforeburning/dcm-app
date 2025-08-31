import { apiRequest } from "./client";
import {
  ApiResponse,
  OssConnectionTest,
  OssUploadResponse,
  OssConfigDiagnosis,
} from "@/types/api";

// OSS 连接测试
export const testOssConnectionRequest = async (): Promise<ApiResponse<OssConnectionTest>> => {
  return apiRequest.get<OssConnectionTest>("/admin/original-data/test-oss/connection");
};

// OSS 文件上传
export const uploadFileToOssRequest = async (file: File): Promise<OssUploadResponse> => {
  return apiRequest.upload<OssUploadResponse>("/admin/oss/upload", file);
};

// OSS 配置诊断
export const diagnoseOssConfigRequest = async (): Promise<ApiResponse<OssConfigDiagnosis>> => {
  return apiRequest.get<OssConfigDiagnosis>("/admin/original-data/diagnose-oss/config");
};
