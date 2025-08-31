import React from "react";
import { Chip } from "@heroui/react";
import { DcmData, StudentListItem } from "@/types/api";

interface DataCardInfoProps {
  dcm: DcmData | StudentListItem;
  showOwnerInfo?: boolean;
}

const DataCardInfo: React.FC<DataCardInfoProps> = ({ dcm, showOwnerInfo = false }) => {
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

  return (
    <div className="flex-1" onClick={() => {}}>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {getDataName(dcm)}
      </h3>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          创建时间: {new Date(dcm.created_at).toLocaleDateString("zh-CN")} | 更新时间:{" "}
          {new Date(dcm.updated_at).toLocaleDateString("zh-CN")}
        </p>
        {showOwnerInfo && dcm.original_id && (
          <p className="text-blue-600">数据ID: {dcm.original_id}</p>
        )}
        
        {/* 分类显示 */}
        {getDataCategory(dcm) && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">分类:</span>
            <Chip size="sm" color="primary" variant="flat" className="text-xs">
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
  );
};

export default DataCardInfo;
