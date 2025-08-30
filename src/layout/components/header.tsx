import React from "react";
import { addToast } from "@heroui/toast";
import { useAppStore } from "@/stores/app";
import { useLocation, useNavigate } from "react-router-dom";

const HeaderComponents = (): React.JSX.Element => {
  const { logout, userInfo } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isDetailPage = location.pathname.startsWith("/detail/");
  const isAdminPage = location.pathname === "/admin";
  const isUploadPage = location.pathname === "/upload";
  const isEditPage = location.pathname.startsWith("/edit/");
  const isAdmin = userInfo?.role === "admin";
  const isTeacher = userInfo?.role === "teacher";
  const canUpload = isAdmin || isTeacher;

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

  const handleAdmin = (): void => {
    navigate("/admin");
  };

  const handleUpload = (): void => {
    navigate("/upload");
  };

  const handleHome = (): void => {
    navigate("/list");
  };

  return (
    <header className="bg-gray-800 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：返回按钮和应用标题 */}
          <div className="flex items-center space-x-3">
            {(isDetailPage || isAdminPage || isUploadPage || isEditPage) && (
              <button
                onClick={isDetailPage ? handleBack : handleHome}
                className="group flex items-center justify-center w-9 h-9 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isDetailPage ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  )}
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
                  {(userInfo?.user?.username || userInfo?.user?.name )?.charAt(0) || "U"}
                </span>
              </div>

              {/* 用户信息 */}
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">
                  {userInfo?.user?.username || userInfo?.user?.name || "未登录"}
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
              {/* 教师/管理员专用：上传按钮 */}
              {/*{canUpload && !isUploadPage && (*/}
              {true && (
                <button
                  onClick={handleUpload}
                  className="group cursor-pointer flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                >
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm font-medium">上传</span>
                </button>
              )}

              {/* 管理员专用：管理端按钮 */}
              {isAdmin && !isAdminPage && (
                <button
                  onClick={handleAdmin}
                  className="group cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                >
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">管理端</span>
                </button>
              )}

              {/* 退出按钮 */}
              <button
                onClick={handleLogout}
                className="group relative flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                {/* 退出图标 */}
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12"
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
