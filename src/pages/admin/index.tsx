import React, { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import { Pagination } from "@heroui/react";
import {
  getStudentsDataRequest,
  updateUserRoleRequest,
  resetUserPasswordRequest,
  type StudentUser,
} from "@/api/admin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import StudentUserList from "./components/StudentUserList";

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

      // 添加搜索关键词
      if (search) {
        params.keyword = search;
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理修改权限
  const handleRoleChange = async (userId: number, newRole: number) => {
    try {
      const res = await updateUserRoleRequest(userId, newRole as any);
      if (res.success) {
        addToast({
          color: "success",
          description: `用户 ${res.data.username} 的角色已从 ${res.data.old_role_name} 修改为 ${res.data.new_role_name}`,
        });
        // 重新获取当前页数据
        fetchStudents();
      } else {
        addToast({
          color: "danger",
          description: res.message || "权限更新失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    }
  };

  // 处理重置密码
  const handleResetPassword = async (userId: number) => {
    if (!confirm(`确定要重置用户 ID: ${userId} 的密码吗？`)) {
      return;
    }

    try {
      const res = await resetUserPasswordRequest(userId);
      if (res.success) {
        addToast({
          color: "success",
          description: "密码重置成功",
        });
        // 弹窗显示新密码
        alert(
          `用户 ${res.data.username} (${res.data.email}) 的密码已重置为: ${res.data.new_password}`
        );
      } else {
        addToast({
          color: "danger",
          description: res.message || "密码重置失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "密码重置失败，请重试",
      });
    }
  };

  // 监听搜索、筛选和分页变化
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudents(searchTerm, selectedRole, currentPage);
    }, 300); // 防抖动处理

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRole, currentPage]);

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
                placeholder="输入关键词搜索用户..."
              />
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

          <StudentUserList
            students={students}
            loading={loading}
            onRoleChange={handleRoleChange}
            onResetPassword={handleResetPassword}
          />

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
