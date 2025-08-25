import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/app";
import { addToast } from "@heroui/toast";

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const { userInfo } = useAppStore();

  useEffect(() => {
    // 如果用户信息还没加载完成，等待
    if (!userInfo) {
      return;
    }

    // 检查是否为管理员
    if (userInfo.role !== "admin") {
      addToast({
        color: "danger",
        description: "您没有权限访问管理端",
      });
      navigate("/list"); // 重定向到列表页
    }
  }, [userInfo, navigate]);

  return {
    isAdmin: userInfo?.role === "admin",
    userInfo,
  };
};
