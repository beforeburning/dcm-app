import React, { useEffect, useState } from "react";
import { Card, CardBody, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { getDcmListRequest, type DcmList } from "@/api/dcm";
import DataCard from "./DataCard";

interface PublicDataListProps {
  onFileClick: (id: string) => void;
  onCopyData?: (dcm: DcmList) => void;
  canCopyData?: boolean;
}

function PublicDataList({
  onFileClick,
  onCopyData,
  canCopyData = false,
}: PublicDataListProps): React.JSX.Element {
  const [data, setData] = useState<DcmList[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const pageSize = 10;

  // 获取公共数据列表
  const fetchData = async (currentPage: number = page) => {
    setLoading(true);
    try {
      const response = await getDcmListRequest(currentPage, pageSize);
      if (response.code === 200 && response.data) {
        setData(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setPage(response.data.page);
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
    setPage(newPage);
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
                key={dcm.id}
                dcm={dcm}
                onFileClick={onFileClick}
                onCopyData={onCopyData}
                showCopyButton={canCopyData}
                canCopyData={canCopyData}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center px-6 py-5">
              <Pagination
                total={totalPages}
                page={page}
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
