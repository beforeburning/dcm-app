import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { loginRequest } from "@/api/login";
import { useAppStore } from "@/stores/app";

function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { setJwtToken } = useAppStore();

  const [username, setUsername] = useState<string>("admin");
  const [password, setPassword] = useState<string>("123456");
  const [loading, setLoading] = useState<boolean>(false);

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto p-8">
        {/* Logo 区域 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white">DICOM 查看器</h1>
        </div>

        {/* 登录表单 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="space-y-6">
            {/* 用户名 */}
            <div>
              <div className="block text-sm font-medium text-white mb-2">
                用户名
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入用户名"
                disabled={loading}
              />
            </div>

            {/* 密码 */}
            <div>
              <div className="block text-sm font-medium text-white mb-2">
                密码
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
      </div>
    </div>
  );
}

export default LoginPage;
