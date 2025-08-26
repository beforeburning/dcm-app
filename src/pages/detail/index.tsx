import { useEffect, useRef, useState, useCallback } from "react";
import * as cornerstone from "@cornerstonejs/core";
import {
  RenderingEngine,
  Enums,
  init as csRenderInit,
} from "@cornerstonejs/core";
import {
  init as csToolsInit,
  addTool,
  PanTool,
  WindowLevelTool,
  ZoomTool,
  ToolGroupManager,
  Enums as ToolsEnums,
} from "@cornerstonejs/tools";
import dicomImageLoader, {
  init as dicomImageLoaderInit,
} from "@cornerstonejs/dicom-image-loader";
import * as dicomParser from "dicom-parser";

const { ViewportType } = Enums;
const { MouseBindings } = ToolsEnums;

// 工具显示名称
const getToolDisplayName = (toolName: string): string => {
  switch (toolName) {
    case "WindowLevel":
      return "窗位/窗宽";
    case "Pan":
      return "平移";
    case "Zoom":
      return "缩放";
    default:
      return toolName;
  }
};

// 工具使用说明
const getToolInstructions = (toolName: string): string => {
  switch (toolName) {
    case "WindowLevel":
      return "拖动鼠标调节亮度和对比度";
    case "Pan":
      return "拖动鼠标移动图像";
    case "Zoom":
      return "拖动鼠标缩放图像";
    default:
      return "选择工具进行操作";
  }
};

