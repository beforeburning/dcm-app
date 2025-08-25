import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { loginRequest } from "@/api/login";
import { useAppStore } from "@/stores/app";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const { setJwtToken } = useAppStore();

  const [username, setUsername] = useState<string>("admin");
  const [password, setPassword] = useState<string>("123456");
  const [loading, setLoading] = useState<boolean>(false);

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!username || !password) {
      addToast({
        color: "danger",
        description: "请输入用户名和密码",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await loginRequest({ username, password });
      if (res.code === 200 && res.data?.token) {
        addToast({
          color: "success",
          description: "登录成功",
        });
        setJwtToken(res.data.token);
        navigate("/list");
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
    <div className="bg-gray-800 rounded-lg p-6">
      {/* 模式切换标签 */}
      <div className="flex mb-6">
        <button
          className="flex-1 py-2 px-4 text-sm font-medium rounded-l-lg bg-blue-600 text-white"
          disabled={loading}
        >
          登录
        </button>
        <button
          onClick={onSwitchToRegister}
          className="flex-1 py-2 px-4 text-sm font-medium rounded-r-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          disabled={loading}
        >
          注册
        </button>
      </div>

      <div className="space-y-6">
        {/* 用户名 */}
        <div>
          <div className="block text-sm font-medium text-white mb-2">账号</div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入用户名"
            disabled={loading}
          />
          <div className="text-xs text-gray-400 mt-1">
            测试账号：admin(管理员) / teacher(老师) / student(学生)
          </div>
        </div>

        {/* 密码 */}
        <div>
          <div className="block text-sm font-medium text-white mb-2">密码</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入密码"
            disabled={loading}
          />
        </div>

        {/* 登录按钮 */}
        <div
          onClick={handleLogin}
          className={`flex items-center cursor-pointer justify-center w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            loading
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "登录中..." : "登录"}
        </div>
      </div>
    </div>
  );
};
