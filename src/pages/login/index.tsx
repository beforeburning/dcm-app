import React, { useState } from "react";
import { LoginForm, RegisterForm } from "./components";

function LoginPage(): React.JSX.Element {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  const handleSwitchToRegister = (): void => {
    setIsRegisterMode(true);
  };

  const handleSwitchToLogin = (): void => {
    setIsRegisterMode(false);
  };

  const handleRegisterSuccess = (): void => {
    setIsRegisterMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto p-8">
        {/* Logo 区域 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white">智慧诊疗 v1.5</h1>
        </div>

        {/* 根据模式显示不同的表单组件 */}
        {isRegisterMode ? (
          <RegisterForm
            onSwitchToLogin={handleSwitchToLogin}
            onRegisterSuccess={handleRegisterSuccess}
          />
        ) : (
          <LoginForm onSwitchToRegister={handleSwitchToRegister} />
        )}
      </div>
    </div>
  );
}

export default LoginPage;
