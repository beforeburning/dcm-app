import { CATEGORY_LABELS, FILE_UPLOAD } from "./constants";

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取分类标签
export const getCategoryLabel = (category?: number): string => {
  return category ? CATEGORY_LABELS[category] || "未分类" : "未分类";
};

// 验证文件类型
export const isValidDicomFile = (file: File): boolean => {
  const extension = file.name.toLowerCase();
  return FILE_UPLOAD.ALLOWED_EXTENSIONS.some((ext) => extension.endsWith(ext));
};

// 验证文件大小
export const isValidFileSize = (file: File): boolean => {
  return file.size <= FILE_UPLOAD.MAX_FILE_SIZE;
};

// 格式化日期
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 深拷贝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// 生成唯一ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 验证邮箱格式
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证密码强度
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  message: string;
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: "密码长度至少6位",
    };
  }
  return {
    isValid: true,
    message: "密码格式正确",
  };
};

// 截断文本
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// 获取用户角色名称
export const getRoleName = (role: number): string => {
  const roleNames = {
    1: "管理员",
    2: "教师",
    3: "学生",
  };
  return roleNames[role as keyof typeof roleNames] || "未知";
};
