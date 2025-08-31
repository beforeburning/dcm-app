import { addToast } from "@heroui/toast";
import { getUserInfoRequest, UserInfo, logoutRequest } from "@/api/login";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { navigationService } from "../components/NavigationProvider";

interface AppState {
  accessToken: string;
  setAccessToken: (token: string) => void;

  userInfo: UserInfo | undefined;
  setUserInfo: (userInfo: UserInfo) => void;
  getUserInfo: () => Promise<void>;
  isGettingUserInfo: boolean;

  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

const isDev = process.env.NODE_ENV === "development";
const STORAGE_KEY = "AppStore";

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        accessToken: "",
        setAccessToken: (accessToken: string) => {
          const { getUserInfo } = get();
          set({ accessToken });
          // 存储到 localStorage
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
            getUserInfo();
          } else {
            localStorage.removeItem("access_token");
          }
        },

        userInfo: undefined,
        setUserInfo: (userInfo: UserInfo) => {
          set({ userInfo });
        },

        isGettingUserInfo: false,

        getUserInfo: async () => {
          const { accessToken, logout, isGettingUserInfo } = get();

          // 如果正在获取用户信息，直接返回
          if (isGettingUserInfo) {
            return;
          }

          // 如果没有token，直接返回
          if (!accessToken && !localStorage.getItem("access_token")) {
            return;
          }

          // 设置正在获取用户信息状态
          set({ isGettingUserInfo: true });

          try {
            const res = await getUserInfoRequest();
            console.log("🚀 ~ getUserInfo: ~ res:", res);

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
            // 无论成功失败，都要重置状态
            set({ isGettingUserInfo: false });
          }
        },

        logout: async () => {
          try {
            // 调用后端登出接口
            await logoutRequest();
          } catch (error) {
            console.error("Logout API failed:", error);
          } finally {
            // 无论API调用是否成功，都清除本地状态
            set({
              accessToken: "",
              userInfo: undefined,
              isGettingUserInfo: false,
            });
            localStorage.removeItem("access_token");
            navigationService.navigate("/");
          }
        },

        isAuthenticated: () => {
          const { accessToken, userInfo } = get();
          return (
            !!(accessToken || localStorage.getItem("access_token")) &&
            !!userInfo
          );
        },
      }),
      {
        name: STORAGE_KEY,
        // 只持久化 accessToken，userInfo 每次重新获取
        partialize: (state) => ({ accessToken: state.accessToken }),
      }
    ),
    {
      enabled: isDev,
      name: "AppStore",
    }
  )
);

if (isDev) {
  mountStoreDevtool("AppStore", useAppStore);
}
