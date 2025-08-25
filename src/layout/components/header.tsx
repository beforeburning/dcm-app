import React from "react";
import { addToast } from "@heroui/toast";
import { useAppStore } from "@/stores/app";
import { useLocation, useNavigate } from "react-router-dom";

const HeaderComponents = (): React.JSX.Element => {
  const { logout, userInfo } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isDetailPage = location.pathname.startsWith("/detail/");

  const handleLogout = (): void => {
    addToast({
      color: "success",
      description: "已退出登录",
    });
    logout();
  };

  const handleBack = (): void => {
    navigate(-1);
  };

  const handleTest = (): void => {
    navigate("/dicom-test");
  };

  return (
    <header className="bg-gray-800 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：返回按钮和应用标题 */}
          <div className="flex items-center">
            {isDetailPage && (
              <button
                onClick={handleBack}
                className="flex w-7 h-7 mr-1 items-center cursor-pointer text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg
                  className="w-7 h-7 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-white">智慧诊疗 v1.5</h1>
          </div>

          {/* 右侧：用户信息和操作 */}
          <div className="flex items-center space-x-4">
            {/* 用户信息 */}
            <div className="text-gray-300">
              <span className="text-sm">欢迎，</span>
              <span className="font-medium text-white">
                {userInfo?.userName || "Loading..."}
              </span>
            </div>

            {/* 退出按钮 */}
            <div
              onClick={handleLogout}
              className="bg-red-600 cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              退出登录
            </div>

            {/* 测试按钮 */}
            <div
              onClick={handleTest}
              className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              测试
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderComponents;
