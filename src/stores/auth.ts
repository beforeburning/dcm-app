import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { addToast } from "@heroui/toast";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { UserInfo } from "@/types/api";
import { getUserInfoRequest, logoutRequest } from "@/api/auth";

interface AuthState {
  // 状态
  accessToken: string;
  userInfo: UserInfo | undefined;
  isGettingUserInfo: boolean;
  
  // 计算属性
  isAuthenticated: () => boolean;
  
  // 操作方法
  setAccessToken: (token: string) => void;
  setUserInfo: (userInfo: UserInfo) => void;
  getUserInfo: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

const isDev = process.env.NODE_ENV === "development";
const STORAGE_KEY = "AuthStore";

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        accessToken: "",
        userInfo: undefined,
        isGettingUserInfo: false,

        isAuthenticated: () => {
          const { accessToken, userInfo } = get();
          return !!(accessToken || localStorage.getItem("access_token")) && !!userInfo;
        },

        setAccessToken: (accessToken: string) => {
          const { getUserInfo } = get();
          set({ accessToken });
          
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
            getUserInfo();
          } else {
            localStorage.removeItem("access_token");
          }
        },

        setUserInfo: (userInfo: UserInfo) => {
          set({ userInfo });
        },

        getUserInfo: async () => {
          const { accessToken, logout, isGettingUserInfo } = get();

          if (isGettingUserInfo) return;
          if (!accessToken && !localStorage.getItem("access_token")) return;

          set({ isGettingUserInfo: true });

          try {
            const res = await getUserInfoRequest();
            
            if (!res.success) {
              addToast({
                color: "danger",
                description: res.message,
              });
              await logout();
              return;
            }

            if (res.data?.user) {
              set({ userInfo: res.data.user });
            }
          } catch (error) {
            console.error("Get user info failed:", error);
            await logout();
          } finally {
            set({ isGettingUserInfo: false });
          }
        },

        logout: async () => {
          try {
            await logoutRequest();
          } catch (error) {
            console.error("Logout API failed:", error);
          } finally {
            get().clearAuth();
          }
        },

        clearAuth: () => {
          set({
            accessToken: "",
            userInfo: undefined,
            isGettingUserInfo: false,
          });
          localStorage.removeItem("access_token");
        },
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({ accessToken: state.accessToken }),
      }
    ),
    {
      enabled: isDev,
      name: "AuthStore",
    }
  )
);

if (isDev) {
  mountStoreDevtool("AuthStore", useAuthStore);
}
