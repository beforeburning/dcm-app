import { ApiResponse } from ".";
import type { UserRole } from "./login";

export type DcmFile = {
  id: string;
  name: string;
  size: number;
  path: string;
};

export type DcmList = {
  id: string;
  name: string;
  createTime: number;
  updateTime: number;
  files: DcmFile[];
  totalFiles: number;
  totalSize: number;
  ownerId?: string; // 数据拥有者ID
  ownerName?: string; // 数据拥有者名称
  isPublic?: boolean; // 是否为公开数据
  originalId?: string; // 原始数据 ID（用于复制数据）
  category?: string; // 大分类
  tags?: string[]; // 标签列表
};

// 分页响应接口
export interface PaginatedDcmResponse {
  data: DcmList[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 模拟数据库
let mockDcmData: DcmList[] = [];
let mockStudentData: DcmList[] = []; // 学生复制的数据
let dataIdCounter = 100; // 新数据 ID 计数器

// 初始化公开数据（为所有用户可见）
const initializePublicData = (): DcmList[] => {
  // 模拟从文件系统读取的数据
  const folderData = [
    {
      id: "1",
      category: "ct",
      tags: ["胸部", "肺部", "疗效评估"],
      files: [
        {
          id: "1-1",
          name: "000e6a9a.dcm",
          size: 253 * 1024,
          path: "1/000e6a9a.dcm",
        },
        {
          id: "1-2",
          name: "000e6a9b.dcm",
          size: 253 * 1024,
          path: "1/000e6a9b.dcm",
        },
        {
          id: "1-3",
          name: "000e6a9c.dcm",
          size: 254 * 1024,
          path: "1/000e6a9c.dcm",
        },
        {
          id: "1-4",
          name: "000e6a9d.dcm",
          size: 254 * 1024,
          path: "1/000e6a9d.dcm",
        },
        {
          id: "1-5",
          name: "000e6a9e.dcm",
          size: 255 * 1024,
          path: "1/000e6a9e.dcm",
        },
        {
          id: "1-6",
          name: "000e6a9f.dcm",
          size: 255 * 1024,
          path: "1/000e6a9f.dcm",
        },
      ],
    },
    {
      id: "2",
      category: "mri",
      tags: ["头部", "脑部", "神经系统"],
      files: [
        {
          id: "2-1",
          name: "000e6a98.dcm",
          size: 253 * 1024,
          path: "2/000e6a98.dcm",
        },
        {
          id: "2-2",
          name: "000e6a99.dcm",
          size: 252 * 1024,
          path: "2/000e6a99.dcm",
        },
      ],
    },
    {
      id: "3",
      category: "xray",
      tags: ["胸部", "骨科", "骨折"],
      files: [
        {
          id: "3-1",
          name: "000e6aa0.dcm",
          size: 257 * 1024,
          path: "3/000e6aa0.dcm",
        },
        {
          id: "3-2",
          name: "000e6aa1.dcm",
          size: 258 * 1024,
          path: "3/000e6aa1.dcm",
        },
        {
          id: "3-3",
          name: "000e6aa2.dcm",
          size: 259 * 1024,
          path: "3/000e6aa2.dcm",
        },
        {
          id: "3-4",
          name: "000e6aa3.dcm",
          size: 258 * 1024,
          path: "3/000e6aa3.dcm",
        },
        {
          id: "3-5",
          name: "000e6aa4.dcm",
          size: 260 * 1024,
          path: "3/000e6aa4.dcm",
        },
        {
          id: "3-6",
          name: "000e6aa5.dcm",
          size: 258 * 1024,
          path: "3/000e6aa5.dcm",
        },
        {
          id: "3-7",
          name: "000e6aa6.dcm",
          size: 260 * 1024,
          path: "3/000e6aa6.dcm",
        },
        {
          id: "3-8",
          name: "000e6aa7.dcm",
          size: 261 * 1024,
          path: "3/000e6aa7.dcm",
        },
        {
          id: "3-9",
          name: "000e6aa8.dcm",
          size: 290 * 1024,
          path: "3/000e6aa8.dcm",
        },
        {
          id: "3-10",
          name: "000e6aa9.dcm",
          size: 289 * 1024,
          path: "3/000e6aa9.dcm",
        },
      ],
    },
    {
      id: "4",
      category: "ultrasound",
      tags: ["腹部", "肉肾", "超声检查"],
      files: [
        {
          id: "4-1",
          name: "000e6ab7.dcm",
          size: 247 * 1024,
          path: "4/000e6ab7.dcm",
        },
        {
          id: "4-2",
          name: "000e6ab8.dcm",
          size: 246 * 1024,
          path: "4/000e6ab8.dcm",
        },
        {
          id: "4-3",
          name: "000e6ab9.dcm",
          size: 245 * 1024,
          path: "4/000e6ab9.dcm",
        },
      ],
    },
    {
      id: "5",
      category: "ct",
      tags: ["腹部", "胃肠道", "增强扫描"],
      files: [
        {
          id: "5-1",
          name: "000e6ac6.dcm",
          size: 238 * 1024,
          path: "5/000e6ac6.dcm",
        },
        {
          id: "5-2",
          name: "000e6ac7.dcm",
          size: 237 * 1024,
          path: "5/000e6ac7.dcm",
        },
        {
          id: "5-3",
          name: "000e6ac8.dcm",
          size: 236 * 1024,
          path: "5/000e6ac8.dcm",
        },
        {
          id: "5-4",
          name: "000e6ac9.dcm",
          size: 235 * 1024,
          path: "5/000e6ac9.dcm",
        },
      ],
    },
    {
      id: "6",
      category: "mri",
      tags: ["腿部", "肌肉", "运动损伤"],
      files: [
        {
          id: "6-1",
          name: "000e6ad5.dcm",
          size: 229 * 1024,
          path: "6/000e6ad5.dcm",
        },
        {
          id: "6-2",
          name: "000e6ad6.dcm",
          size: 228 * 1024,
          path: "6/000e6ad6.dcm",
        },
        {
          id: "6-3",
          name: "000e6ad7.dcm",
          size: 227 * 1024,
          path: "6/000e6ad7.dcm",
        },
        {
          id: "6-4",
          name: "000e6ad8.dcm",
          size: 226 * 1024,
          path: "6/000e6ad8.dcm",
        },
        {
          id: "6-5",
          name: "000e6ad9.dcm",
          size: 225 * 1024,
          path: "6/000e6ad9.dcm",
        },
      ],
    },
    {
      id: "7",
      category: "pet",
      tags: ["全身", "肿瘤", "代谢显像"],
      files: [
        {
          id: "7-1",
          name: "000e6ae7.dcm",
          size: 217 * 1024,
          path: "7/000e6ae7.dcm",
        },
        {
          id: "7-2",
          name: "000e6ae8.dcm",
          size: 216 * 1024,
          path: "7/000e6ae8.dcm",
        },
        {
          id: "7-3",
          name: "000e6ae9.dcm",
          size: 215 * 1024,
          path: "7/000e6ae9.dcm",
        },
      ],
    },
    {
      id: "8",
      category: "pathology",
      tags: ["病理", "细胞学", "显微镜"],
      files: [
        {
          id: "8-1",
          name: "000e6af6.dcm",
          size: 208 * 1024,
          path: "8/000e6af6.dcm",
        },
        {
          id: "8-2",
          name: "000e6af7.dcm",
          size: 207 * 1024,
          path: "8/000e6af7.dcm",
        },
        {
          id: "8-3",
          name: "000e6af8.dcm",
          size: 206 * 1024,
          path: "8/000e6af8.dcm",
        },
        {
          id: "8-4",
          name: "000e6af9.dcm",
          size: 205 * 1024,
          path: "8/000e6af9.dcm",
        },
      ],
    },
    {
      id: "9",
      category: "ct",
      tags: ["心脏", "心血管", "冠脈CTA"],
      files: [
        {
          id: "9-1",
          name: "000e6b05.dcm",
          size: 199 * 1024,
          path: "9/000e6b05.dcm",
        },
        {
          id: "9-2",
          name: "000e6b06.dcm",
          size: 198 * 1024,
          path: "9/000e6b06.dcm",
        },
        {
          id: "9-3",
          name: "000e6b07.dcm",
          size: 197 * 1024,
          path: "9/000e6b07.dcm",
        },
        {
          id: "9-4",
          name: "000e6b08.dcm",
          size: 196 * 1024,
          path: "9/000e6b08.dcm",
        },
        {
          id: "9-5",
          name: "000e6b09.dcm",
          size: 195 * 1024,
          path: "9/000e6b09.dcm",
        },
      ],
    },
    {
      id: "10",
      category: "xray",
      tags: ["足部", "骨科", "创伤"],
      files: [
        {
          id: "10-1",
          name: "000e6b17.dcm",
          size: 187 * 1024,
          path: "10/000e6b17.dcm",
        },
        {
          id: "10-2",
          name: "000e6b18.dcm",
          size: 186 * 1024,
          path: "10/000e6b18.dcm",
        },
        {
          id: "10-3",
          name: "000e6b19.dcm",
          size: 185 * 1024,
          path: "10/000e6b19.dcm",
        },
      ],
    },
    {
      id: "11",
      category: "ultrasound",
      tags: ["心脏", "心脉超声", "功能评估"],
      files: [
        {
          id: "11-1",
          name: "000e6b26.dcm",
          size: 178 * 1024,
          path: "11/000e6b26.dcm",
        },
        {
          id: "11-2",
          name: "000e6b27.dcm",
          size: 177 * 1024,
          path: "11/000e6b27.dcm",
        },
        {
          id: "11-3",
          name: "000e6b28.dcm",
          size: 176 * 1024,
          path: "11/000e6b28.dcm",
        },
        {
          id: "11-4",
          name: "000e6b29.dcm",
          size: 175 * 1024,
          path: "11/000e6b29.dcm",
        },
      ],
    },
    {
      id: "12",
      category: "mri",
      tags: ["腰椎", "骨科", "椅间盘"],
      files: [
        {
          id: "12-1",
          name: "000e6b35.dcm",
          size: 169 * 1024,
          path: "12/000e6b35.dcm",
        },
        {
          id: "12-2",
          name: "000e6b36.dcm",
          size: 168 * 1024,
          path: "12/000e6b36.dcm",
        },
        {
          id: "12-3",
          name: "000e6b37.dcm",
          size: 167 * 1024,
          path: "12/000e6b37.dcm",
        },
        {
          id: "12-4",
          name: "000e6b38.dcm",
          size: 166 * 1024,
          path: "12/000e6b38.dcm",
        },
        {
          id: "12-5",
          name: "000e6b39.dcm",
          size: 165 * 1024,
          path: "12/000e6b39.dcm",
        },
      ],
    },
    {
      id: "13",
      category: "ct",
      tags: ["肋部", "肺结节", "筛查"],
      files: [
        {
          id: "13-1",
          name: "000e6b47.dcm",
          size: 157 * 1024,
          path: "13/000e6b47.dcm",
        },
        {
          id: "13-2",
          name: "000e6b48.dcm",
          size: 156 * 1024,
          path: "13/000e6b48.dcm",
        },
        {
          id: "13-3",
          name: "000e6b49.dcm",
          size: 155 * 1024,
          path: "13/000e6b49.dcm",
        },
      ],
    },
    {
      id: "14",
      category: "xray",
      tags: ["手腕", "骨科", "关节"],
      files: [
        {
          id: "14-1",
          name: "000e6b56.dcm",
          size: 148 * 1024,
          path: "14/000e6b56.dcm",
        },
        {
          id: "14-2",
          name: "000e6b57.dcm",
          size: 147 * 1024,
          path: "14/000e6b57.dcm",
        },
        {
          id: "14-3",
          name: "000e6b58.dcm",
          size: 146 * 1024,
          path: "14/000e6b58.dcm",
        },
        {
          id: "14-4",
          name: "000e6b59.dcm",
          size: 145 * 1024,
          path: "14/000e6b59.dcm",
        },
      ],
    },
    {
      id: "15",
      category: "ultrasound",
      tags: ["甘状腺", "内分泌", "功能检查"],
      files: [
        {
          id: "15-1",
          name: "000e6b65.dcm",
          size: 139 * 1024,
          path: "15/000e6b65.dcm",
        },
        {
          id: "15-2",
          name: "000e6b66.dcm",
          size: 138 * 1024,
          path: "15/000e6b66.dcm",
        },
        {
          id: "15-3",
          name: "000e6b67.dcm",
          size: 137 * 1024,
          path: "15/000e6b67.dcm",
        },
        {
          id: "15-4",
          name: "000e6b68.dcm",
          size: 136 * 1024,
          path: "15/000e6b68.dcm",
        },
        {
          id: "15-5",
          name: "000e6b69.dcm",
          size: 135 * 1024,
          path: "15/000e6b69.dcm",
        },
      ],
    },
  ];

  return folderData.map((folder) => {
    const totalSize = folder.files.reduce((sum, file) => sum + file.size, 0);
    return {
      id: folder.id,
      name: `DCM-${folder.id}`,
      createTime: 1755697500,
      updateTime: 1755697500,
      files: folder.files,
      totalFiles: folder.files.length,
      totalSize,
      ownerId: "system",
      ownerName: "系统",
      isPublic: true,
      category: folder.category,
      tags: folder.tags,
    };
  });
};

// 初始化数据
if (mockDcmData.length === 0) {
  mockDcmData = initializePublicData();
}

// 使用可靠的DICOM测试数据源
export const qiniuBaseUrl = "http://t1am3584v.hn-bkt.clouddn.com/";

// 获取所有公开数据列表（所有用户可见）
export const getDcmListRequest = async (
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedDcmResponse>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const publicData = mockDcmData.filter((item) => item.isPublic);
  const total = publicData.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = publicData.slice(startIndex, endIndex);

  return {
    code: 200,
    message: "success",
    data: {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
    },
  };
};

// 学生复制数据到自己账户
export const copyDcmToStudentRequest = async (
  dcmId: string,
  userId: string,
  userName: string
): Promise<ApiResponse<DcmList>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const originalData = mockDcmData.find((item) => item.id === dcmId);
  if (!originalData) {
    return {
      code: 404,
      message: "数据不存在",
    };
  }

  const newId = (dataIdCounter++).toString();
  const copiedData: DcmList = {
    ...originalData,
    id: newId,
    name: `${originalData.name}-副本`,
    createTime: Math.floor(Date.now() / 1000),
    updateTime: Math.floor(Date.now() / 1000),
    ownerId: userId,
    ownerName: userName,
    isPublic: false,
    originalId: dcmId,
  };

  mockStudentData.push(copiedData);

  return {
    code: 200,
    message: "复制成功",
    data: copiedData,
  };
};

// 获取学生自己的数据列表
export const getStudentDcmListRequest = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedDcmResponse>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const studentData = mockStudentData.filter((item) => item.ownerId === userId);
  const total = studentData.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = studentData.slice(startIndex, endIndex);

