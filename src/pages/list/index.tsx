import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { copyPublicDataToPrivateRequest, type DcmData } from "@/api/dcm_new";
import { useUserAuth } from "@/hooks/useUserAuth";
import {
  PublicDataList,
  StudentDataList,
  AllStudentDataList,
  type StudentDataListRef,
} from "./components";

function ListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const {
    userInfo,
    isStudent,
    canViewAllStudentData,
    canCopyData,
    canEditOwnData,
  } = useUserAuth();

  // 当前选中的标签页
  const [selectedTab, setSelectedTab] = useState("public");

  // 学生数据列表引用，用于刷新
  const studentDataListRef = useRef<StudentDataListRef>(null);

  // 复制数据到学生账户
  const handleCopyData = async (dcm: DcmData) => {
    if (!userInfo?.user_id || !userInfo?.username) return;

    try {
      const response = await copyPublicDataToPrivateRequest({
        original_data_id: dcm.id,
      });
      if (response.success) {
        addToast({
          color: "success",
          description: "复制成功！您可以在“我的数据”中查看",
        });
        // 刷新学生数据
        if (isStudent && studentDataListRef.current) {
          studentDataListRef.current.refresh();
        }
      } else {
        addToast({
          color: "danger",
          description: response.message || "复制失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
    }
  };

  // 复制成功后切换到我的数据标签页
  const handleCopySuccess = () => {
    if (isStudent) {
      setSelectedTab("student");
      // 刷新学生数据
      if (studentDataListRef.current) {
        studentDataListRef.current.refresh();
      }
    }
  };

  // 跳转到详情页
  const handleFileClick = (id: string): void => {
    navigate(`/detail/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 pt-3">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key.toString())}
          variant="underlined"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary-500",
            tab: "max-w-fit px-0 h-12",
          }}
        >
          {/* 公共数据列表 - 所有用户可见 */}
          <Tab key="public" title="公共数据">
            <PublicDataList
              onFileClick={handleFileClick}
              onCopySuccess={handleCopySuccess}
            />
          </Tab>

          {/* 学生个人数据 - 仅学生可见 */}
          {isStudent && (
            <Tab key="student" title="我的数据">
              <StudentDataList
                ref={studentDataListRef}
                userId={userInfo?.user_id?.toString() || ""}
                onFileClick={handleFileClick}
              />
            </Tab>
          )}

          {/* 所有学生数据 - 教师和管理员可见 */}
          {canViewAllStudentData && (
            <Tab key="allStudent" title="学生数据">
              <AllStudentDataList onFileClick={handleFileClick} />
            </Tab>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default ListPage;
