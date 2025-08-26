import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  useDisclosure,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import {
  copyDcmToStudentRequest,
  updateStudentDcmNameRequest,
  type DcmList,
} from "../../api/dcm";
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

  // 编辑名称Modal
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();
  const [editingItem, setEditingItem] = useState<DcmList | null>(null);
  const [editName, setEditName] = useState("");

  // 学生数据列表引用，用于刷新
  const studentDataListRef = useRef<StudentDataListRef>(null);

  // 复制数据到学生账户
  const handleCopyData = async (dcm: DcmList) => {
    if (!userInfo?.userId || !userInfo?.userName) return;

    try {
      const response = await copyDcmToStudentRequest(
        dcm.id,
        userInfo.userId,
        userInfo.userName
      );
      if (response.code === 200) {
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

  // 打开编辑名称模态框
  const handleEditName = (dcm: DcmList) => {
    setEditingItem(dcm);
    setEditName(dcm.name);
    onEditOpen();
  };

  // 保存编辑名称
  const handleSaveEdit = async () => {
    if (!editingItem || !userInfo?.userId) return;

    try {
      const response = await updateStudentDcmNameRequest(
        editingItem.id,
        userInfo.userId,
        editName
      );
      if (response.code === 200) {
        addToast({
          color: "success",
          description: "修改成功",
        });
        // 刷新学生数据
        if (studentDataListRef.current) {
          studentDataListRef.current.refresh();
        }
        onEditOpenChange();
      } else {
        addToast({
          color: "danger",
          description: response.message || "修改失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请重试",
      });
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
            <PublicDataList onFileClick={handleFileClick} />
          </Tab>

          {/* 学生个人数据 - 仅学生可见 */}
          {isStudent && (
            <Tab key="student" title="我的数据">
              <StudentDataList
                ref={studentDataListRef}
                userId={userInfo?.userId || ""}
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

        {/* 编辑名称模态框 */}
        <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  编辑数据名称
                </ModalHeader>
                <ModalBody>
                  <Input
                    label="数据名称"
                    placeholder="请输入新的数据名称"
                    value={editName}
                    onValueChange={setEditName}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    取消
                  </Button>
                  <Button color="primary" onPress={handleSaveEdit}>
                    保存
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default ListPage;
