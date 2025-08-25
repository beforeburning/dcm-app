import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 创建一个事件系统来处理路由跳转
class NavigationService {
  private listeners: Array<(path: string) => void> = [];

  subscribe(listener: (path: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  navigate(path: string): void {
    this.listeners.forEach((listener) => listener(path));
  }
}

// 创建全局实例
// eslint-disable-next-line react-refresh/only-export-components
export const navigationService = new NavigationService();

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 订阅导航服务
    const unsubscribe = navigationService.subscribe((path) => {
      navigate(path);
    });

    // 清理订阅
    return unsubscribe;
  }, [navigate]);

  return <>{children}</>;
};
