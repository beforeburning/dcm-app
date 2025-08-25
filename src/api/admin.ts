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
  {
    userId: "teacher_003",
    userName: "赵教授",
    email: "zhaoprof@hospital.com",
    role: "teacher",
    createTime: "2019-08-20",
    updateTime: "2024-01-09",
    lastLoginTime: "2024-01-09",
  },
  {
    userId: "student_004",
    userName: "吴研究生",
    email: "wugraduate@medical.edu",
    role: "student",
    createTime: "2022-09-01",
    updateTime: "2024-01-08",
    lastLoginTime: "2024-01-08",
  },
  {
    userId: "teacher_004",
    userName: "孙副主任",
    email: "sunvice@hospital.com",
    role: "teacher",
    createTime: "2021-02-10",
    updateTime: "2024-01-07",
    lastLoginTime: "2024-01-07",
  },
  {
    userId: "student_005",
    userName: "周学员",
    email: "zhoustudent@medical.edu",
    role: "student",
    createTime: "2023-09-01",
    updateTime: "2024-01-06",
    lastLoginTime: "2024-01-06",
  },
  {
    userId: "teacher_005",
    userName: "郑医师",
    email: "zhengdoctor@hospital.com",
    role: "teacher",
    createTime: "2020-11-25",
    updateTime: "2024-01-05",
    lastLoginTime: "2024-01-05",
  },
  {
    userId: "student_006",
    userName: "单博士",
    email: "shanphd@medical.edu",
    role: "student",
    createTime: "2021-09-01",
    updateTime: "2024-01-04",
    lastLoginTime: "2024-01-04",
  },
  {
    userId: "admin_002",
    userName: "副管理员",
    email: "viceadmin@hospital.com",
    role: "admin",
    createTime: "2021-05-15",
    updateTime: "2024-01-03",
    lastLoginTime: "2024-01-03",
  },
  {
    userId: "student_007",
    userName: "曾硕士",
    email: "zengmaster@medical.edu",
    role: "student",
    createTime: "2022-09-01",
    updateTime: "2024-01-02",
    lastLoginTime: "2024-01-02",
  },
  {
    userId: "teacher_006",
    userName: "蔡专家",
    email: "caiexpert@hospital.com",
    role: "teacher",
    createTime: "2018-03-10",
    updateTime: "2024-01-01",
    lastLoginTime: "2024-01-01",
  },
  {
    userId: "student_008",
    userName: "韩助理",
    email: "hanassistant@medical.edu",
    role: "student",
    createTime: "2024-01-15",
    updateTime: "2024-01-15",
    lastLoginTime: "2023-12-31",
  },
  {
    userId: "teacher_007",
    userName: "高领导",
    email: "gaoleader@hospital.com",
    role: "teacher",
    createTime: "2017-07-01",
    updateTime: "2023-12-30",
    lastLoginTime: "2023-12-30",
  },
  {
    userId: "student_009",
    userName: "徐新手",
    email: "xunewbie@medical.edu",
    role: "student",
    createTime: "2024-01-10",
    updateTime: "2024-01-10",
    lastLoginTime: "2023-12-29",
  },
  {
    userId: "teacher_008",
    userName: "谢顾问",
    email: "xieadvisor@hospital.com",
    role: "teacher",
    createTime: "2019-12-15",
    updateTime: "2023-12-28",
    lastLoginTime: "2023-12-28",
  },
  {
    userId: "student_010",
    userName: "严研修",
    email: "yanresearch@medical.edu",
    role: "student",
    createTime: "2023-02-20",
    updateTime: "2023-12-27",
    lastLoginTime: "2023-12-27",
  },
  {
    userId: "teacher_009",
    userName: "彭主管",
    email: "pengmanager@hospital.com",
    role: "teacher",
    createTime: "2020-04-08",
    updateTime: "2023-12-26",
    lastLoginTime: "2023-12-26",
  },
  {
    userId: "student_011",
    userName: "饶进修",
    email: "raoadv@medical.edu",
    role: "student",
    createTime: "2023-09-01",
    updateTime: "2023-12-25",
    lastLoginTime: "2023-12-25",
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

// 分页搜索结果接口
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 搜索用户（支持分页）
export const searchUsersRequest = async (
  searchTerm: string,
  role?: UserRole | "all",
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<AdminUser>>> => {
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
  if (role && role !== "all") {
    filteredUsers = filteredUsers.filter((user) => user.role === role);
  }

  // 计算分页
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    code: 200,
    message: "success",
    data: {
      data: paginatedUsers,
      total,
      page,
      pageSize,
      totalPages,
    },
  };
};
