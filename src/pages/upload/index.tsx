import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Progress,
  Chip,
  Select,
  SelectItem,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { uploadDcmRequest } from "@/api/dcm";
import { useUserAuth } from "@/hooks/useUserAuth";

interface FileInfo {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
}

function UploadPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { userInfo, canUpload } = useUserAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [datasetName, setDatasetName] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // 如果没有上传权限，重定向到列表页
  if (!canUpload) {
    navigate("/list");
    return <div></div>;
  }

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

    // 创建文件信息但不直接上传
    const newFiles: FileInfo[] = validFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      status: "pending" as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
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
    { key: "xray", label: "X光" },
    { key: "ct", label: "CT" },
    { key: "mri", label: "MRI" },
    { key: "ultrasound", label: "超声" },
    { key: "pet", label: "PET" },
    { key: "pathology", label: "病理图像" },
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

  // 手动提交上传
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

    if (!userInfo?.userId || !userInfo?.userName) {
      addToast({
        color: "danger",
        description: "用户信息错误，请重新登录",
      });
      return;
    }

    setUploading(true);

    try {
      // 更新文件状态为上传中
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading" as const }))
      );

      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) => prev.map((f) => ({ ...f, progress: i })));
      }

      const fileList = files.map((f) => f.file);
      const response = await uploadDcmRequest(
        datasetName,
        userInfo.userId,
        userInfo.userName,
        fileList,
        category,
        tags
      );

      if (response.code === 200) {
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "success" as const, progress: 100 }))
        );

        addToast({
          color: "success",
          description: "数据集上传成功！已可供学生使用",
        });
      } else {
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "error" as const }))
        );

        addToast({
          color: "danger",
          description: response.message || "上传失败",
        });
      }
    } catch (error) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error" as const })));

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

  const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            上传 DICOM 数据集
          </h1>
        </div>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">数据集信息</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <Input
                label="数据集名称"
                placeholder="请输入数据集名称，例如：胸部CT影像-案例01"
                value={datasetName}
                onValueChange={setDatasetName}
                isRequired
                description="给您的数据集起一个清晰、描述性的名称"
              />

              <Select
                label="大分类"
                placeholder="请选择医学影像类型"
                selectedKeys={category ? [category] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setCategory(selectedKey || "");
                }}
                isRequired
                description="选择此数据集的医学影像类型"
              >
                {categoryOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    label="添加标签"
                    placeholder="输入标签名称"
                    value={newTag}
                    onValueChange={setNewTag}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    description={`最多可添加3个标签，当前已添加${tags.length}个`}
                    endContent={
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onClick={addTag}
                        isDisabled={!newTag.trim() || tags.length >= 3}
                      >
                        添加
                      </Button>
                    }
                  />
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
              </div>
            </CardBody>
          </Card>

          {/* 文件上传区域 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">文件上传</h2>
                {files.length > 0 && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onClick={clearAllFiles}
                    isDisabled={uploading}
                  >
                    清空所有文件
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-center p-6 space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary-600"
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    选择 DICOM 文件
                  </h3>
                  <p className="text-gray-500 mb-4">
                    支持 .dcm 和 .dicom 格式，可选择多个文件
                  </p>

                  <Button
                    color="primary"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    isDisabled={uploading}
                    startContent={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".dcm,.dicom"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* 文件列表 */}
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      已选择的文件 ({files.length})
                    </h3>
                    <div className="text-sm text-gray-600">
                      总大小:{" "}
                      {formatFileSize(
                        files.reduce((sum, file) => sum + file.file.size, 0)
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {files.map((fileInfo) => (
                      <Card
                        key={fileInfo.id}
                        className="border border-gray-200"
                      >
                        <CardBody className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-primary-600"
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
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {fileInfo.file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(fileInfo.file.size)}
                                  </p>
                                </div>
                              </div>

                              {fileInfo.status === "uploading" && (
                                <div className="mt-2">
                                  <Progress
                                    value={fileInfo.progress}
                                    color="primary"
                                    size="sm"
                                    showValueLabel={true}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
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
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
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

          {/* 提交按钮 */}
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <Button
                  color="default"
                  variant="flat"
                  onClick={() => navigate("/list")}
                  isDisabled={uploading}
                >
                  返回列表
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
                    uploading
                  }
                  startContent={
                    !uploading && (
                      <svg
                        className="w-5 h-5"
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
                    )
                  }
                >
                  {uploading ? "上传中..." : "提交上传"}
                </Button>
              </div>

              {/* 上传状态提示 */}
              {uploading && (
                <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <p className="text-sm font-medium text-primary-800">
                        正在上传数据集，请不要关闭页面...
                      </p>
                      <p className="text-xs text-primary-600 mt-1">
                        上传完成后您可以在列表中查看
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
