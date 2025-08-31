import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { useAuthStore } from "./auth";
import { navigationService } from "../components/NavigationProvider";

interface AppState {
  // 应用级状态
  isLoading: boolean;
  error: string | null;
  
  // 操作方法
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 认证相关（代理到auth store）
  getAuthStore: () => ReturnType<typeof useAuthStore.getState>;
}

const isDev = process.env.NODE_ENV === "development";

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      isLoading: false,
      error: null,

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      getAuthStore: () => useAuthStore.getState(),
    }),
    {
      enabled: isDev,
      name: "AppStore",
    }
  )
);

if (isDev) {
  mountStoreDevtool("AppStore", useAppStore);
}

// 兼容性导出，保持原有接口
export const useAppStoreCompat = () => {
  const appStore = useAppStore();
  const authStore = useAuthStore();
  
  return {
    // 应用状态
    isLoading: appStore.isLoading,
    setLoading: appStore.setLoading,
    error: appStore.error,
    setError: appStore.setError,
    clearError: appStore.clearError,
    
    // 认证状态（保持原有接口）
    accessToken: authStore.accessToken,
    setAccessToken: authStore.setAccessToken,
    userInfo: authStore.userInfo,
    setUserInfo: authStore.setUserInfo,
    getUserInfo: authStore.getUserInfo,
    isGettingUserInfo: authStore.isGettingUserInfo,
    logout: authStore.logout,
    isAuthenticated: authStore.isAuthenticated,
  };
};
