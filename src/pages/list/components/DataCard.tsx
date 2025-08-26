import React from "react";
import { Card, CardBody, Button } from "@heroui/react";
import type { DcmList } from "@/api/dcm";

interface DataCardProps {
  dcm: DcmList;
  onFileClick: (id: string) => void;
  onCopyData?: (dcm: DcmList) => void;
  onEditName?: (dcm: DcmList) => void;
  showCopyButton?: boolean;
  showEditButton?: boolean;
  showOwnerInfo?: boolean;
  canCopyData?: boolean;
  canEditOwnData?: boolean;
}

function DataCard({
  dcm,
  onFileClick,
  onCopyData,
  onEditName,
  showCopyButton = false,
  showEditButton = false,
  showOwnerInfo = false,
  canCopyData = false,
  canEditOwnData = false,
}: DataCardProps): React.JSX.Element {
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
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
            </div>
            <div className="mt-2 text-xs text-gray-500">ID: {dcm.id}</div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {showCopyButton && canCopyData && onCopyData && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyData(dcm);
                }}
              >
                复制到我的账户
              </Button>
            )}

            {showEditButton && canEditOwnData && onEditName && (
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditName(dcm);
                }}
              >
                编辑名称
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default DataCard;
