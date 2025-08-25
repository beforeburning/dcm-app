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
          <div className="flex items-center space-x-3">
            {isDetailPage && (
              <button
                onClick={handleBack}
                className="group flex items-center justify-center w-9 h-9 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5"
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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">智</span>
              </div>
              <h1 className="text-xl font-bold text-white">智慧诊疗 v1.5</h1>
            </div>
          </div>

          {/* 右侧：用户信息和操作 */}
          <div className="flex items-center space-x-6">
            {/* 用户信息区域 */}
            <div className="flex items-center space-x-3">
              {/* 用户头像 */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {userInfo?.userName?.charAt(0) || "U"}
                </span>
              </div>

              {/* 用户信息 */}
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">
                  {userInfo?.userName || "Loading..."}
                </span>
                <span className="text-gray-400 text-xs">
                  {userInfo?.role === "admin"
                    ? "管理员"
                    : userInfo?.role === "teacher"
                    ? "老师"
                    : userInfo?.role === "student"
                    ? "学生"
                    : ""}
                </span>
              </div>
            </div>

            {/* 操作按钮组 */}
            <div className="flex items-center space-x-2">
              {/* 退出按钮 */}
              <button
                onClick={handleLogout}
                className="group relative cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                {/* 退出图标 */}
                <svg
                  className="w-4 h-4 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-sm font-medium">退出</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderComponents;