  return {
    code: 200,
    message: "success",
    data: {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
    },
  };
};

// 更新学生数据名称
export const updateStudentDcmNameRequest = async (
  dcmId: string,
  userId: string,
  newName: string
): Promise<ApiResponse<DcmList>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dataIndex = mockStudentData.findIndex(
    (item) => item.id === dcmId && item.ownerId === userId
  );

  if (dataIndex === -1) {
    return {
      code: 404,
      message: "数据不存在或无权限修改",
    };
  }

  mockStudentData[dataIndex] = {
    ...mockStudentData[dataIndex],
    name: newName,
    updateTime: Math.floor(Date.now() / 1000),
  };

  return {
    code: 200,
    message: "修改成功",
    data: mockStudentData[dataIndex],
  };
};

// 教师上传数据
export const uploadDcmRequest = async (
  name: string,
  userId: string,
  userName: string,
  files: File[],
  category?: string,
  tags?: string[]
): Promise<ApiResponse<DcmList>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const newId = (dataIdCounter++).toString();
  const mockFiles: DcmFile[] = files.map((file, index) => ({
    id: `${newId}-${index + 1}`,
    name: file.name,
    size: file.size,
    path: `${newId}/${file.name}`,
  }));

  const totalSize = mockFiles.reduce((sum, file) => sum + file.size, 0);
  const newData: DcmList = {
    id: newId,
    name,
    createTime: Math.floor(Date.now() / 1000),
    updateTime: Math.floor(Date.now() / 1000),
    files: mockFiles,
    totalFiles: mockFiles.length,
    totalSize,
    ownerId: userId,
    ownerName: userName,
    isPublic: true, // 教师上传的数据为公开数据
    category,
    tags: tags || [],
  };

  mockDcmData.push(newData);

  return {
    code: 200,
    message: "上传成功",
    data: newData,
  };
};

