import { ApiResponse } from ".";
import type { UserRole } from "./login";

export interface AdminUser {
  userId: string;
  userName: string;
  email: string;
  role: UserRole;
  createTime: string;
  updateTime: string;
  lastLoginTime?: string;
}

// Mock 所有用户数据（包括注册用户）
let mockAllUsers: AdminUser[] = [
  {
    userId: "admin_001",
    userName: "系统管理员",
    email: "admin@hospital.com",
    role: "admin",
    createTime: "2020-01-01",
    updateTime: "2024-01-15",
    lastLoginTime: "2024-01-15",
  },
  {
    userId: "teacher_001",
    userName: "张医生",
    email: "zhangdoctor@hospital.com",
    role: "teacher",
    createTime: "2021-03-15",
    updateTime: "2024-01-15",
    lastLoginTime: "2024-01-14",
  },
  {
    userId: "student_001",
    userName: "李学生",
    email: "listudent@medical.edu",
    role: "student",
    createTime: "2023-09-01",
    updateTime: "2024-01-15",
    lastLoginTime: "2024-01-13",
  },
  {
    userId: "teacher_002",
    userName: "王主任",
    email: "wangdirector@hospital.com",
    role: "teacher",
    createTime: "2020-06-15",
    updateTime: "2024-01-10",
    lastLoginTime: "2024-01-12",
  },
  {
    userId: "student_002",
    userName: "陈同学",
    email: "chenstudent@medical.edu",
    role: "student",
    createTime: "2023-09-01",
    updateTime: "2024-01-08",
    lastLoginTime: "2024-01-11",
  },
  {
    userId: "student_003",
    userName: "刘实习生",
    email: "liuintern@medical.edu",
    role: "student",
    createTime: "2024-01-01",
    updateTime: "2024-01-05",
    lastLoginTime: "2024-01-10",
  },
];

// 获取所有用户列表
export const getAllUsersRequest = async (): Promise<
  ApiResponse<AdminUser[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    code: 200,
    message: "success",
    data: mockAllUsers,
  };
};

// 更新用户权限
export const updateUserRoleRequest = async (
  userId: string,
  newRole: UserRole
): Promise<ApiResponse<null>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 查找用户
  const userIndex = mockAllUsers.findIndex((user) => user.userId === userId);

  if (userIndex === -1) {
    return {
      code: 404,
      message: "用户不存在",
    };
  }

  // 防止删除主管理员权限
  if (userId === "admin_001" && newRole !== "admin") {
    return {
      code: 403,
      message: "不能修改主管理员的权限",
    };
  }

  // 更新用户权限
  mockAllUsers[userIndex] = {
    ...mockAllUsers[userIndex],
    role: newRole,
    updateTime: new Date().toISOString().split("T")[0],
  };

  return {
    code: 200,
    message: "权限更新成功",
    data: null,
  };
};

// 搜索用户
export const searchUsersRequest = async (
  searchTerm: string,
  role?: UserRole
): Promise<ApiResponse<AdminUser[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filteredUsers = mockAllUsers;

  // 按搜索词过滤
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.userName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.userId.toLowerCase().includes(term)
    );
  }

  // 按权限过滤
  if (role) {
    filteredUsers = filteredUsers.filter((user) => user.role === role);
  }

  return {
    code: 200,
    message: "success",
    data: filteredUsers,
  };
};
