import React from "react";
import { useNavigate } from "react-router-dom";

export default function DocsPage() {
  const navigate = useNavigate();
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
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-semibold text-gray-900">数据文档</div>
            <button
              className="px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              onClick={() => navigate("/upload")}
            >
              上传
            </button>
          </div>
          <div className="text-sm text-gray-500 mb-6">首页 · 数据文档</div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map((c, idx) => (
              <div
                key={c.key}
                className="bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => navigate("/original/8")}
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
        </section>
      </div>
    </div>
  );
}