// 教师/管理员搜索所有学生数据
export const searchAllStudentDataRequest = async (
  searchTerm: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedDcmResponse>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filteredData = mockStudentData;

  // 按搜索词过滤
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.ownerName?.toLowerCase().includes(term) ||
        item.ownerId?.toLowerCase().includes(term)
    );
  }

  const total = filteredData.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    code: 200,
    message: "success",
    data: {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
    },
  };
};

// 获取单个数据详情
export const getDcmDetailRequest = async (
  dcmId: string
): Promise<ApiResponse<DcmList>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 先从公开数据中查找
  const publicData = mockDcmData.find((item) => item.id === dcmId);
  if (publicData) {
    return {
      code: 200,
      message: "success",
      data: publicData,
    };
  }

  // 从学生数据中查找
  const studentData = mockStudentData.find((item) => item.id === dcmId);
  if (studentData) {
    return {
      code: 200,
      message: "success",
      data: studentData,
    };
  }

  return {
    code: 404,
    message: "数据不存在",
  };
};

// 更新数据信息（管理员和教师权限）
export const updateDcmDataRequest = async (
  dcmId: string,
  updateData: {
    name?: string;
    category?: string;
    tags?: string[];
  },
  userId: string,
  userRole: string
): Promise<ApiResponse<DcmList>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 检查权限：只有管理员和教师可以更新
  if (userRole !== "admin" && userRole !== "teacher") {
    return {
      code: 403,
      message: "无权限修改数据",
    };
  }

  // 从公开数据中查找并更新
  const publicDataIndex = mockDcmData.findIndex((item) => item.id === dcmId);
  if (publicDataIndex !== -1) {
    mockDcmData[publicDataIndex] = {
      ...mockDcmData[publicDataIndex],
      ...updateData,
      updateTime: Math.floor(Date.now() / 1000),
    };
    return {
      code: 200,
      message: "更新成功",
      data: mockDcmData[publicDataIndex],
    };
  }

  // 从学生数据中查找并更新
  const studentDataIndex = mockStudentData.findIndex(
    (item) => item.id === dcmId
  );
  if (studentDataIndex !== -1) {
    // 如果是教师，只能更新自己上传的数据
    if (
      userRole === "teacher" &&
      mockStudentData[studentDataIndex].ownerId !== userId
    ) {
      return {
        code: 403,
        message: "无权限修改其他用户的数据",
      };
    }
    mockStudentData[studentDataIndex] = {
      ...mockStudentData[studentDataIndex],
      ...updateData,
      updateTime: Math.floor(Date.now() / 1000),
    };
    return {
      code: 200,
      message: "更新成功",
      data: mockStudentData[studentDataIndex],
    };
  }

  return {
    code: 404,
    message: "数据不存在",
  };
};

