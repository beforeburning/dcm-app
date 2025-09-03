import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { loginRequest } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setAccessToken } = useAuthStore();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      addToast({
        color: "danger",
        description: "请输入邮箱和密码",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await loginRequest({ email, password });
      if (res.success && res.data?.access_token) {
        addToast({
          color: "success",
          description: "登录成功",
        });
        setAccessToken(res.data.access_token);
        navigate("/docs");
      } else {
        addToast({
          color: "danger",
          description: res.message,
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "登录失败，请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 邮箱 */}
      <div>
        <div className="block text-sm font-medium text-gray-800 mb-2">用户</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          placeholder="请输入用户"
          disabled={loading}
        />
        {/* <div className="text-xs text-gray-400 mt-1">
          admin@163.com(管理员) / drqfh06450@atminmail.com(用户)
        </div> */}
      </div>

      {/* 密码 */}
      <div>
        <div className="block text-sm font-medium text-gray-800 mb-2">密码</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          placeholder="请输入密码"
          disabled={loading}
        />
      </div>

      {/* 登录按钮 */}
      <div
        onClick={handleLogin}
        className={`flex items-center cursor-pointer justify-center w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm border ${
          loading
            ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        }`}
      >
        {loading ? "登录中..." : "登录"}
      </div>
    </div>
  );
};
