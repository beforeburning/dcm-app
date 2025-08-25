import { addToast } from "@heroui/toast";
import { getUserInfoRequest, UserInfo } from "@/api/login";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { navigationService } from "../components/NavigationProvider";

interface AppState {
  jwtToken: string;
  setJwtToken: (jwtToken: string) => void;

  userInfo: UserInfo | undefined;
  setUserInfo: (userInfo: UserInfo) => void;
  getUserInfo: () => Promise<void>;

  logout: () => void;
}

const isDev = process.env.NODE_ENV === "development";
const STORAGE_KEY = "AppStore";

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        jwtToken: "",
        setJwtToken: (jwtToken: string) => {
          const { getUserInfo } = get();
          set({ jwtToken });
          getUserInfo();
        },

        userInfo: undefined,
        setUserInfo: (userInfo: UserInfo) => {
          set({ userInfo });
        },
        getUserInfo: async () => {
          const { jwtToken, logout } = get();
          const res = await getUserInfoRequest(jwtToken);
          console.log("🚀 ~ getUserInfo: ~ res:", res);
          if (res.code === 401) {
            addToast({
              color: "danger",
              description: res.message,
            });
            logout();
            return;
          }
          if (res.code === 200) {
            set({ userInfo: res.data });
          }
        },

        logout: () => {
          set({ jwtToken: "", userInfo: undefined });
          navigationService.navigate("/");
        },
      }),
      {
        name: STORAGE_KEY,
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
