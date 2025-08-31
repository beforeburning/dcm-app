import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import type { DcmData } from "@/api/dcm";
import { getDcmDetailRequest } from "@/api/dcm";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAppStore } from "@/stores/app";

function EditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasTeacherPermission, userInfo } = useUserAuth();
  const { userInfo: storeUserInfo } = useAppStore();

  const [dcmData, setDcmData] = useState<DcmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // 权限检查
  useEffect(() => {
    if (!hasTeacherPermission) {
      addToast({
        color: "danger",
        description: "您没有权限访问此页面",
      });
      navigate("/list");
      return;
    }
  }, [hasTeacherPermission, navigate]);

  // 分类选项
  const categoryOptions = [
    { key: "xray", label: "X光" },
    { key: "ct", label: "CT" },
    { key: "mri", label: "MRI" },
    { key: "ultrasound", label: "超声" },
    { key: "pet", label: "PET" },
    { key: "pathology", label: "病理图像" },
  ];

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        addToast({
          color: "danger",
          description: "数据ID无效",
        });
        navigate("/list");
        return;
      }

      setLoading(true);
      try {
        const response = await getDcmDetailRequest(id);

        if (response.code === 200 && response.data) {
          const data = response.data;
          setDcmData(data);
          setName(data.name);
          setCategory(data.category || "");
          setTags(data.tags || []);
        } else {
          addToast({
            color: "danger",
            description: response.message || "加载数据失败",
          });
          navigate("/list");
        }
      } catch (error) {
        console.error("加载数据错误:", error);
        addToast({
          color: "danger",
          description: "加载数据失败",
        });
        navigate("/list");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

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

  // 保存修改
  const handleSave = async () => {
    if (!name.trim()) {
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

    if (!id || !storeUserInfo) {
      addToast({
        color: "danger",
        description: "缺少必要参数",
      });
      return;
    }

    setSaving(true);
    // try {
    //   const response = await updateDcmDataRequest(
    //     id,
    //     {
    //       name: name.trim(),
    //       category,
    //       tags,
    //     },
    //     storeUserInfo.user_id,
    //     storeUserInfo.role
    //   );

    //   if (response.code === 200) {
    //     addToast({
    //       color: "success",
    //       description: "保存成功",
    //     });
    //     navigate("/list");
    //   } else {
    //     addToast({
    //       color: "danger",
    //       description: response.message || "保存失败",
    //     });
    //   }
    // } catch (error) {
    //   console.error("保存错误:", error);
    //   addToast({
    //     color: "danger",
    //     description: "保存失败，请重试",
    //   });
    // } finally {
    //   setSaving(false);
    // }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  if (!dcmData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">数据不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="pb-4">
            <div className="w-full">
              <h1 className="text-2xl font-bold">编辑数据集</h1>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* 数据集名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数据集名称
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入数据集名称"
                disabled={saving}
              />
            </div>

            {/* 文件数量信息 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件信息
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
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
                  <span className="text-gray-700">
                    包含{" "}
                    <span className="font-semibold text-blue-600">
                      {dcmData.totalFiles}
                    </span>{" "}
                    个文件
                  </span>
                </div>
              </div>
            </div>

            {/* 分类选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                大分类
              </label>
              <Select
                selectedKeys={category ? [category] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setCategory(selectedKey || "");
                }}
                placeholder="请选择分类"
                disabled={saving}
              >
                {categoryOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>

            {/* 标签管理 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签 (最多3个)
              </label>

              {/* 已有标签 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      color="secondary"
                      variant="flat"
                      onClose={() => removeTag(tag)}
                      size="sm"
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}

              {/* 添加新标签 */}
              {tags.length < 3 && (
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addTag();
                      }
                    }}
                    placeholder="输入标签并按回车"
                    disabled={saving}
                    className="flex-1"
                  />
                  <Button
                    color="secondary"
                    variant="flat"
                    onClick={addTag}
                    disabled={!newTag.trim() || saving}
                  >
                    添加
                  </Button>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                color="default"
                variant="flat"
                onClick={() => navigate("/list")}
                disabled={saving}
              >
                取消
              </Button>
              <Button color="primary" isLoading={saving} onClick={handleSave}>
                保存修改
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default EditPage;
