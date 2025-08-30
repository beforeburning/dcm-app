import React, { useEffect, useState } from "react";
import { Card, CardBody, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { getOriginalDataListRequest, type DcmData } from "@/api/dcm_new";
import { type DcmList } from "@/api/dcm";
import DataCard from "./DataCard";

interface PublicDataListProps {
  onFileClick: (id: string) => void;
  onCopySuccess?: () => void;
}

function PublicDataList({
  onFileClick,
  onCopySuccess,
}: PublicDataListProps): React.JSX.Element {
  const [data, setData] = useState<DcmData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // 将 DcmData 转换为 DcmList 格式
  const convertDcmDataToDcmList = (dcmData: DcmData): DcmList => {
    return {
      id: dcmData.original_id.toString(),
      name: dcmData.name,
      createTime: new Date(dcmData.created_at).getTime() / 1000, // 转换为秒级时间戳
      updateTime: new Date(dcmData.updated_at).getTime() / 1000, // 转换为秒级时间戳
      files: dcmData.files || [],
      totalFiles: dcmData.file_count,
      totalSize: dcmData.total_size,
      category: dcmData.category,
      tags: dcmData.tags,
      isPublic: dcmData.status === 'active',
      ownerId: undefined, // 公共数据不需要所有者ID
      ownerName: undefined, // 公共数据不需要所有者名称
      originalId: dcmData.original_id.toString(),
    };
  };

  // 获取公共数据列表
  const fetchData = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const response = await getOriginalDataListRequest(page, perPage);
      if (response.success && response.data) {
        setData(response.data.list);
        setTotal(response.data.total);
        setLastPage(response.data.last_page);
        setCurrentPage(response.data.current_page);
        setPerPage(response.data.per_page);
      } else {
        addToast({
          color: "danger",
          description: response.message || "获取数据失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请稍后重试",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchData(newPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无数据</div>;
  }

  return (
    <div className="pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          公共数据列表 ({total})
        </h2>
      </div>

      <Card>
        <CardBody className="p-6">
          <div className="space-y-4">
            {data.map((dcm) => (
              <DataCard
                key={dcm.original_id}
                dcm={convertDcmDataToDcmList(dcm)}
                onFileClick={onFileClick}
                onDataChange={fetchData}
                onCopySuccess={onCopySuccess}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center px-6 py-5">
              <Pagination
                total={lastPage}
                page={currentPage}
                onChange={handlePageChange}
                showControls
                size="md"
                color="primary"
                variant="flat"
                radius="md"
                classNames={{
                  wrapper: "gap-4 overflow-visible h-12",
                  item: "w-12 h-12 text-base cursor-pointer",
                  cursor: "w-12 h-12 text-base cursor-pointer",
                  prev: "w-12 h-12 text-base cursor-pointer",
                  next: "w-12 h-12 text-base cursor-pointer",
                  ellipsis: "w-12 h-12 text-base cursor-pointer",
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default PublicDataList;
