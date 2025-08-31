import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Select,
  SelectItem,
  Textarea,
  Spacer,
  Divider,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { createOriginalDataRequest } from "@/api/dcm";
import { testOssConnectionRequest, uploadFileToOssRequest } from "@/api/oss";
import { useUserAuth } from "@/hooks/useUserAuth";

interface FileInfo {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  uploadedUrl?: string; // 上传成功后的文件URL
  uploadedData?: {
    file_name: string;
    file_path: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    original_annotation: string;
  };
}

function UploadPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { userInfo, canUpload } = useUserAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [datasetName, setDatasetName] = useState("");
  const [category, setCategory] = useState("1");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [ossConnected, setOssConnected] = useState<boolean | null>(null);

  // 检查OSS连接状态
  const checkOssConnection = async () => {
    try {
      const response = await testOssConnectionRequest();
      if (response.success) {
        setOssConnected(true);
      } else {
        setOssConnected(false);
        addToast({
          color: "warning",
          description: response.message || "OSS连接异常",
        });
      }
    } catch (error) {
      setOssConnected(false);
      addToast({
        color: "danger",
        description: "OSS连接检查失败",
      });
    }
  };

  // 组件加载时检查OSS连接
  useEffect(() => {
    if (canUpload) {
      console.log("canUpload", canUpload);
      checkOssConnection();
    }
  }, [canUpload]);

  // 处理文件选择
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles = Array.from(selectedFiles).filter(
      (file) =>
        file.name.toLowerCase().endsWith(".dcm") ||
        file.name.toLowerCase().endsWith(".dicom")
    );

    if (validFiles.length === 0) {
      addToast({
        color: "warning",
        description: "请选择有效的 DICOM 文件（.dcm 或 .dicom 格式）",
      });
      return;
    }

    // 检查文件大小限制（单个文件不超过1MB）
    const oversizedFiles = validFiles.filter(
      (file) => file.size > 1 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      addToast({
        color: "danger",
        description: `以下文件超过1MB限制：${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`,
      });
      return;
    }

    // 创建新文件信息
    const newFiles: FileInfo[] = validFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      status: "pending" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // 开始上传所有新文件
    newFiles.forEach((fileInfo) => uploadFile(fileInfo));
  };

  // 拖拽处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // 分类选项
  const categoryOptions = [
    { key: "1", label: "X光" },
    { key: "2", label: "CT" },
    { key: "3", label: "MRI" },
    { key: "4", label: "超声" },
    { key: "5", label: "PET" },
  ];

  // 添加标签
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 3) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 上传单个文件
  const uploadFile = async (fileInfo: FileInfo) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileInfo.id ? { ...f, status: "uploading" as const } : f
      )
    );

    try {
      // 调用真实的OSS上传API
      const response = await uploadFileToOssRequest(fileInfo.file);

      if (response.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileInfo.id
              ? {
                  ...f,
                  status: "success" as const,
                  uploadedUrl: response.file_url,
                  uploadedData: response,
                }
              : f
          )
        );

        addToast({
          color: "success",
          description: `文件 ${fileInfo.file.name} 上传成功`,
        });
      } else {
        throw new Error("上传失败");
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileInfo.id ? { ...f, status: "error" as const } : f
        )
      );

      addToast({
        color: "danger",
        description: `文件 ${fileInfo.file.name} 上传失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      });
    }
  };

  // 提交
  const handleSubmit = async () => {
    // 验证必填字段
    if (!datasetName.trim()) {
      addToast({
        color: "danger",
        description: "请输入数据集名称",
      });
      return;
    }

    if (!category) {
      addToast({
        color: "danger",
        description: "请选择大分类",
      });
      return;
    }

    if (files.length === 0) {
      addToast({
        color: "danger",
        description: "请选择要上传的文件",
      });
      return;
    }

    // 检查是否有文件还在上传中
    const uploadingFiles = files.filter((f) => f.status === "uploading");
    if (uploadingFiles.length > 0) {
      addToast({
        color: "warning",
        description: "有文件正在上传中，请等待上传完成",
      });
      return;
    }

    // 检查是否有文件上传失败
    const errorFiles = files.filter((f) => f.status === "error");
    if (errorFiles.length > 0) {
      addToast({
        color: "danger",
        description: "有文件上传失败，请重新上传或删除失败的文件",
      });
      return;
    }

    if (!userInfo?.user_id) {
      addToast({
        color: "danger",
        description: "用户信息错误，请重新登录",
      });
      return;
    }

    // 检查OSS连接状态
    if (ossConnected === false) {
      addToast({
        color: "warning",
        description: "OSS连接异常，但仍可尝试提交",
      });
    }

    setUploading(true);

    try {
      // 获取已上传成功的文件
      const uploadedFiles = files.filter((f) => f.status === "success");

      if (uploadedFiles.length === 0) {
        addToast({
          color: "danger",
          description: "没有成功上传的文件",
        });
        return;
      }

      // 检查上传数据是否完整
      const incompleteFiles = uploadedFiles.filter((f) => !f.uploadedData);
      if (incompleteFiles.length > 0) {
        addToast({
          color: "danger",
          description: "有文件上传数据不完整，请重新上传",
        });
        return;
      }

      const categoryNumber = Number(category);

      const str = {
        name: datasetName,
        category: categoryNumber,
        remark: tags.join(","),
        files: uploadedFiles.map((file) => ({
          file_name: file.uploadedData!.file_name,
          file_path: file.uploadedData!.file_path,
          file_url: file.uploadedData!.file_url,
          file_size: file.uploadedData!.file_size,
          original_annotation: "",
        })),
      };
      console.log("🚀 ~ handleSubmit ~ str:", str);

      const response = await createOriginalDataRequest(str);

      if (response.success) {
        addToast({
          color: "success",
          description: "数据集创建成功！已可供学生使用",
        });

        // 延迟2秒后跳转到列表页
        setTimeout(() => {
          navigate("/list");
        }, 2000);
      } else {
        addToast({
          color: "danger",
          description: response.message || "数据集创建失败",
        });
      }
    } catch (error) {
      console.error("提交错误:", error);
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const removeFile = (fileId: string) => {
    if (uploading) return;
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // 清空所有文件
  const clearAllFiles = () => {
    if (uploading) return;
    setFiles([]);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 获取状态颜色
  const getStatusColor = (status: FileInfo["status"]) => {
    switch (status) {
      case "pending":
        return "default";
      case "uploading":
        return "primary";
      case "success":
        return "success";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  // 获取状态文本
  const getStatusText = (status: FileInfo["status"]) => {
    switch (status) {
      case "pending":
        return "等待上传";
      case "uploading":
        return "上传中";
      case "success":
        return "上传成功";
      case "error":
        return "上传失败";
      default:
        return "未知状态";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题和OSS状态 */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              上传 DICOM 数据集
            </h1>
          </div>

          {/* OSS连接状态 */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardBody className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full shadow-sm ${
                        ossConnected === true
                          ? "bg-green-500 animate-pulse"
                          : ossConnected === false
                          ? "bg-red-500"
                          : "bg-yellow-500 animate-pulse"
                      }`}
                    ></div>
                    <span className="text-sm font-semibold text-gray-700">
                      OSS存储状态：
                      {ossConnected === true && (
                        <span className="text-green-600 ml-2 font-medium">
                          ✓ 连接正常
                        </span>
                      )}
                      {ossConnected === false && (
                        <span className="text-red-600 ml-2 font-medium">
                          ✗ 连接异常
                        </span>
                      )}
                      {ossConnected === null && (
                        <span className="text-yellow-600 ml-2 font-medium">
                          ⏳ 检查中...
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onClick={checkOssConnection}
                  isLoading={ossConnected === null}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                  aria-label="重新检测OSS连接状态"
                >
                  重新检测
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 左侧：数据集信息 */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    数据集信息
                  </h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="dataset-name"
                  >
                    数据集名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="dataset-name"
                    placeholder="请输入数据集名称，例如：胸部CT影像-案例01"
                    value={datasetName}
                    onValueChange={setDatasetName}
                    variant="bordered"
                    aria-label="数据集名称"
                  />
                  <p className="text-xs text-gray-500">
                    给您的数据集起一个清晰、描述性的名称
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="image-type"
                  >
                    医学影像类型 <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="image-type"
                    placeholder="请选择医学影像类型"
                    selectedKeys={category ? [category] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setCategory(selectedKey || "");
                    }}
                    variant="bordered"
                    aria-label="医学影像类型"
                    classNames={{
                      trigger: "min-h-12",
                      value: "text-foreground",
                    }}
                  >
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                  <p className="text-xs text-gray-500">
                    选择此数据集的医学影像类型
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="tag-input"
                    >
                      添加标签 <span className="text-gray-400">(可选)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="tag-input"
                        placeholder="输入标签名称"
                        value={newTag}
                        onValueChange={setNewTag}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        variant="bordered"
                        className="flex-1"
                        aria-label="添加标签"
                      />
                      <Button
                        size="lg"
                        color="primary"
                        variant="flat"
                        onClick={addTag}
                        isDisabled={!newTag.trim() || tags.length >= 3}
                        aria-label="添加标签到列表"
                      >
                        添加
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      最多可添加3个标签，当前已添加{tags.length}个 (可选)
                    </p>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        color="primary"
                        variant="flat"
                        onClose={() => removeTag(tag)}
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* 右侧：文件上传 */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      文件上传
                    </h2>
                  </div>
                  {files.length > 0 && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onClick={clearAllFiles}
                      isDisabled={uploading}
                      className="shadow-md hover:shadow-lg transition-all duration-200"
                      aria-label="清空所有已选择的文件"
                    >
                      清空所有文件
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                {/* 拖拽上传区域 */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                      : files.length === 0
                      ? "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-6">
                    <div
                      className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                        dragActive
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 scale-110"
                          : "bg-gradient-to-r from-gray-100 to-gray-200"
                      }`}
                    >
                      <svg
                        className={`w-10 h-10 transition-all duration-300 ${
                          dragActive ? "text-white" : "text-gray-400"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {dragActive ? "放开以选择文件" : "选择 DICOM 文件"}
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        支持{" "}
                        <span className="font-semibold text-blue-600">
                          .dcm
                        </span>{" "}
                        和{" "}
                        <span className="font-semibold text-blue-600">
                          .dicom
                        </span>{" "}
                        格式
                        <br />
                        可选择多个文件，单个文件大小不超过 1MB
                      </p>

                      <Button
                        color="primary"
                        size="lg"
                        onClick={() => fileInputRef.current?.click()}
                        isDisabled={uploading}
                        className="shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600"
                        aria-label="选择DICOM文件上传"
                        startContent={
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        }
                      >
                        选择文件
                      </Button>

                      <p className="text-sm text-gray-500 mt-4 font-medium">
                        💡 或拖拽文件到此区域
                      </p>
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".dcm,.dicom"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  aria-label="选择DICOM文件上传"
                />

                {/* 文件列表 */}
                {files.length > 0 && (
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">
                          已选择的文件 ({files.length})
                        </h3>
                      </div>
                      <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        总大小:{" "}
                        {formatFileSize(
                          files.reduce((sum, file) => sum + file.file.size, 0)
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {files.map((fileInfo) => (
                        <Card
                          key={fileInfo.id}
                          className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        >
                          <CardBody className="p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-primary-100 rounded-md flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-primary-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {fileInfo.file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(fileInfo.file.size)}
                                    </p>
                                  </div>
                                </div>

                                {fileInfo.status === "uploading" && (
                                  <div className="mt-1">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      <span className="text-xs text-blue-600">
                                        上传中...
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-1">
                                <Chip
                                  color={getStatusColor(fileInfo.status)}
                                  size="sm"
                                  variant="flat"
                                >
                                  {getStatusText(fileInfo.status)}
                                </Chip>

                                {fileInfo.status === "pending" && (
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onClick={() => removeFile(fileInfo.id)}
                                    isDisabled={uploading}
                                    isIconOnly
                                    aria-label={`删除文件 ${fileInfo.file.name}`}
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </Button>
                                )}
                                {fileInfo.status === "error" && (
                                  <div className="flex space-x-0.5">
                                    <Button
                                      size="sm"
                                      color="primary"
                                      variant="flat"
                                      onClick={() => uploadFile(fileInfo)}
                                      isDisabled={uploading}
                                      isIconOnly
                                      aria-label={`重新上传文件 ${fileInfo.file.name}`}
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                    </Button>
                                    <Button
                                      size="sm"
                                      color="danger"
                                      variant="light"
                                      onClick={() => removeFile(fileInfo.id)}
                                      isDisabled={uploading}
                                      isIconOnly
                                      aria-label={`删除文件 ${fileInfo.file.name}`}
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 底部提交区域 */}
        <Card className="mt-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex flex-col space-y-6">
              {/* 创建状态提示 */}
              {uploading && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <p className="text-sm font-bold text-blue-800">
                        🚀 正在创建数据集，请不要关闭页面...
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        创建完成后您可以在列表中查看，学生也可以访问此数据集
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* OSS连接警告 */}
              {ossConnected === false && !uploading && (
                <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yellow-800">
                        ⚠️ OSS连接异常，但仍可尝试创建数据集
                      </p>
                      <p className="text-xs text-yellow-600 mt-2">
                        请检查网络连接或联系管理员
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <Button
                  color="default"
                  variant="flat"
                  onClick={() => navigate("/list")}
                  isDisabled={uploading}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                  aria-label="返回数据集列表页面"
                >
                  ← 返回列表
                </Button>

                <Button
                  color="primary"
                  size="lg"
                  onClick={handleSubmit}
                  isLoading={uploading}
                  isDisabled={
                    !datasetName.trim() ||
                    !category ||
                    files.length === 0 ||
                    uploading ||
                    (files.length > 0 && files[0].status === "uploading") ||
                    (files.length > 0 && files[0].status === "error")
                  }
                  className="shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600"
                  aria-label={uploading ? "正在创建数据集" : "创建数据集"}
                  startContent={
                    !uploading && (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )
                  }
                >
                  {uploading ? "🚀 创建中..." : "✨ 创建数据集"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default UploadPage;
