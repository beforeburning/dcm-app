import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import type { DcmList } from "@/api/dcm";
import { copyDcmToStudentRequest, deleteDcmDataRequest } from "@/api/dcm";
import { useUserAuth } from "@/hooks/useUserAuth";

interface DataCardProps {
  dcm: DcmList;
  onFileClick: (id: string) => void;
  onDataChange?: () => void; // 数据变化回调，用于刷新列表
  onCopySuccess?: () => void; // 复制成功回调，用于切换标签页
  showOwnerInfo?: boolean;
}

function DataCard({
  dcm,
  onFileClick,
  onDataChange,
  onCopySuccess,
  showOwnerInfo = false,
}: DataCardProps): React.JSX.Element {
  const navigate = useNavigate();
  const { userInfo, isAdmin, isTeacher, isStudent } = useUserAuth();
  const [loading, setLoading] = useState<{
    copy: boolean;
    delete: boolean;
  }>({ copy: false, delete: false });

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
  };

  // 分类显示映射
  const getCategoryLabel = (category?: string): string => {
    const categoryMap: { [key: string]: string } = {
      xray: "X光",
      ct: "CT",
      mri: "MRI",
      ultrasound: "超声",
      pet: "PET",
      pathology: "病理图像",
    };
    return category ? categoryMap[category] || category : "未分类";
  };

  // 处理复制数据
  const handleCopyData = async () => {
    if (!userInfo?.userId || !userInfo?.userName) {
      addToast({
        color: "danger",
        description: "用户信息错误，请重新登录",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, copy: true }));
    try {
      const res = await copyDcmToStudentRequest(
        dcm.id,
        userInfo.userId,
        userInfo.userName
      );

      if (res.code === 200) {
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

  // 处理删除数据
  const handleDeleteData = async () => {
    if (!userInfo?.userId || !userInfo?.role) {
      addToast({
        color: "danger",
        description: "用户信息错误，请重新登录",
      });
      return;
    }

    // 二次确认
    if (!confirm(`确定要删除数据集 "${dcm.name}" 吗？此操作不可撤销。`)) {
      return;
    }

    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      const res = await deleteDcmDataRequest(
        dcm.id,
        userInfo.userId,
        userInfo.role
      );

      if (res.code === 200) {
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
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1" onClick={() => onFileClick(dcm.id)}>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {dcm.name}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                文件数: {dcm.totalFiles} | 总大小:{" "}
                {(dcm.totalSize / 1024 / 1024).toFixed(2)} MB
              </p>
              <p>
                创建时间: {formatTime(dcm.createTime)} | 更新时间:{" "}
                {formatTime(dcm.updateTime)}
              </p>
              {showOwnerInfo && dcm.ownerName && (
                <p className="text-blue-600">数据拥有者: {dcm.ownerName}</p>
              )}
              {/* 分类显示 */}
              {dcm.category && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">分类:</span>
                  <Chip
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="text-xs"
                  >
                    {getCategoryLabel(dcm.category)}
                  </Chip>
                </div>
              )}
              {/* 标签显示 */}
              {dcm.tags && dcm.tags.length > 0 && (
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-gray-500">标签:</span>
                  <div className="flex space-x-1">
                    {dcm.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        size="sm"
                        color="secondary"
                        variant="flat"
                        className="text-xs"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* 学生：只在公共数据且不是自己的数据时显示拷贝按钮 */}
            {isStudent && dcm.isPublic && dcm.ownerId !== userInfo?.userId && (
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

            {/* 管理员和老师：显示编辑和删除按钮 */}
            {(isAdmin || isTeacher) && (
              <>
                <Button
                  size="sm"
                  color="secondary"
                  variant="flat"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/edit/${dcm.id}`);
                  }}
                >
                  编辑
                </Button>
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
              </>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default DataCard;
