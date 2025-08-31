import { addToast } from "@heroui/toast";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class AppError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export const errorHandler = {
  // 处理API错误
  handleApiError: (error: any, defaultMessage = "操作失败，请重试") => {
    console.error("API Error:", error);
    
    let message = defaultMessage;
    
    if (error instanceof AppError) {
      message = error.message;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }
    
    addToast({
      color: "danger",
      description: message,
    });
    
    return message;
  },

  // 处理网络错误
  handleNetworkError: (error: any) => {
    console.error("Network Error:", error);
    
    const message = "网络连接失败，请检查网络设置";
    
    addToast({
      color: "danger",
      description: message,
    });
    
    return message;
  },

  // 处理验证错误
  handleValidationError: (errors: Record<string, string[]>) => {
    const messages = Object.values(errors).flat();
    const message = messages.join(", ");
    
    addToast({
      color: "warning",
      description: message,
    });
    
    return message;
  },

  // 创建API错误
  createApiError: (message: string, status?: number, code?: string): AppError => {
    return new AppError(message, status, code);
  },

  // 检查是否为网络错误
  isNetworkError: (error: any): boolean => {
    return !error.response || error.code === "NETWORK_ERROR";
  },

  // 检查是否为认证错误
  isAuthError: (error: any): boolean => {
    return error.response?.status === 401 || error.response?.status === 403;
  },
};

// 异步错误包装器
export const withErrorHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorMessage?: string
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handleApiError(error, errorMessage);
      return undefined;
    }
  };
};
