import { ApiResponse, apiClient } from ".";

// OSS 连接测试
export const testOssConnectionRequest = async (): Promise<
  ApiResponse<{
    status: string;
    message: string;
    config?: any;
  }>
> => {
  const response = await apiClient.get(
    "/admin/original-data/test-oss/connection"
  );
  return response.data;
};

// OSS 文件上传
export const uploadFileToOssRequest = async (
  file: File
): Promise<{
  success: boolean;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  original_annotation: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/admin/oss/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// OSS 配置诊断
export const diagnoseOssConfigRequest = async (): Promise<
  ApiResponse<{
    config: any;
    issues: string[];
  }>
> => {
  const response = await apiClient.get(
    "/admin/original-data/diagnose-oss/config"
  );
  return response.data;
};
