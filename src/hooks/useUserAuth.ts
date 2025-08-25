import { useAppStore } from "@/stores/app";
import type { UserRole } from "@/api/login";

export const useUserAuth = () => {
  const { userInfo } = useAppStore();

  const isAdmin = userInfo?.role === "admin";
  const isTeacher = userInfo?.role === "teacher";
  const isStudent = userInfo?.role === "student";

  // 检查是否有管理员权限
  const hasAdminPermission = isAdmin;

  // 检查是否有教师权限（包括管理员）
  const hasTeacherPermission = isAdmin || isTeacher;

  // 检查是否有学生权限（所有用户都有）
  const hasStudentPermission = Boolean(userInfo);

  // 检查是否可以上传数据
  const canUpload = hasTeacherPermission;

  // 检查是否可以查看所有学生数据
  const canViewAllStudentData = hasTeacherPermission;

  // 检查是否可以复制数据
  const canCopyData = isStudent;

  // 检查是否可以编辑自己的数据
  const canEditOwnData = isStudent;

  return {
    userInfo,
    role: userInfo?.role as UserRole,
    isAdmin,
    isTeacher,
    isStudent,
    hasAdminPermission,
    hasTeacherPermission,
    hasStudentPermission,
    canUpload,
    canViewAllStudentData,
    canCopyData,
    canEditOwnData,
  };
};
