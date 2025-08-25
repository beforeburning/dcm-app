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

    const newFiles: FileInfo[] = Array.from(selectedFiles)
      .filter(
        (file) =>
          file.name.toLowerCase().endsWith(".dcm") ||
          file.name.toLowerCase().endsWith(".dicom")
      )
      .map((file) => ({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: "pending" as const,
        progress: 0,
      }));

    if (newFiles.length === 0) {
      addToast({
        color: "warning",
        description: "请选择有效的 DICOM 文件（.dcm 或 .dicom 格式）",
      });
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  // 删除文件
  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // 清空所有文件
  const clearAllFiles = () => {
    setFiles([]);
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

  // 上传数据集
  const handleUpload = async () => {
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
        description: "请选择分类",
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
      // 模拟文件上传进度
      const fileList = files.map((f) => f.file);

      // 更新文件状态为上传中
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading" as const }))
      );

      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) => prev.map((f) => ({ ...f, progress: i })));
      }

      const response = await uploadDcmRequest(
        datasetName,
        userInfo.userId,
        userInfo.userName,
        fileList,
        category,
        tags
      );

      if (response.code === 200) {
        // 更新文件状态为成功
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "success" as const, progress: 100 }))
        );

        addToast({
          color: "success",
          description: "数据集上传成功！已可供学生使用",
        });

        // 延迟跳转到列表页
        setTimeout(() => {
          navigate("/list");
        }, 2000);
      } else {
        // 更新文件状态为错误
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "error" as const }))
        );

        addToast({
          color: "danger",
          description: response.message || "上传失败",
        });
      }
    } catch (error) {
      // 更新文件状态为错误
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error" as const })));

      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setUploading(false);
    }
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
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            上传 DICOM 数据集
          </h1>
          <p className="text-gray-600">
            上传医学影像数据供学生学习使用。支持 .dcm 和 .dicom 格式文件。
          </p>
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
                label="分类"
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
              {/* 拖拽上传区域 */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-500"
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
                    <p className="text-lg font-medium text-gray-900">
                      拖拽文件到此处或
                      <Button
                        color="primary"
                        variant="flat"
                        className="mx-2"
                        onClick={() => fileInputRef.current?.click()}
                        isDisabled={uploading}
                      >
                        选择文件
                      </Button>
                    </p>
                    <p className="text-gray-500 mt-2">
                      支持 .dcm 和 .dicom 格式，可选择多个文件
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
              />

              {/* 文件列表 */}
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      已选择的文件 ({files.length})
                    </h3>
                    <div className="text-sm text-gray-600">
                      总大小: {formatFileSize(totalSize)}
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {files.map((fileInfo) => (
                      <div
                        key={fileInfo.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {fileInfo.file.name}
                                </p>
                                <p className="text-sm text-gray-500">
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
                                  className="max-w-md"
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
                              >
                                删除
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <Button
                  color="default"
                  variant="flat"
                  onClick={() => navigate("/list")}
                  isDisabled={uploading}
                >
                  取消
                </Button>

                <div className="flex space-x-3">
                  <Button
                    color="primary"
                    onClick={handleUpload}
                    isLoading={uploading}
                    isDisabled={
                      !datasetName.trim() || !category || files.length === 0
                    }
                    className="min-w-32"
                  >
                    {uploading ? "上传中..." : "开始上传"}
                  </Button>
                </div>
              </div>

              {uploading && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    正在上传数据集，请不要关闭页面...
                  </p>
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