// 删除数据（管理员和教师权限）
export const deleteDcmDataRequest = async (
  dcmId: string,
  userId: string,
  userRole: string
): Promise<ApiResponse<void>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 检查权限：只有管理员和教师可以删除
  if (userRole !== "admin" && userRole !== "teacher") {
    return {
      code: 403,
      message: "无权限删除数据",
    };
  }

  // 从公开数据中查找并删除
  const publicDataIndex = mockDcmData.findIndex((item) => item.id === dcmId);
  if (publicDataIndex !== -1) {
    mockDcmData.splice(publicDataIndex, 1);
    return {
      code: 200,
      message: "删除成功",
    };
  }

  // 从学生数据中查找并删除（管理员可以删除所有学生数据）
  const studentDataIndex = mockStudentData.findIndex(
    (item) => item.id === dcmId
  );
  if (studentDataIndex !== -1) {
    // 如果是教师，只能删除自己上传的数据
    if (
      userRole === "teacher" &&
      mockStudentData[studentDataIndex].ownerId !== userId
    ) {
      return {
        code: 403,
        message: "无权限删除其他用户的数据",
      };
    }
    mockStudentData.splice(studentDataIndex, 1);
    return {
      code: 200,
      message: "删除成功",
    };
  }

  return {
    code: 404,
    message: "数据不存在",
  };
};
