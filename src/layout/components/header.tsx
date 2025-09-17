import React, { useState } from "react";
import { addToast } from "@heroui/toast";
import { useAuthStore } from "@/stores/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { changePasswordRequest } from "@/api/auth";

const HeaderComponents = (): React.JSX.Element => {
  const { logout, userInfo } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // 修改密码相关状态
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isDetailPage = location.pathname.startsWith("/detail/");
  const isAdminPage = location.pathname === "/admin";
  const isUploadPage = location.pathname === "/upload";
  const isEditPage = location.pathname.startsWith("/edit/");
  const isAdmin = userInfo?.role === 1;
  const isTeacher = userInfo?.role === 2;
  const isStudent = userInfo?.role === 3;
  const canUpload = isAdmin || isTeacher;
  const isLoggedIn = !!userInfo?.user_id;

  const handleLogout = (): void => {
    addToast({
      color: "success",
      description: "已退出登录",
    });
    logout();
    navigate("/");
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

  // 处理修改密码
  const handleChangePassword = async (): Promise<void> => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast({
        color: "danger",
        description: "请填写所有密码字段",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        color: "danger",
        description: "新密码与确认密码不一致",
      });
      return;
    }

    if (newPassword.length < 6) {
      addToast({
        color: "danger",
        description: "新密码长度至少6位",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePasswordRequest({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (res.success) {
        addToast({
          color: "success",
          description: "密码修改成功",
        });
        setShowPasswordModal(false);
        // 清空表单
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addToast({
          color: "danger",
          description: res.message || "密码修改失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setIsChangingPassword(false);
    }
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
                className="group flex cursor-pointer items-center justify-center w-9 h-9 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
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
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={handleHome}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">智</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                医学图像信息管理与标注系统
              </h1>
            </div>
          </div>

          {/* 右侧：用户信息和操作 */}
          <div className="flex items-center space-x-6">
            {/* 用户信息区域 */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                {/* 用户头像 */}
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {userInfo?.username?.charAt(0) || "U"}
                  </span>
                </div>

                {/* 用户信息 */}
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm">
                    {userInfo?.username || "用户"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {userInfo?.role_name || ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">?</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-300 font-medium text-sm">
                    未登录
                  </span>
                  <span className="text-gray-500 text-xs">请先登录</span>
                </div>
              </div>
            )}

            {/* 操作按钮组 */}
            {isLoggedIn && (
              <div className="flex items-center space-x-2">
                {/* 教师/管理员专用：上传按钮 */}
                {canUpload && !isUploadPage && (
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

                {/* 修改密码按钮 */}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="group relative flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  {/* 修改密码图标 */}
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <span className="text-sm font-medium">修改密码</span>
                </button>

                {/* 退出按钮 */}
                <button
                  onClick={handleLogout}
                  className="group relative flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
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
            )}
          </div>
        </div>
      </div>

      {/* 修改密码模态框 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">修改密码</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  当前密码
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入当前密码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入新密码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isChangingPassword}
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isChangingPassword ? "修改中..." : "确认修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderComponents;
