import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, getUserInfo, accessToken, userInfo } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 检查是否有token但没有用户信息，如果有则尝试获取用户信息
    const token = accessToken || localStorage.getItem("access_token");
    if (token && !userInfo) {
      getUserInfo();
    }

    // 如果没有token，直接跳转到登录页
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
  }, [accessToken, userInfo, getUserInfo, navigate]);

  // 如果没有认证，返回null（正在跳转中）
  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
