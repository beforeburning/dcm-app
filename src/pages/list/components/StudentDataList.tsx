import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardBody, Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { getStudentDcmListRequest, type DcmList } from "@/api/dcm";
import DataCard from "./DataCard";

interface StudentDataListProps {
  userId: string;
  onFileClick: (id: string) => void;
  onEditName?: (dcm: DcmList) => void;
  canEditOwnData?: boolean;
}

export interface StudentDataListRef {
  refresh: () => void;
}

const StudentDataList = forwardRef<StudentDataListRef, StudentDataListProps>(
  ({ userId, onFileClick, onEditName, canEditOwnData = false }, ref) => {
    const [data, setData] = useState<DcmList[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const pageSize = 10;

    // 获取学生个人数据
    const fetchData = async (currentPage: number = page) => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await getStudentDcmListRequest(
          userId,
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
          <div className="text-gray-500">加载中...</div>
        </div>
      );
    }

    return (
      <div className="py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            我的数据列表 ({total})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            您复制的数据，可以编辑名称
          </p>
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
                      onEditName={onEditName}
                      showEditButton={true}
                      canEditOwnData={canEditOwnData}
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
