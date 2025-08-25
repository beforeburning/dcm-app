import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDcmListRequest, type DcmList } from "../../api/dcm";

function ListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [dcmList, setDcmList] = useState<DcmList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDcmList = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await getDcmListRequest();
        if (response.code === 200 && response.data) {
          setDcmList(response.data);
        } else {
          setError(response.message || "获取数据失败");
        }
      } catch {
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchDcmList();
  }, []);

  const handleFileClick = (id: string): void => {
    navigate(`/detail/${id}`);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">错误: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-7xl mx-auto">
        {/* 文件列表 */}
        <div className="bg-black-soft rounded-lg p-6">
          <h2 className="text-xl font-semibold text-black mb-2">
            文件列表 ({dcmList.length})
          </h2>

          {/* DCM文件列表 */}
          <div className="space-y-2">
            {dcmList.map((dcm) => (
              <div
                key={dcm.id}
                onClick={() => handleFileClick(dcm.id)}
                className="bg-gray-3 p-4 rounded-lg cursor-pointer hover:bg-gray-2 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{dcm.name}</h3>
                    <p className="text-white-soft text-sm">
                      文件数: {dcm.totalFiles} | 总大小:{" "}
                      {(dcm.totalSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-white-soft text-sm">
                      创建时间: {formatTime(dcm.createTime)} | 更新时间:{" "}
                      {formatTime(dcm.updateTime)}
                    </p>
                  </div>
                  <div className="text-white-soft text-sm">ID: {dcm.id}</div>
                </div>
              </div>
            ))}
          </div>

          {dcmList.length === 0 && (
            <div className="text-center py-8 text-white-soft">暂无DCM文件</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListPage;
