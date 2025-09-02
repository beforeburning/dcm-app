import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardBody, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { apiRequest } from "@/api/client";
import {
  type StudentListItem,
  type StudentUserCopyListResponse,
} from "@/types/api";
import DataCard from "./DataCard";
import { useUserAuth } from "@/hooks/useUserAuth";

interface StudentDataListProps {
  userId: string;
  onFileClick: (id: string) => void;
}

export interface StudentDataListRef {
  refresh: () => void;
}

const StudentDataList = forwardRef<StudentDataListRef, StudentDataListProps>(
  ({ userId, onFileClick }, ref) => {
    const { isStudent } = useUserAuth();
    const [data, setData] = useState<StudentListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const pageSize = 10;

    // 获取学生个人数据的列表
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get<StudentUserCopyListResponse>(
          "/student/userCopyList",
          {
            user_id: Number(userId),
            page,
            per_page: pageSize,
          }
        );

        if (response.success && response.data) {
          setData(response.data.list || []);
          setTotal(response.data.pagination.total || 0);
          setTotalPages(response.data.pagination.last_page || 0);
          setPage(response.data.pagination.current_page || page);
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

    useEffect(() => {
      if (userId) {
        fetchData();
      }
    }, [userId]);

    const handlePageChange = (newPage: number) => {
      setPage(newPage);
      // getUserCopyListRequest 不支持分页，所以这里不需要传递页码
      fetchData();
    };

    // 暴露刷新方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        refresh: () => fetchData(),
      }),
      [userId]
    );

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
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                我的数据列表 ({total})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                您复制的数据，可以编辑名称
              </p>
            </div>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新
            </button>
          </div>
        </div>

        <Card>
          <CardBody className="p-6">
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无数据</div>
            ) : (
              <>
                <div className="space-y-4">
                  {data.map((item) => (
                    <>
                      <DataCard
                        key={`StudentDataList${item.user_copy_id}`}
                        dcm={item}
                        onFileClick={onFileClick}
                        onDataChange={fetchData}
                        isPublicData={false}
                        isStudentData={true}
                        showCopyButton={false}
                        showEditButton={false}
                      />
                    </>
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
);

StudentDataList.displayName = "StudentDataList";

export default StudentDataList;
