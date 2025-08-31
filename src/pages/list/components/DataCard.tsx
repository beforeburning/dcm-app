import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import type { DcmData, StudentListItem } from "@/api/dcm";
import {
  copyPublicDataToPrivateRequest,
  deleteOriginalDataRequest,
  updateCopyNameRequest,
} from "@/api/dcm";
import { useUserAuth } from "@/hooks/useUserAuth";

interface DataCardProps {
  dcm: DcmData | StudentListItem;
  onFileClick: (id: string) => void;
  onDataChange?: () => void; // 数据变化回调，用于刷新列表
  onCopySuccess?: () => void; // 复制成功回调，用于切换标签页
  showOwnerInfo?: boolean;
  isPublicData?: boolean; // 是否为公共数据
  isStudentData?: boolean; // 是否为学生数据
  showCopyButton?: boolean; // 是否显示复制按钮
}

function DataCard({
  dcm,
  onFileClick,
  onDataChange,
  onCopySuccess,
  showOwnerInfo = false,
  isPublicData = false,
  isStudentData = false,
  showCopyButton = true,
}: DataCardProps): React.JSX.Element {
  const navigate = useNavigate();
  const { userInfo, isAdmin, isTeacher, isStudent } = useUserAuth();

  const [loading, setLoading] = useState<{
    copy: boolean;
    delete: boolean;
  }>({ copy: false, delete: false });

  // 修改名称相关状态
  const [showNameModal, setShowNameModal] = useState(false);
  const [newCopyName, setNewCopyName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // 辅助函数：安全获取数据属性
  const getDataName = (data: DcmData | StudentListItem): string => {
    if ("name" in data) return data.name;
    return data.copy_name || data.original_data.name;
  };

  const getDataCategory = (data: DcmData | StudentListItem): number => {
    if ("category" in data) return data.category;
    return data.original_data.category;
  };

  const getDataRemark = (data: DcmData | StudentListItem): string => {
    if ("remark" in data) return data.remark;
    return data.original_data.remark;
  };

  // 分类显示映射
  const getCategoryLabel = (category?: number): string => {
    const categoryMap: { [key: number]: string } = {
      1: "X光",
      2: "CT",
      3: "MRI",
      4: "超声",
      5: "PET",
    };
    return category ? categoryMap[category] || "未分类" : "未分类";
  };

  // 处理复制数据
  const handleCopyData = async () => {
    if (!userInfo?.user_id) {
      addToast({
        color: "danger",
        description: "用户信息错误，请重新登录",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, copy: true }));
    try {
      const res = await copyPublicDataToPrivateRequest({
        original_id: dcm.original_id,
        copy_name: `${getDataName(dcm)} - 复制`,
      });

      if (res.success) {
        addToast({
          color: "success",
          description: "复制成功！数据已添加到您的账户",
        });
        onDataChange?.();
        onCopySuccess?.(); // 通知父组件切换标签页
      } else {
        addToast({
          color: "danger",
          description: res.message || "复制失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setLoading((prev) => ({ ...prev, copy: false }));
    }
  };

  // 处理修改复制名称
  const handleUpdateCopyName = async () => {
    if (!newCopyName.trim()) {
      addToast({
        color: "danger",
        description: "请输入新的复制名称",
      });
      return;
    }

    // 检查是否为 StudentListItem 类型
    if (!("user_copy_id" in dcm)) {
      addToast({
        color: "danger",
        description: "只能修改复制的数据名称",
      });
      return;
    }

    setIsUpdatingName(true);
    try {
      const res = await updateCopyNameRequest(
        dcm.user_copy_id,
        newCopyName.trim()
      );

      if (res.success) {
        addToast({
          color: "success",
          description: "复制名称修改成功",
        });
        setShowNameModal(false);
        setNewCopyName("");
        onDataChange?.(); // 刷新数据
      } else {
        addToast({
          color: "danger",
          description: res.message || "修改失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  // 处理删除数据
  const handleDeleteData = async () => {
    if (!userInfo?.user_id) {
      addToast({
        color: "danger",
        description: "用户信息错误，请重新登录",
      });
      return;
    }

    // 二次确认
    if (
      !confirm(`确定要删除数据集 "${getDataName(dcm)}" 吗？此操作不可撤销。`)
    ) {
      return;
    }

    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      //@ts-ignore
      const res = await deleteOriginalDataRequest(dcm?.user_copy_id || 0);

      if (res.success) {
        addToast({
          color: "success",
          description: "删除成功",
        });
        onDataChange?.();
      } else {
        addToast({
          color: "danger",
          description: res.message || "删除失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div
            className="flex-1"
            onClick={() => onFileClick(dcm.original_id.toString())}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getDataName(dcm)}
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                创建时间: {new Date(dcm.created_at).toLocaleDateString("zh-CN")}{" "}
                | 更新时间:{" "}
                {new Date(dcm.updated_at).toLocaleDateString("zh-CN")}
              </p>
              {showOwnerInfo && dcm.original_id && (
                <p className="text-blue-600">数据ID: {dcm.original_id}</p>
              )}
              {/* 分类显示 */}
              {getDataCategory(dcm) && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">分类:</span>
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="text-xs"
                  >
                    {getCategoryLabel(getDataCategory(dcm))}
                  </Chip>
                </div>
              )}

              {/* 标签显示 */}
              {getDataRemark(dcm) && getDataRemark(dcm).trim() && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">标签:</span>
                  <div className="flex space-x-1">
                    {getDataRemark(dcm)
                      .split(",")
                      .map((tag, index) => (
                        <Chip
                          key={index}
                          size="sm"
                          color="secondary"
                          variant="flat"
                          className="text-xs"
                        >
                          {tag.trim()}
                        </Chip>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* 学生：显示拷贝按钮 */}
            {isStudent && showCopyButton && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                isLoading={loading.copy}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyData();
                }}
              >
                拷贝
              </Button>
            )}

            {/* 编辑按钮：公共数据或非公共数据 */}
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              onClick={(e) => {
                e.stopPropagation();
                if (isPublicData) {
                  navigate(`/edit/${dcm.original_id}`);
                } else if ("user_copy_id" in dcm) {
                  // 如果是复制的数据，显示修改名称模态框
                  setNewCopyName(getDataName(dcm));
                  setShowNameModal(true);
                }
              }}
            >
              {isPublicData ? "编辑" : "修改名称"}
            </Button>

            {/* 删除按钮：非公共数据的管理员和老师可以删除 */}
            {isStudentData && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                isLoading={loading.delete}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteData();
                }}
              >
                删除
              </Button>
            )}
          </div>
        </div>
      </CardBody>

      {/* 修改名称模态框 */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                修改复制名称
              </h3>
              <button
                onClick={() => setShowNameModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新的复制名称
                </label>
                <input
                  type="text"
                  value={newCopyName}
                  onChange={(e) => setNewCopyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入新的复制名称"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNameModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isUpdatingName}
              >
                取消
              </button>
              <button
                onClick={handleUpdateCopyName}
                disabled={isUpdatingName}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdatingName ? "修改中..." : "确认修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default DataCard;
