import React, { useState } from "react";
import { addToast } from "@heroui/toast";
import { registerRequest } from "@/api/login";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegisterSuccess,
}) => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !loading) {
      handleRegister();
    }
  };

  const handleRegister = async (): Promise<void> => {
    // 验证邮箱格式
    if (!validateEmail(email)) {
      addToast({
        color: "danger",
        description: "请输入有效的邮箱地址",
      });
      return;
    }

    // 验证用户名
    if (!username || username.length < 3) {
      addToast({
        color: "danger",
        description: "用户名至少需要3个字符",
      });
      return;
    }

    // 验证密码
    if (!password || password.length < 6) {
      addToast({
        color: "danger",
        description: "密码至少需要6个字符",
      });
      return;
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      addToast({
        color: "danger",
        description: "两次输入的密码不一致",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await registerRequest({ username, email, password });

      if (res.code === 200) {
        addToast({
          color: "success",
          description: "注册成功，请登录",
        });

        // 清空表单
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // 调用成功回调，切换到登录模式
        onRegisterSuccess();
      } else {
        addToast({
          color: "danger",
          description: res.message || "注册失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "注册失败，请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 邮箱字段 */}
      <div>
        <div className="block text-sm font-medium text-white mb-2">邮箱</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="请输入邮箱地址"
          disabled={loading}
        />
      </div>

      {/* 用户名 */}
      <div>
        <div className="block text-sm font-medium text-white mb-2">用户名</div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="请输入用户名（至少3个字符）"
          disabled={loading}
        />
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
          placeholder="请输入密码（至少6个字符）"
          disabled={loading}
        />
      </div>

      {/* 确认密码字段 */}
      <div>
        <div className="block text-sm font-medium text-white mb-2">
          确认密码
        </div>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="请再次输入密码"
          disabled={loading}
        />
      </div>

      {/* 注册按钮 */}
      <div
        onClick={handleRegister}
        className={`flex items-center cursor-pointer justify-center w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
          loading
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? "注册中..." : "注册"}
      </div>
    </div>
  );
};
