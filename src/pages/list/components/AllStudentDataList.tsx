import React, { useEffect, useState } from "react";
import { Card, CardBody, Input, Button, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { apiRequest } from "@/api/client";
import {
  type StudentListItem,
  type StudentUserCopyListResponse,
} from "@/types/api";
import DataCard from "./DataCard";

interface AllStudentDataListProps {
  onFileClick: (id: string) => void;
}

function AllStudentDataList({
  onFileClick,
}: AllStudentDataListProps): React.JSX.Element {
  const [data, setData] = useState<StudentListItem[]>([]);
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
      const response = await apiRequest.get<StudentUserCopyListResponse>(
        "/student/userCopyList",
        {
          keyword: search,
          per_page: pageSize,
          page: currentPage,
        }
      );

      if (response.success && response.data) {
        setData(response.data.list || []);
        setTotal(response.data.pagination.total || 0);
        setTotalPages(response.data.pagination.last_page || 0);
        setPage(response.data.pagination.current_page || currentPage);
      } else {
        addToast({
          color: "danger",
          description: response.message || "获取数据失败",
        });
      }
    } catch (error) {
      console.error("获取学生数据失败:", error);
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
          placeholder="搜索数据名称、拥有者、分类、标签"
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
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
                    key={`AllStudentDataList${dcm.user_copy_id}`}
                    dcm={dcm}
                    onFileClick={onFileClick}
                    onDataChange={fetchData}
                    showOwnerInfo={true}
                    isStudentData={true}
                    showCopyButton={false}
                    showEditButton={false}
                  />
                ))}
              </div>

              <div className="flex justify-center mt-6 w-full">
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  showControls
                  size="md"
                  color="primary"
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
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default AllStudentDataList;
