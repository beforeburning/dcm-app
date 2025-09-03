import React, { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import {
  checkEmailRequest,
  sendVerificationCodeRequest,
  verifyCodeRequest,
  submitRegisterRequest,
} from "@/api/login";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegisterSuccess,
}) => {
  // 注册步骤：1-邮箱验证，2-设置用户信息
  const [step, setStep] = useState<1 | 2>(1);

  // 第一步：邮箱验证相关状态
  const [email, setEmail] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [sendingCode, setSendingCode] = useState<boolean>(false);
  const [verifyingCode, setVerifyingCode] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0); // 倒计时状态

  // 第二步：用户信息相关状态
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [completing, setCompleting] = useState<boolean>(false);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 发送验证码
  const handleSendCode = async (): Promise<void> => {
    if (!validateEmail(email)) {
      addToast({
        color: "danger",
        description: "请输入有效的邮箱地址",
      });
      return;
    }

    setSendingCode(true);
    try {
      // 先检查邮箱是否已存在
      const checkRes = await checkEmailRequest({ email });

      if (checkRes.success && checkRes.data?.exists) {
        addToast({
          color: "danger",
          description: "该邮箱已被注册，请使用其他邮箱",
        });
        setSendingCode(false);
        return;
      }

      // 发送验证码
      const res = await sendVerificationCodeRequest({
        email,
        name: username || "User",
        password: password || "temp123",
      });

      if (res.success) {
        addToast({
          color: "success",
          description: res.data?.message || "验证码已发送",
        });
        setCodeSent(true);
        setCountdown(60); // 启动60秒倒计时
      } else {
        addToast({
          color: "danger",
          description: res.message || "发送验证码失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "发送验证码失败，请重试",
      });
    } finally {
      setSendingCode(false);
    }
  };

  // 验证邮箱验证码
  const handleVerifyCode = async (): Promise<void> => {
    if (!verificationCode || verificationCode.length !== 6) {
      addToast({
        color: "danger",
        description: "请输入6位验证码",
      });
      return;
    }

    setVerifyingCode(true);
    try {
      const res = await verifyCodeRequest({
        email,
        code: verificationCode,
      });

      // 根据实际API响应格式判断验证是否成功
      if (res.success && (res.data?.verification_token || res.data?.verified)) {
        addToast({
          color: "success",
          description: res.message || "邮箱验证成功",
        });
        // 如果有verification_token则使用，否则使用email作为临时标识
        setTempToken(res.data?.verification_token || `verified_${email}`);
        setStep(2);
      } else {
        addToast({
          color: "danger",
          description: res.message || "验证码错误",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "验证失败，请重试",
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  // 完成注册
  const handleCompleteRegister = async (): Promise<void> => {
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

    setCompleting(true);
    try {
      // 传递所有需要的字段，包括验证码
      const res = await submitRegisterRequest({
        email,
        username,
        password,
        password_confirmation: confirmPassword,
        code: verificationCode, // 保留步骤1的验证码
      });

      if (res.success) {
        addToast({
          color: "success",
          description: "注册成功，请登录",
        });

        // 清空表单
        setStep(1);
        setEmail("");
        setVerificationCode("");
        setCodeSent(false);
        setCountdown(0); // 重置倒计时
        setTempToken("");
        setUsername("");
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
      setCompleting(false);
    }
  };

  // 键盘事件处理
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      if (step === 1) {
        if (!codeSent) {
          handleSendCode();
        } else {
          handleVerifyCode();
        }
      } else {
        handleCompleteRegister();
      }
    }
  };

  // 返回上一步
  const handleGoBack = (): void => {
    setStep(1);
    setCodeSent(false);
    setVerificationCode("");
    setCountdown(0); // 重置倒计时
    setTempToken("");
  };

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 1 ? "bg-blue-600 text-white" : "bg-green-600 text-white"
            }`}
          >
            1
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === 2
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            2
          </div>
        </div>
      </div>

      {/* 步骤标题 */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">
          {step === 1 ? "邮箱验证" : "设置用户信息"}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {step === 1 ? "请输入邮箱地址并验证" : "请设置您的用户名和密码"}
        </p>
      </div>

      {step === 1 ? (
        // 第一步：邮箱验证
        <>
          {/* 邮箱输入 */}
          <div>
            <div className="block text-sm font-medium text-gray-800 mb-2">
              邮箱
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 bg-white/90 backdrop-blur border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="请输入邮箱地址"
                disabled={sendingCode || codeSent}
              />
              <div
                onClick={codeSent ? undefined : handleSendCode}
                className={`px-4 py-3 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap ${
                  sendingCode
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : codeSent
                    ? "bg-green-500/90 text-white cursor-default"
                    : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                }`}
              >
                {sendingCode ? "发送中..." : codeSent ? "已发送" : "获取验证码"}
              </div>
            </div>
          </div>

          {/* 验证码输入 */}
          {codeSent && (
            <div>
              <div className="block text-sm font-medium text-gray-800 mb-2">
                验证码
              </div>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest shadow-sm"
                placeholder="请输入6位验证码"
                maxLength={6}
                disabled={verifyingCode}
              />
            </div>
          )}

          {/* 操作按钮 */}
          {codeSent && (
            <div className="flex space-x-3">
              <div
                onClick={() => {
                  if (countdown === 0) {
                    setCodeSent(false);
                    setVerificationCode("");
                    handleSendCode();
                  }
                }}
                className={`flex-1 flex items-center justify-center py-3 px-4 font-medium rounded-lg transition-colors duration-200 ${
                  countdown > 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900 cursor-pointer"
                }`}
              >
                {countdown > 0 ? `重新发送(${countdown}s)` : "重新发送"}
              </div>
              <div
                onClick={handleVerifyCode}
                className={`flex-1 flex items-center justify-center font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                  verifyingCode
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                }`}
              >
                {verifyingCode ? "验证中..." : "验证"}
              </div>
            </div>
          )}
        </>
      ) : (
        // 第二步：设置用户信息
        <>
          {/* 用户名 */}
          <div>
            <div className="block text-sm font-medium text-gray-800 mb-2">
              用户名
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              placeholder="请输入用户名（至少3个字符）"
              disabled={completing}
            />
          </div>

          {/* 密码 */}
          <div>
            <div className="block text-sm font-medium text-gray-800 mb-2">
              密码
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              placeholder="请输入密码（至少6个字符）"
              disabled={completing}
            />
          </div>

          {/* 确认密码 */}
          <div>
            <div className="block text-sm font-medium text-gray-800 mb-2">
              确认密码
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              placeholder="请再次输入密码"
              disabled={completing}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <div
              onClick={handleGoBack}
              className="flex-1 flex items-center justify-center py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg cursor-pointer transition-colors duration-200"
            >
              返回上一步
            </div>
            <div
              onClick={handleCompleteRegister}
              className={`flex-1 flex items-center justify-center font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                completing
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              }`}
            >
              {completing ? "注册中..." : "完成注册"}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
