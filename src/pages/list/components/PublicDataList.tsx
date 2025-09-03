import React, { useEffect, useState } from "react";
import { Card, CardBody, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { apiRequest } from "@/api/client";
import { type DcmData } from "@/types/api";
import DataCard from "./DataCard";
import { useUserAuth } from "@/hooks/useUserAuth";
import { getOriginalDataListRequest } from "@/api";

interface PublicDataListProps {
  onFileClick: (id: string) => void;
  onCopySuccess?: () => void;
}

function PublicDataList({
  onFileClick,
  onCopySuccess,
}: PublicDataListProps): React.JSX.Element {
  const { isStudent, hasTeacherPermission } = useUserAuth();
  const [data, setData] = useState<DcmData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined
  );

  // 获取公共数据列表
  const fetchData = async (
    page: number = currentPage,
    categoryArg?: string | null
  ) => {
    setLoading(true);
    try {
      const finalCategory =
        categoryArg === null ? undefined : categoryArg ?? categoryFilter;
      const response = await getOriginalDataListRequest(
        page,
        perPage,
        undefined,
        finalCategory || undefined
      );
      if (response.success && response.data) {
        setData(response.data.list || []);
        setTotal(response.data.pagination.total || 0);
        setLastPage(response.data.pagination.last_page || 0);
        setCurrentPage(response.data.pagination.current_page || page);
        setPerPage(response.data.pagination.per_page || perPage);
      } else {
        addToast({
          color: "danger",
          description: response.message || "获取数据失败",
        });
      }
    } catch (error) {
      console.error("获取公共数据失败:", error);
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
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-800">
          公共数据列表 ({total})
        </h2>
        <div className="flex gap-x-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">按分类筛选:</label>
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setCategoryFilter(undefined);
                  setCurrentPage(1);
                  fetchData(1, null);
                  return;
                }
                setCategoryFilter(val);
                setCurrentPage(1);
                fetchData(1, val);
              }}
              className="px-2 py-1 border rounded text-sm bg-white"
            >
              <option value="">所有</option>
              <option value="1">X光影像</option>
              <option value="2">CT</option>
              <option value="3">MRI</option>
              <option value="4">超声</option>
              <option value="5">PET</option>
              <option value="6">病理图像</option>
            </select>
          </div>
          <button
            onClick={() => fetchData(1, categoryFilter ?? undefined)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      <Card>
        <CardBody className="p-6">
          {data.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              暂无数据，试试更改筛选条件
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((dcm) => (
                <DataCard
                  key={`PublicDataList${dcm.original_id}`}
                  dcm={dcm}
                  onFileClick={onFileClick}
                  onDataChange={fetchData}
                  onCopySuccess={onCopySuccess}
                  isPublicData={true}
                  showCopyButton={isStudent}
                  showEditButton={hasTeacherPermission}
                />
              ))}
            </div>
          )}

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
