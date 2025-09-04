import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DocsPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"list" | "cards">("list");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const cards = [
    {
      title: "胸部X光数据集",
      desc: "常用于胸部异常检测和分类。",
      key: "xray",
      img: "/images/Rectangle 16.png",
    },
    {
      title: "腹部CT数据集",
      desc: "脏器分割、肿瘤检测等任务。",
      key: "ct",
      img: "/images/Rectangle 16-1.png",
    },
    {
      title: "脑部MRI数据集",
      desc: "多序列病灶分割与诊断研究。",
      key: "mri",
      img: "/images/Rectangle 16-2.png",
    },
    {
      title: "心脏超声数据集",
      desc: "心腔测量与功能评估。",
      key: "us",
      img: "/images/Rectangle 16-3.png",
    },
    {
      title: "全身PET-CT数据集",
      desc: "代谢与解剖信息联合分析。",
      key: "petct",
      img: "/images/Rectangle 16-4.png",
    },
    {
      title: "病理切片数据集",
      desc: "用于细胞/组织学分类和检出。",
      key: "pathology",
      img: "/images/Rectangle 16-5.png",
    },
  ];

  const tableRows = Array.from({ length: 10 }).map((_, idx) => {
    const name = `FILE0肝部CT-XXX`;
    const createdAt = `2025-08-18 12:00:19`;
    const annotated = idx % 3 !== 1;
    const annotatedAt = annotated ? `2025-08-19 12:00:19` : `——`;
    return {
      id: idx + 1,
      name,
      format: "dcm",
      createdAt,
      annotated,
      annotatedAt,
    };
  });

  useEffect(() => {
    const onDocClick = () => setMenuOpenId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-[1200px] flex gap-6">
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="text-xs text-gray-500 px-2 pb-2">导航</div>
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  工作台
                </button>
              </nav>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          {mode === "list" ? (
            <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-gray-900">
                    PET-CT
                  </div>
                  <div className="text-xs text-gray-500">
                    首页 · 数据文档 · PET-CT
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  onClick={() => navigate("/upload")}
                >
                  上传
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        文件名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        文件格式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        标注状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        标注时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {tableRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-800">
                          {row.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {row.format}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {row.createdAt}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {row.annotated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-600 border border-green-200 text-xs">
                              已标注
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-xs">
                              未标注
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {row.annotatedAt}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <div className="relative inline-flex items-center gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-700 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMode("cards");
                                setMenuOpenId(null);
                              }}
                            >
                              查看
                            </button>
                            <button
                              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(
                                  menuOpenId === row.id ? null : row.id
                                );
                              }}
                              aria-label="更多操作"
                            >
                              <span className="block w-1 h-1 bg-gray-500 rounded-full" />
                              <span className="block w-1 h-1 bg-gray-500 rounded-full mx-[2px]" />
                              <span className="block w-1 h-1 bg-gray-500 rounded-full" />
                            </button>

                            {menuOpenId === row.id && (
                              <div
                                className="absolute right-0 top-8 z-20 w-28 bg-white border border-gray-200 rounded-md shadow-lg py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    navigate(`/edit/9`);
                                  }}
                                >
                                  编辑
                                </button>
                                <div className="w-full px-3 py-2 text-sm text-gray-400 cursor-not-allowed select-none">
                                  重命名
                                </div>
                                <div className="w-full px-3 py-2 text-sm text-gray-400 cursor-not-allowed select-none">
                                  移动
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="text-lg font-semibold text-gray-900">
                  数据文档 · 专题
                </div>
                <button
                  className="px-3 py-1.5 text-xs rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
                  onClick={() => setMode("list")}
                >
                  返回列表
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cards.map((c) => (
                  <div
                    key={c.key}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                    onClick={() => navigate("/original/9")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-800 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-600 rounded-sm inline-block" />
                      {c.title}
                    </div>
                    <div className="p-4">
                      <div className="aspect-[16/10] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={c.img as string}
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs leading-6 text-gray-500">
                        {c.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
