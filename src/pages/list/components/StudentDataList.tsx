import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardBody, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import {
  getStudentDataListRequest,
  type StudentDataItem,
  type DcmData,
} from "@/api/dcm";
import DataCard from "./DataCard";

interface StudentDataListProps {
  userId: string;
  onFileClick: (id: string) => void;
}

export interface StudentDataListRef {
  refresh: () => void;
}

const StudentDataList = forwardRef<StudentDataListRef, StudentDataListProps>(
  ({ userId, onFileClick }, ref) => {
    const [data, setData] = useState<StudentDataItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const pageSize = 10;

    // 将 StudentDataItem 转换为 DcmData 格式
    const convertStudentDataToDcmData = (
      studentData: StudentDataItem
    ): DcmData => {
      return {
        id: studentData.original_id,
        name: studentData.name,
        description: studentData.original_annotation || undefined,
        category:
          studentData.category === 0
            ? "未分类"
            : studentData.category === 1
            ? "X光"
            : studentData.category === 2
            ? "CT"
            : studentData.category === 3
            ? "MRI"
            : studentData.category === 4
            ? "超声"
            : studentData.category === 5
            ? "PET"
            : studentData.category === 6
            ? "病理图像"
            : "其他",
        tags: studentData.tags.map((tag) => tag.tag_name),
        status: (studentData.active_flag === 1 ? "active" : "inactive") as
          | "active"
          | "inactive",
        file_count: 1, // 学生数据通常是单个文件
        total_size: studentData.file_size,
        created_at: studentData.created_at,
        updated_at: studentData.updated_at,
        files: [
          {
            id: studentData.original_id,
            name: studentData.file_name,
            size: studentData.file_size,
            path: studentData.file_path,
            original_data_id: studentData.original_id,
          },
        ],
      };
    };

    // 获取学生个人数据的列表
    const fetchData = async (currentPage: number = page) => {
      setLoading(true);
      try {
        const response = await getStudentDataListRequest(currentPage, pageSize);
        if (response.success && response.data) {
          setData(response.data.list);
          setTotal(response.data.pagination.total);
          setTotalPages(response.data.pagination.last_page);
          setPage(response.data.pagination.current_page);
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
      fetchData(newPage);
    };

    // 暴露刷新方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        refresh: () => fetchData(1),
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
      <div className="py-6">
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
              onClick={() => fetchData(1)}
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
                  {data.map((studentData) => (
                    <DataCard
                      key={studentData.original_id}
                      dcm={convertStudentDataToDcmData(studentData)}
                      onFileClick={onFileClick}
                      onDataChange={fetchData}
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
);

StudentDataList.displayName = "StudentDataList";

export default StudentDataList;
