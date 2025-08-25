import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Button,
  Input,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import {
  getDcmListRequest,
  getStudentDcmListRequest,
  searchAllStudentDataRequest,
  copyDcmToStudentRequest,
  updateStudentDcmNameRequest,
  type DcmList,
  type PaginatedDcmResponse,
} from "../../api/dcm";
import { useUserAuth } from "@/hooks/useUserAuth";

function ListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const {
    userInfo,
    isStudent,
    isTeacher,
    isAdmin,
    canUpload,
    canViewAllStudentData,
    canCopyData,
    canEditOwnData,
  } = useUserAuth();

  // 公共数据状态
  const [publicData, setPublicData] = useState<DcmList[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicPage, setPublicPage] = useState(1);
  const [publicTotal, setPublicTotal] = useState(0);
  const [publicTotalPages, setPublicTotalPages] = useState(0);

  // 学生个人数据状态
  const [studentData, setStudentData] = useState<DcmList[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(0);

  // 教师查看所有学生数据状态
  const [allStudentData, setAllStudentData] = useState<DcmList[]>([]);
  const [allStudentLoading, setAllStudentLoading] = useState(false);
  const [allStudentPage, setAllStudentPage] = useState(1);
  const [allStudentTotal, setAllStudentTotal] = useState(0);
  const [allStudentTotalPages, setAllStudentTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

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

  const pageSize = 10;

  // 获取公共数据列表
  const fetchPublicData = async (page: number = publicPage) => {
    setPublicLoading(true);
    try {
      const response = await getDcmListRequest(page, pageSize);
      if (response.code === 200 && response.data) {
        setPublicData(response.data.data);
        setPublicTotal(response.data.total);
        setPublicTotalPages(response.data.totalPages);
        setPublicPage(response.data.page);
      } else {
        addToast({
          color: "danger",
          description: response.message || "获取数据失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请稍后重试",
      });
    } finally {
      setPublicLoading(false);
    }
  };

  // 获取学生个人数据
  const fetchStudentData = async (page: number = studentPage) => {
    if (!userInfo?.userId) return;

    setStudentLoading(true);
    try {
      const response = await getStudentDcmListRequest(
        userInfo.userId,
        page,
        pageSize
      );
      if (response.code === 200 && response.data) {
        setStudentData(response.data.data);
        setStudentTotal(response.data.total);
        setStudentTotalPages(response.data.totalPages);
        setStudentPage(response.data.page);
      } else {
        addToast({
          color: "danger",
          description: response.message || "获取数据失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请稍后重试",
      });
    } finally {
      setStudentLoading(false);
    }
  };

  // 获取所有学生数据（教师/管理员）
  const fetchAllStudentData = async (
    page: number = allStudentPage,
    search: string = searchTerm
  ) => {
    setAllStudentLoading(true);
    try {
      const response = await searchAllStudentDataRequest(
        search,
        page,
        pageSize
      );
      if (response.code === 200 && response.data) {
        setAllStudentData(response.data.data);
        setAllStudentTotal(response.data.total);
        setAllStudentTotalPages(response.data.totalPages);
        setAllStudentPage(response.data.page);
      } else {
        addToast({
          color: "danger",
          description: response.message || "获取数据失败",
        });
      }
    } catch {
      addToast({
        color: "danger",
        description: "网络错误，请稍后重试",
      });
    } finally {
      setAllStudentLoading(false);
    }
  };

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
        if (isStudent) {
          fetchStudentData(1);
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
        fetchStudentData(); // 刷新数据
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

  // 搜索处理
  const handleSearch = () => {
    setAllStudentPage(1);
    fetchAllStudentData(1, searchTerm);
  };

  // 初始化数据
  useEffect(() => {
    fetchPublicData();
  }, []);

  // 根据选中的标签页加载数据
  useEffect(() => {
    if (selectedTab === "student" && isStudent) {
      fetchStudentData();
    } else if (selectedTab === "allStudent" && canViewAllStudentData) {
      fetchAllStudentData();
    }
  }, [selectedTab, userInfo]);

  // 搜索防抖
  useEffect(() => {
    if (selectedTab === "allStudent" && canViewAllStudentData) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
  };

  // 渲染数据列表
  const renderDataList = (
    data: DcmList[],
    loading: boolean,
    showCopyButton: boolean = false,
    showEditButton: boolean = false,
    showOwnerInfo: boolean = false
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      );
    }

    if (data.length === 0) {
      return <div className="text-center py-8 text-gray-500">暂无数据</div>;
    }

    return (
      <div className="space-y-4">
        {data.map((dcm) => (
          <Card
            key={dcm.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
          >
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1" onClick={() => handleFileClick(dcm.id)}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {dcm.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      文件数: {dcm.totalFiles} | 总大小:{" "}
                      {(dcm.totalSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p>
                      创建时间: {formatTime(dcm.createTime)} | 更新时间:{" "}
                      {formatTime(dcm.updateTime)}
                    </p>
                    {showOwnerInfo && dcm.ownerName && (
                      <p className="text-blue-600">
                        数据拥有者: {dcm.ownerName}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">ID: {dcm.id}</div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {showCopyButton && canCopyData && (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyData(dcm);
                      }}
                    >
                      复制到我的账户
                    </Button>
                  )}

                  {showEditButton && canEditOwnData && (
                    <Button
                      size="sm"
                      color="secondary"
                      variant="flat"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditName(dcm);
                      }}
                    >
                      编辑名称
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
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
            <div className="pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  公共数据列表 ({publicTotal})
                </h2>
                {canUpload && (
                  <Button
                    color="primary"
                    onPress={() => navigate("/upload")}
                    className="font-medium"
                  >
                    上传数据
                  </Button>
                )}
              </div>

              <Card>
                <CardBody className="p-6">
                  {renderDataList(publicData, publicLoading, canCopyData)}

                  {!publicLoading && publicTotalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <Pagination
                        total={publicTotalPages}
                        page={publicPage}
                        onChange={(page) => {
                          setPublicPage(page);
                          fetchPublicData(page);
                        }}
                        showControls
                        size="md"
                        color="primary"
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>

          {/* 学生个人数据 - 仅学生可见 */}
          {isStudent && (
            <Tab key="student" title="我的数据">
              <div className="py-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    我的数据列表 ({studentTotal})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    您复制的数据，可以编辑名称
                  </p>
                </div>

                <Card>
                  <CardBody className="p-6">
                    {renderDataList(studentData, studentLoading, false, true)}

                    {!studentLoading && studentTotalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <Pagination
                          total={studentTotalPages}
                          page={studentPage}
                          onChange={(page) => {
                            setStudentPage(page);
                            fetchStudentData(page);
                          }}
                          showControls
                          size="md"
                          color="primary"
                        />
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </Tab>
          )}

          {/* 所有学生数据 - 教师和管理员可见 */}
          {canViewAllStudentData && (
            <Tab key="allStudent" title="学生数据">
              <div className="py-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    所有学生数据 ({allStudentTotal})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    查看所有学生复制的数据
                  </p>
                </div>

                {/* 搜索功能 */}
                <div className="mb-6">
                  <Input
                    placeholder="搜索数据名称、拥有者..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="max-w-md"
                    endContent={
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onClick={handleSearch}
                      >
                        搜索
                      </Button>
                    }
                  />
                </div>

                <Card>
                  <CardBody className="p-6">
                    {renderDataList(
                      allStudentData,
                      allStudentLoading,
                      false,
                      false,
                      true
                    )}

                    {!allStudentLoading && allStudentTotalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <Pagination
                          total={allStudentTotalPages}
                          page={allStudentPage}
                          onChange={(page) => {
                            setAllStudentPage(page);
                            fetchAllStudentData(page, searchTerm);
                          }}
                          showControls
                          size="md"
                          color="primary"
                        />
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
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
