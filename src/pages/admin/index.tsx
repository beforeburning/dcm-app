import React, { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import {
  getAllUsersRequest,
  updateUserRoleRequest,
  searchUsersRequest,
  type AdminUser,
} from "@/api/admin";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminPageProps {}

const AdminPage: React.FC<AdminPageProps> = () => {
  const { isAdmin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

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

  // 获取所有用户
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsersRequest();
      if (res.code === 200 && res.data) {
        setUsers(res.data);
        setFilteredUsers(res.data);
      } else {
        addToast({
          color: "danger",
          description: res.message || "获取用户列表失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  // 更新用户权限
  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "teacher" | "student"
  ) => {
    try {
      const res = await updateUserRoleRequest(userId, newRole);
      if (res.code === 200) {
        addToast({
          color: "success",
          description: "权限更新成功",
        });
        // 刷新用户列表
        fetchUsers();
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

  // 搜索和过滤
  useEffect(() => {
    let filtered = users;

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 按权限过滤
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, selectedRole, users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500 text-white";
      case "teacher":
        return "bg-blue-500 text-white";
      case "student":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "管理员";
      case "teacher":
        return "老师";
      case "student":
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 outline-none py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入用户名、邮箱或用户ID搜索..."
              />
            </div>

            {/* 权限过滤 */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                权限筛选
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有权限</option>
                <option value="admin">管理员</option>
                <option value="teacher">老师</option>
                <option value="student">学生</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              用户列表 ({filteredUsers.length})
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
                      当前权限
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {user.userName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.userId,
                              e.target.value as "admin" | "teacher" | "student"
                            )
                          }
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={
                            user.role === "admin" && user.userId === "admin_001"
                          } // 防止删除主管理员
                        >
                          <option value="admin">管理员</option>
                          <option value="teacher">老师</option>
                          <option value="student">学生</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && !loading && (
                <div className="p-6 text-center text-gray-500">
                  {searchTerm || selectedRole !== "all"
                    ? "没有找到匹配的用户"
                    : "暂无用户数据"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
