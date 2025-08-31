import { StudentUser } from "@/types/api";
import React from "react";

interface StudentUserListProps {
  students: StudentUser[];
  loading: boolean;
  onRoleChange?: (userId: number, newRole: number) => void;
  onResetPassword?: (userId: number) => void;
}

const StudentUserList: React.FC<StudentUserListProps> = ({
  students,
  loading,
  onRoleChange,
  onResetPassword,
}) => {
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
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
                <div className="text-sm text-gray-900">{student.email}</div>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  {/* 设置为老师 */}
                  <button
                    onClick={() => onRoleChange?.(student.user_id, 2)}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                  >
                    设为老师
                  </button>

                  {/* 重置密码 */}
                  <button
                    onClick={() => onResetPassword?.(student.user_id)}
                    className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    重置密码
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(!students || students.length === 0) && (
        <div className="p-6 text-center text-gray-500">暂无学生用户</div>
      )}
    </div>
  );
};

export default StudentUserList;
