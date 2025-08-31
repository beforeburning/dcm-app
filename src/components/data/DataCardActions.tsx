import React from "react";
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "@/hooks/useUserAuth";
import { DcmData, StudentListItem } from "@/types/api";

interface DataCardActionsProps {
  dcm: DcmData | StudentListItem;
  loading: {
    copy: boolean;
    delete: boolean;
  };
  isPublicData?: boolean;
  isStudentData?: boolean;
  showCopyButton?: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onEditName: () => void;
}

const DataCardActions: React.FC<DataCardActionsProps> = ({
  dcm,
  loading,
  isPublicData = false,
  isStudentData = false,
  showCopyButton = true,
  onCopy,
  onDelete,
  onEditName,
}) => {
  const navigate = useNavigate();
  const { isAdmin, isTeacher, isStudent } = useUserAuth();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPublicData) {
      navigate(`/edit/${dcm.original_id}`);
    } else if ("user_copy_id" in dcm) {
      onEditName();
    }
  };

  return (
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
            onCopy();
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
        onClick={handleEdit}
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
            onDelete();
          }}
        >
          删除
        </Button>
      )}
    </div>
  );
};

export default DataCardActions;
