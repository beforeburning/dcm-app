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
  showEditButton?: boolean;
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
  showEditButton = false,
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
      {/* 公共数据：学生显示拷贝按钮，老师/admin显示编辑按钮 */}
      {isPublicData && (
        <>
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

          {/* 老师/admin：显示编辑按钮 */}
          {showEditButton && (isTeacher || isAdmin) && (
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              onClick={handleEdit}
            >
              编辑
            </Button>
          )}
        </>
      )}

      {/* 学生数据：学生显示修改名称和删除按钮，老师/admin不显示按钮 */}
      {isStudentData && isStudent && (
        <>
          <Button
            size="sm"
            color="secondary"
            variant="flat"
            onClick={handleEdit}
          >
            修改名称
          </Button>

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
        </>
      )}
    </div>
  );
};

export default DataCardActions;
