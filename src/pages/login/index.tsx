import React, { useState } from "react";
import { LoginForm, RegisterForm } from "./components";

function LoginPage(): React.JSX.Element {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  const handleRegisterSuccess = (): void => {
    setIsRegisterMode(false);
  };

  return (
    <div className="min-h-screen   bg-gray-900 px-20 flex items-center relative justify-center">
      <img
        src="/images/login_bg.png"
        alt="logo"
        className="absolute left-0 top-0 w-full h-full"
      />

      <div className="flex items-center max-w-[1400px] mx-auto w-full">
        <div className="flex flex-1 relative z-10 flex-col">
          <div className="text-white text-[88px] font-medium leading-[100px]">
            智慧诊疗 v1.5
          </div>
        </div>
        <div className="w-[576px] relative z-10 mx-auto p-8">
          {/* Logo 区域 */}
          <div className="bg-white rounded-lg p-6">
            {/* 统一的模式切换按钮 */}
            <div className="flex mb-6">
              <button
                onClick={() => setIsRegisterMode(false)}
                className={`flex-1 py-2 px-4 cursor-pointer text-sm font-medium rounded-l-lg transition-colors ${
                  !isRegisterMode
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setIsRegisterMode(true)}
                className={`flex-1 py-2 px-4 cursor-pointer text-sm font-medium rounded-r-lg transition-colors ${
                  isRegisterMode
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                注册
              </button>
            </div>

            {/* 根据模式显示不同的表单组件 */}
            {isRegisterMode ? (
              <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
            ) : (
              <LoginForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
