import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { DcmData, StudentListItem } from "@/types/api";
import {
  copyPublicDataToPrivateRequest,
  deleteOriginalDataRequest,
  updateCopyNameRequest,
} from "@/api/dicom";
import { useUserAuth } from "@/hooks/useUserAuth";
import { errorHandler } from "@/utils/errorHandler";
import DataCardInfo from "@/components/data/DataCardInfo";
import DataCardActions from "@/components/data/DataCardActions";
import NameEditModal from "@/components/data/NameEditModal";
import { ConfirmDialog } from "@/components/common";

interface DataCardProps {
  dcm: DcmData | StudentListItem;
  onFileClick: (id: string) => void;
  onDataChange?: () => void;
  onCopySuccess?: () => void;
  showOwnerInfo?: boolean;
  isPublicData?: boolean;
  isStudentData?: boolean;
  showCopyButton?: boolean;
  showEditButton?: boolean;
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
  showEditButton = false,
}: DataCardProps): React.JSX.Element {
  const { userInfo } = useUserAuth();

  const [loading, setLoading] = useState<{
    copy: boolean;
    delete: boolean;
  }>({ copy: false, delete: false });

  const [showNameModal, setShowNameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 获取数据名称
  const getDataName = (data: DcmData | StudentListItem): string => {
    if ("name" in data) return data.name;
    return data.copy_name || data.original_data.name;
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
        onCopySuccess?.();
      } else {
        errorHandler.handleApiError(new Error(res.message), "复制失败");
      }
    } catch (error) {
      errorHandler.handleApiError(error, "复制失败");
    } finally {
      setLoading((prev) => ({ ...prev, copy: false }));
    }
  };

  // 处理修改复制名称
  const handleUpdateCopyName = async (newName: string) => {
    if (!("user_copy_id" in dcm)) {
      addToast({
        color: "danger",
        description: "只能修改复制的数据名称",
      });
      return;
    }

    try {
      const res = await updateCopyNameRequest(dcm.user_copy_id, newName);

      if (res.success) {
        addToast({
          color: "success",
          description: "复制名称修改成功",
        });
        onDataChange?.();
      } else {
        errorHandler.handleApiError(new Error(res.message), "修改失败");
      }
    } catch (error) {
      errorHandler.handleApiError(error, "修改失败");
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

    // 检查是否为 StudentListItem 类型
    if (!("user_copy_id" in dcm)) {
      addToast({
        color: "danger",
        description: "只能删除复制的数据",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      const res = await deleteOriginalDataRequest(dcm.user_copy_id);

      if (res.success) {
        addToast({
          color: "success",
          description: "删除成功",
        });
        onDataChange?.();
      } else {
        errorHandler.handleApiError(new Error(res.message), "删除失败");
      }
    } catch (error) {
      errorHandler.handleApiError(error, "删除失败");
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div
              className="flex flex-1"
              onClick={() => {
                onFileClick(
                  (dcm as any)?.user_copy_id
                    ? (dcm as any)?.user_copy_id.toString()
                    : (dcm as any).original_id.toString()
                );
              }}
            >
              <DataCardInfo dcm={dcm} showOwnerInfo={showOwnerInfo} />
            </div>

            <DataCardActions
              dcm={dcm}
              loading={loading}
              isPublicData={isPublicData}
              isStudentData={isStudentData}
              showCopyButton={showCopyButton}
              showEditButton={showEditButton}
              onCopy={handleCopyData}
              onDelete={() => setShowDeleteConfirm(true)}
              onEditName={() => setShowNameModal(true)}
            />
          </div>
        </CardBody>
      </Card>

      {/* 名称编辑模态框 */}
      <NameEditModal
        isOpen={showNameModal}
        currentName={getDataName(dcm)}
        onClose={() => setShowNameModal(false)}
        onSave={handleUpdateCopyName}
        title="修改复制名称"
        placeholder="请输入新的复制名称"
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="确认删除"
        message={`确定要删除数据集 "${getDataName(dcm)}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        confirmColor="danger"
        onConfirm={handleDeleteData}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={loading.delete}
      />
    </>
  );
}

export default DataCard;
