// 用户角色常量
export const USER_ROLES = {
  ADMIN: 1,
  TEACHER: 2,
  STUDENT: 3,
} as const;

// 医学影像分类常量
export const IMAGE_CATEGORIES = {
  X_RAY: 1,
  CT: 2,
  MRI: 3,
  ULTRASOUND: 4,
  PET: 5,
} as const;

// 分类标签映射
export const CATEGORY_LABELS: Record<number, string> = {
  [IMAGE_CATEGORIES.X_RAY]: "X光",
  [IMAGE_CATEGORIES.CT]: "CT",
  [IMAGE_CATEGORIES.MRI]: "MRI",
  [IMAGE_CATEGORIES.ULTRASOUND]: "超声",
  [IMAGE_CATEGORIES.PET]: "PET",
};

// 文件上传相关常量
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 1 * 1024 * 1024, // 1MB
  ALLOWED_EXTENSIONS: [".dcm", ".dicom"],
  MAX_TAGS: 3,
} as const;

// 分页相关常量
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// API相关常量
export const API = {
  TIMEOUT: 10000,
  BASE_URL: "/api",
} as const;

// 存储键名常量
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  AUTH_STORE: "AuthStore",
} as const;

// 路由路径常量
export const ROUTES = {
  HOME: "/",
  LOGIN: "/",
  LIST: "/list",
  DETAIL: "/detail",
  ADMIN: "/admin",
  UPLOAD: "/upload",
  EDIT: "/edit",
} as const;

// 七牛云配置
export const QINIU_CONFIG = {
  BASE_URL: "http://t1am3584v.hn-bkt.clouddn.com/",
} as const;