function DetailPage() {
  const elementRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTool, setActiveTool] = useState("WindowLevel"); // 当前激活的工具
  const renderingEngineRef = useRef(null);
  const toolGroupRef = useRef(null); // 保存工具组引用

  // 初始化 Cornerstone
  useEffect(() => {
    const initCornerstone = async () => {
      try {
        // 初始化 cornerstone
        await csRenderInit();

        // 确保 dicomImageLoader.external 存在
        if (!(dicomImageLoader as any).external) {
          (dicomImageLoader as any).external = {};
        }

        // 配置 DICOM Image Loader
        (dicomImageLoader as any).external.cornerstone = cornerstone;
        (dicomImageLoader as any).external.dicomParser = dicomParser;

        // 初始化 dicom image loader
        dicomImageLoaderInit();
        // 确保 wadouri 加载器已注册（幂等）
        try {
          if (dicomImageLoader?.wadouri?.register) {
            dicomImageLoader.wadouri.register();
          }
        } catch (e) {
          console.warn("注册 wadouri 加载器时出错（可忽略）", e);
        }

        // 可选：增加 XHR 调试日志，便于定位“卡在加载中”
        try {
          if ((dicomImageLoader as any)?.internal?.setOptions) {
            (dicomImageLoader as any).internal.setOptions({
              onloadstart: (_e: any, params: any) => {
                console.log("请求开始", params?.url);
              },
              onprogress: (e: any, params: any) => {
                console.log("加载进度", params?.url, e?.loaded, e?.total);
              },
              onreadystatechange: (e: any, params: any) => {
                const xhr = e?.target;
                console.log(
                  "readyState",
                  params?.url,
                  (xhr as any)?.readyState,
                  (xhr as any)?.status
                );
              },
              onloadend: (_e: any, params: any) => {
                console.log("请求结束", params?.url);
              },
              beforeProcessing: (xhr: any) => Promise.resolve(xhr.response),
              errorInterceptor: (error: any) => {
                console.error("请求错误", error);
              },
            });
          }
        } catch (e) {
          console.warn("设置 dicomImageLoader 调试选项失败（可忽略）", e);
        }

        console.log(dicomImageLoader);
        // 配置 Web Workers
        // dicomImageLoader.configure({
        //   useWebWorkers: false, // 简化配置
        // });

        // 初始化工具
        await csToolsInit();

        // 添加工具
        addTool(PanTool);
        addTool(WindowLevelTool);
        addTool(ZoomTool);

        setIsInitialized(true);
        console.log("Cornerstone 初始化成功");
      } catch (err) {
        console.error("Cornerstone 初始化失败:", err);
        setError("初始化失败: " + err.message);
      }
    };

    initCornerstone();

    // 清理函数
    return () => {
      try {
        // 清理渲染引擎
        if (renderingEngineRef.current) {
          renderingEngineRef.current.destroy();
          renderingEngineRef.current = null;
        }

        // 清理工具组
        const toolGroupId = "STACK_TOOL_GROUP_ID";
        try {
          const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
          if (toolGroup) {
            ToolGroupManager.destroyToolGroup(toolGroupId);
          }
        } catch (e) {
          console.warn("清理工具组时出错（可忽略）:", e);
        }
      } catch (e) {
        console.warn("组件清理时出错（可忽略）:", e);
      }
    };
  }, []);

  // 加载和渲染 DICOM 文件
  const loadDicomFile = useCallback(async () => {
    if (!isInitialized || !elementRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const element = elementRef.current;

      // 清理之前的渲染引擎
      if (renderingEngineRef.current) {
        try {
          renderingEngineRef.current.destroy();
        } catch (e) {
          console.warn("清理渲染引擎时出错（可忽略）:", e);
        }
        renderingEngineRef.current = null;
      }

      // 创建渲染引擎
      const renderingEngineId = "myRenderingEngine";
      const renderingEngine = new RenderingEngine(renderingEngineId);
      renderingEngineRef.current = renderingEngine;

      // 创建视口
      const viewportId = "CT_SAGITTAL_STACK";
      const viewportInput = {
        viewportId,
        type: ViewportType.STACK,
        element,
        defaultOptions: {
          background: [0, 0, 0] as [number, number, number],
        },
      };

      renderingEngine.enableElement(viewportInput);

      // 等待DOM更新后调整尺寸
      setTimeout(() => {
        try {
          renderingEngine.resize(true);
        } catch (e) {
          console.warn("调整渲染引擎尺寸失败:", e);
        }
      }, 50);

      // 获取视口
      const viewport = renderingEngine.getViewport(viewportId);

      // 创建工具组 - 检查是否已存在
      const toolGroupId = "STACK_TOOL_GROUP_ID";
      let toolGroup;

      try {
        // 尝试获取已存在的工具组
        toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
        if (toolGroup) {
          // 如果工具组已存在，先销毁它
          ToolGroupManager.destroyToolGroup(toolGroupId);
        }
      } catch (e) {
        // 工具组不存在，继续创建新的
        console.log("工具组不存在，将创建新的");
      }

      // 创建新的工具组
      toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
      toolGroupRef.current = toolGroup; // 保存工具组引用

      // 添加工具到工具组
      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);

      // 设置工具为激活状态
      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Auxiliary }],
      });
      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Secondary }],
      });

      // 将工具组添加到视口
      toolGroup.addViewport(viewportId, renderingEngineId);

      // 加载图像
      const imageId = "wadouri:/3.dcm";
      const imageIds = [imageId];

      // 设置图像堆栈
      await (viewport as any).setStack(imageIds);

      // 渲染
      renderingEngine.render();

      console.log("DICOM 文件加载成功");
    } catch (err) {
      console.error("加载 DICOM 文件失败:", err);
      setError("加载失败: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // 切换工具
  const switchTool = useCallback((toolName) => {
    if (!toolGroupRef.current) return;

    try {
      const toolGroup = toolGroupRef.current;

      // 先将所有工具设为非激活状态
      toolGroup.setToolPassive(WindowLevelTool.toolName);
      toolGroup.setToolPassive(PanTool.toolName);
      toolGroup.setToolPassive(ZoomTool.toolName);

      // 激活选中的工具
      switch (toolName) {
        case "WindowLevel":
          toolGroup.setToolActive(WindowLevelTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "Pan":
          toolGroup.setToolActive(PanTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "Zoom":
          toolGroup.setToolActive(ZoomTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
      }

      setActiveTool(toolName);
      console.log(`已切换到工具: ${toolName}`);
    } catch (error) {
      console.error("切换工具失败:", error);
    }
  }, []);

  // 重置视图
  const resetView = useCallback(() => {
    if (!renderingEngineRef.current) return;

    try {
      const renderingEngine = renderingEngineRef.current;
      const viewport = renderingEngine.getViewport("CT_SAGITTAL_STACK");

      if (viewport && typeof (viewport as any).resetCamera === "function") {
        (viewport as any).resetCamera();
        renderingEngine.render();
        console.log("已重置视图");
      }
    } catch (error) {
      console.error("重置视图失败:", error);
    }
  }, []);

  // 初始化完成后自动加载
  useEffect(() => {
    if (isInitialized) {
      // 等待DOM元素渲染完成
      setTimeout(() => {
        loadDicomFile();
      }, 100);
    }
  }, [isInitialized, loadDicomFile]);

  // 监听窗口尺寸变化，调整视口大小
  useEffect(() => {
    const handleResize = () => {
      if (renderingEngineRef.current && elementRef.current) {
        try {
          setTimeout(() => {
            const renderingEngine = renderingEngineRef.current;
            if (renderingEngine) {
              renderingEngine.resize(true);
              renderingEngine.render();
            }
          }, 100);
        } catch (error) {
          console.warn("调整视口尺寸失败:", error);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // 初始化时也调用一次
    if (isInitialized) {
      setTimeout(handleResize, 200);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isInitialized]);

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部控制栏 */}
      <div className="bg-gray-800 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">DICOM 图像查看器</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDicomFile}
              disabled={!isInitialized || isLoading}
              className={`
                px-4 py-2 text-sm rounded transition-colors duration-200
                ${
                  isInitialized
                    ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    : "bg-gray-500 cursor-not-allowed"
                }
                ${!isInitialized || isLoading ? "opacity-75" : ""}
              `}
            >
              {isLoading ? "加载中..." : "重新加载"}
            </button>

            <button
              onClick={resetView}
              disabled={!isInitialized || isLoading}
              className={`
                px-4 py-2 text-sm rounded transition-colors duration-200
                ${
                  isInitialized
                    ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                    : "bg-gray-500 cursor-not-allowed"
                }
                ${!isInitialized || isLoading ? "opacity-75" : ""}
              `}
            >
              重置视图
            </button>
          </div>
        </div>

        {/* 工具栏 */}
        {isInitialized && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium">工具:</span>

            <button
              onClick={() => switchTool("WindowLevel")}
              className={`
                px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                ${
                  activeTool === "WindowLevel"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }
              `}
            >
              🌅 窗位/窗宽
            </button>

            <button
              onClick={() => switchTool("Pan")}
              className={`
                px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                ${
                  activeTool === "Pan"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }
              `}
            >
              ✋ 平移
            </button>

            <button
              onClick={() => switchTool("Zoom")}
              className={`
                px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                ${
                  activeTool === "Zoom"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }
              `}
            >
              🔍 缩放
            </button>

            <div className="ml-4 text-sm text-gray-300">
              当前: {getToolDisplayName(activeTool)} -{" "}
              {getToolInstructions(activeTool)}
            </div>
          </div>
        )}
      </div>

      {/* 状态显示 */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 border-b border-red-300">
          错误: {error}
        </div>
      )}

      {!isInitialized && (
        <div className="p-3 bg-cyan-100 text-cyan-800 border-b border-cyan-300">
          正在初始化 Cornerstone...
        </div>
      )}

      {/* DICOM 显示区域 */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={elementRef}
          className="w-full h-full bg-black"
          style={{ minHeight: "400px" }}
        >
          {!isLoading && isInitialized && (
            <div className="absolute top-4 left-4 text-gray-400 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
              图像将自动加载，或点击按钮重新加载
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailPage;
