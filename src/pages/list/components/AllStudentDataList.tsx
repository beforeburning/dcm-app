import React, { useEffect, useState } from "react";
import { Card, CardBody, Input, Button, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { searchAllStudentDataRequest, type DcmList } from "@/api/dcm";
import DataCard from "./DataCard";

interface AllStudentDataListProps {
  onFileClick: (id: string) => void;
}

function AllStudentDataList({
  onFileClick,
}: AllStudentDataListProps): React.JSX.Element {
  const [data, setData] = useState<DcmList[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const pageSize = 10;

  // 获取所有学生数据（教师/管理员）
  const fetchData = async (
    currentPage: number = page,
    search: string = searchTerm
  ) => {
    setLoading(true);
    try {
      const response = await searchAllStudentDataRequest(
        search,
        currentPage,
        pageSize
      );
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

  // 搜索处理
  const handleSearch = () => {
    setPage(1);
    fetchData(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage, searchTerm);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 搜索防抖
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          所有学生数据 ({total})
        </h2>
      </div>

      {/* 搜索功能 */}
      <div className="mb-6">
        <Input
          placeholder="搜索数据名称、拥有者..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="max-w-md"
          endContent={
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onClick={handleSearch}
            >
              搜索
            </Button>
          }
        />
      </div>

      <Card>
        <CardBody className="p-6">
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无数据</div>
          ) : (
            <>
              <div className="space-y-4">
                {data.map((dcm) => (
                  <DataCard
                    key={dcm.id}
                    dcm={dcm}
                    onFileClick={onFileClick}
                    onDataChange={fetchData}
                    showOwnerInfo={true}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    total={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    showControls
                    size="md"
                    color="primary"
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default AllStudentDataList;
