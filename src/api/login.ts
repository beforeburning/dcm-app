import { ApiResponse } from ".";

const mockAdminJwtToken = "jwt-admin-1234567890";
const mockTeacherJwtToken = "jwt-teacher-1234567890";
const mockStudentJwtToken = "jwt-student-1234567890";

// Mock 用户数据
const mockUsers = {
  admin: {
    password: "123456",
    userInfo: {
      userName: "系统管理员",
      userId: "admin_001",
      email: "admin@hospital.com",
      role: "admin" as UserRole,
      createTime: "2020-01-01",
      updateTime: "2024-01-15",
    },
  },
  teacher: {
    password: "123456",
    userInfo: {
      userName: "张老师",
      userId: "teacher_001",
      email: "zhangdoctor@hospital.com",
      role: "teacher" as UserRole,
      createTime: "2021-03-15",
      updateTime: "2024-01-15",
    },
  },
  student: {
    password: "123456",
    userInfo: {
      userName: "李同学",
      userId: "student_001",
      email: "listudent@medical.edu",
      role: "student" as UserRole,
      createTime: "2023-09-01",
      updateTime: "2024-01-15",
    },
  },
};

export type loginParams = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type RegisterParams = {
  username: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  userId: string;
  username: string;
  email: string;
};

// 用户名到 token 的映射关系
const userTokenMap = {
  admin: mockAdminJwtToken,
  teacher: mockTeacherJwtToken,
  student: mockStudentJwtToken,
};

export const loginRequest = async (
  params: loginParams
): Promise<ApiResponse<LoginResponse>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 检查用户是否存在
  const user = mockUsers[params.username as keyof typeof mockUsers];

  if (!user || user.password !== params.password) {
    return {
      code: 401,
      message: "用户名或密码错误",
    };
  }

  // 获取对应的 token
  const token = userTokenMap[params.username as keyof typeof userTokenMap];

  return {
    code: 200,
    message: "success",
    data: {
      token,
    },
  };
};

export const registerRequest = async (
  params: RegisterParams
): Promise<ApiResponse<RegisterResponse>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 模拟邮箱已存在检查
  if (params.email === "admin@example.com") {
    return {
      code: 400,
      message: "该邮箱已被注册",
    };
  }

  // 模拟用户名已存在检查
  if (params.username === "admin") {
    return {
      code: 400,
      message: "该用户名已被占用",
    };
  }

  // 模拟注册成功
  return {
    code: 200,
    message: "注册成功",
    data: {
      userId: `user_${Date.now()}`,
      username: params.username,
      email: params.email,
    },
  };
};

export type UserRole = "admin" | "teacher" | "student";

export type UserInfo = {
  userName: string;
  userId: string;
  email: string;
  role: UserRole;
  createTime: string;
  updateTime: string;
};

// Token 到用户的映射关系
const tokenUserMap = {
  [mockAdminJwtToken]: mockUsers.admin.userInfo,
  [mockTeacherJwtToken]: mockUsers.teacher.userInfo,
  [mockStudentJwtToken]: mockUsers.student.userInfo,
};

export const getUserInfoRequest = async (
  token: string
): Promise<ApiResponse<UserInfo>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 检查 token 是否有效
  const userInfo = tokenUserMap[token];

  if (!userInfo) {
    return {
      code: 401,
      message: "token 无效",
    };
  }

  return {
    code: 200,
    message: "success",
    data: userInfo,
  };
};
