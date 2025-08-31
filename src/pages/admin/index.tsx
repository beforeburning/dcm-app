import React, { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import { Pagination } from "@heroui/react";
import {
  getStudentsDataRequest,
  updateUserRoleRequest,
  type StudentUser,
} from "@/api/admin";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminPageProps {}

const AdminPage: React.FC<AdminPageProps> = () => {
  const { isAdmin } = useAdminAuth();
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // 如果不是管理员，不渲染内容
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">检查权限中...</div>
        </div>
      </div>
    );
  }

  // 获取学生用户列表（使用搜索接口）
  const fetchStudents = async (
    search: string = searchTerm,
    role: string = selectedRole,
    page: number = currentPage
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: pageSize,
      };

      // 根据搜索词判断搜索类型
      if (search) {
        if (search.includes("@")) {
          params.email = search;
        } else {
          params.username = search;
        }
      }

      const res = await getStudentsDataRequest(params);
      console.log("API Response:", res); // 添加调试日志
      if (res.success && res.data) {
        setStudents(res.data.list || []);
        setTotal(res.data.pagination.total || 0);
        setTotalPages(res.data.pagination.last_page || 0);
        setCurrentPage(res.data.pagination.current_page || 1);
      } else {
        setStudents([]);
        setTotal(0);
        setTotalPages(0);
        addToast({
          color: "danger",
          description: res.message || "获取学生用户列表失败",
        });
      }
    } catch {
      setStudents([]);
      setTotal(0);
      setTotalPages(0);
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索和筛选变化
  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // 重置到第一页
  };

  const handleRoleFilterChange = (role: string) => {
    setSelectedRole(role);
    setCurrentPage(1); // 重置到第一页
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 监听搜索和筛选变化
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudents(searchTerm, selectedRole, currentPage);
    }, 300); // 防抖动处理

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRole]);

  // 监听分页变化
  useEffect(() => {
    fetchStudents(searchTerm, selectedRole, currentPage);
  }, [currentPage]);

  // 初始化加载数据
  useEffect(() => {
    fetchStudents();
  }, []);

  const getRoleColor = (role: number) => {
    switch (role) {
      case 1:
        return "bg-red-500 text-white";
      case 2:
        return "bg-blue-500 text-white";
      case 3:
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRoleText = (role: number) => {
    switch (role) {
      case 1:
        return "管理员";
      case 2:
        return "老师";
      case 3:
        return "学生";
      default:
        return "未知";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 搜索和过滤 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索用户
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 outline-none py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入用户名、邮箱或用户ID搜索..."
              />
            </div>

            {/* 角色过滤 */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色筛选
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="w-full pl-2 pr-4 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有角色</option>
                <option value="1">管理员</option>
                <option value="2">老师</option>
                <option value="3">学生</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              学生用户列表 ({total})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students?.map((student) => (
                    <tr key={student.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {student.username.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {student.user_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            student.role
                          )}`}
                        >
                          {getRoleText(student.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(!students || students.length === 0) && !loading && (
                <div className="p-6 text-center text-gray-500">
                  {searchTerm || selectedRole !== "all"
                    ? "没有找到匹配的学生用户"
                    : "暂无学生用户"}
                </div>
              )}
            </div>
          )}

          {/* 分页组件 */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center px-6 py-5 border-t border-gray-200">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                showControls
                size="md"
                color="primary"
                variant="flat"
                radius="md"
                classNames={{
                  wrapper: "gap-4 overflow-visible h-12",
                  item: "w-12 h-12 text-base cursor-pointer",
                  cursor: "w-12 h-12 text-base cursor-pointer",
                  prev: "w-12 h-12 text-base cursor-pointer",
                  next: "w-12 h-12 text-base cursor-pointer",
                  ellipsis: "w-12 h-12 text-base cursor-pointer",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
