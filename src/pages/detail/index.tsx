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
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  CircleROITool,
  PlanarFreehandROITool,
  ArrowAnnotateTool,
  ProbeTool,
  AngleTool,
  BidirectionalTool,
  CobbAngleTool,
  RectangleROIStartEndThresholdTool,
  RectangleROIThresholdTool,
  SplineROITool,
  LivewireContourTool,
  MagnifyTool,
  ReferenceLinesTool,
  OverlayGridTool,
  CrosshairsTool,
  ScaleOverlayTool,
  AdvancedMagnifyTool,
  UltrasoundDirectionalTool,
  RectangleScissorsTool,
  CircleScissorsTool,
  SphereScissorsTool,
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
    case "Length":
      return "测量长度";
    case "RectangleROI":
      return "矩形标注";
    case "EllipticalROI":
      return "椭圆标注";
    case "CircleROI":
      return "圆形标注";
    case "FreehandROI":
      return "自由画线";
    case "ArrowAnnotate":
      return "箭头标注";
    case "Probe":
      return "探针";
    case "Angle":
      return "角度测量";
    case "Bidirectional":
      return "双向测量";
    case "PlanarFreehandROI":
      return "平面自由绘制";
    case "CobbAngle":
      return "Cobb角度测量";
    case "RectangleROIStartEndThreshold":
      return "矩形阈值标注";
    case "RectangleROIThreshold":
      return "矩形阈值工具";
    case "SplineROI":
      return "样条线标注";
    case "LivewireContour":
      return "活线轮廓";
    case "Magnify":
      return "放大镜";
    case "ReferenceLines":
      return "参考线";
    case "OverlayGrid":
      return "网格覆盖";
    case "Crosshairs":
      return "十字线";
    case "ScaleOverlay":
      return "比例尺";
    case "AdvancedMagnify":
      return "高级放大镜";
    case "UltrasoundDirectional":
      return "超声方向工具";
    case "RectangleScissors":
      return "矩形剪切";
    case "CircleScissors":
      return "圆形剪切";
    case "SphereScissors":
      return "球形剪切";
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
    case "Length":
      return "点击两点测量距离";
    case "RectangleROI":
      return "拖动画出矩形区域";
    case "EllipticalROI":
      return "拖动画出椭圆区域";
    case "CircleROI":
      return "拖动画出圆形区域";
    case "FreehandROI":
      return "拖动鼠标自由画线";
    case "ArrowAnnotate":
      return "点击两点放置箭头标注";
    case "Probe":
      return "点击查看像素值";
    case "Angle":
      return "点击三点测量角度";
    case "Bidirectional":
      return "拖动测量两个方向的距离";
    case "PlanarFreehandROI":
      return "拖动鼠标平面自由绘制";
    case "CobbAngle":
      return "测量Cobb角，常用于脊柱弯曲分析";
    case "RectangleROIStartEndThreshold":
      return "画矩形区域并设置阈值范围";
    case "RectangleROIThreshold":
      return "矩形阈值分割工具";
    case "SplineROI":
      return "绘制样条曲线区域";
    case "LivewireContour":
      return "智能边缘检测轮廓绘制";
    case "Magnify":
      return "点击显示局部放大镜";
    case "ReferenceLines":
      return "显示切面参考线";
    case "OverlayGrid":
      return "显示网格覆盖层";
    case "Crosshairs":
      return "显示十字线定位";
    case "ScaleOverlay":
      return "显示比例尺标记";
    case "AdvancedMagnify":
      return "高级放大镜功能";
    case "UltrasoundDirectional":
      return "超声图像方向标注";
    case "RectangleScissors":
      return "矩形区域剪切工具";
    case "CircleScissors":
      return "圆形区域剪切工具";
    case "SphereScissors":
      return "球形区域剪切工具";
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
        addTool(LengthTool);
        addTool(RectangleROITool);
        addTool(EllipticalROITool);
        addTool(CircleROITool);
        addTool(ArrowAnnotateTool);
        addTool(ProbeTool);
        addTool(AngleTool);
        addTool(BidirectionalTool);
        addTool(PlanarFreehandROITool);
        addTool(CobbAngleTool);
        addTool(RectangleROIStartEndThresholdTool);
        addTool(RectangleROIThresholdTool);
        addTool(SplineROITool);
        addTool(LivewireContourTool);
        addTool(MagnifyTool);
        addTool(ReferenceLinesTool);
        addTool(OverlayGridTool);
        addTool(CrosshairsTool);
        addTool(ScaleOverlayTool);
        addTool(AdvancedMagnifyTool);
        addTool(UltrasoundDirectionalTool);
        addTool(RectangleScissorsTool);
        addTool(CircleScissorsTool);
        addTool(SphereScissorsTool);

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
      toolGroup.addTool(LengthTool.toolName);
      toolGroup.addTool(RectangleROITool.toolName);
      toolGroup.addTool(EllipticalROITool.toolName);
      toolGroup.addTool(CircleROITool.toolName);
      toolGroup.addTool(ArrowAnnotateTool.toolName);
      toolGroup.addTool(ProbeTool.toolName);
      toolGroup.addTool(AngleTool.toolName);
      toolGroup.addTool(BidirectionalTool.toolName);
      toolGroup.addTool(PlanarFreehandROITool.toolName);
      toolGroup.addTool(CobbAngleTool.toolName);
      toolGroup.addTool(RectangleROIStartEndThresholdTool.toolName);
      toolGroup.addTool(RectangleROIThresholdTool.toolName);
      toolGroup.addTool(SplineROITool.toolName);
      toolGroup.addTool(LivewireContourTool.toolName);
      toolGroup.addTool(MagnifyTool.toolName);
      toolGroup.addTool(ReferenceLinesTool.toolName);
      toolGroup.addTool(OverlayGridTool.toolName);
      toolGroup.addTool(CrosshairsTool.toolName);
      toolGroup.addTool(ScaleOverlayTool.toolName);
      toolGroup.addTool(AdvancedMagnifyTool.toolName);
      toolGroup.addTool(UltrasoundDirectionalTool.toolName);
      toolGroup.addTool(RectangleScissorsTool.toolName);
      toolGroup.addTool(CircleScissorsTool.toolName);
      toolGroup.addTool(SphereScissorsTool.toolName);

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
      toolGroup.setToolPassive(LengthTool.toolName);
      toolGroup.setToolPassive(RectangleROITool.toolName);
      toolGroup.setToolPassive(EllipticalROITool.toolName);
      toolGroup.setToolPassive(CircleROITool.toolName);
      toolGroup.setToolPassive(ArrowAnnotateTool.toolName);
      toolGroup.setToolPassive(ProbeTool.toolName);
      toolGroup.setToolPassive(AngleTool.toolName);
      toolGroup.setToolPassive(BidirectionalTool.toolName);
      toolGroup.setToolPassive(PlanarFreehandROITool.toolName);
      toolGroup.setToolPassive(CobbAngleTool.toolName);
      toolGroup.setToolPassive(RectangleROIStartEndThresholdTool.toolName);
      toolGroup.setToolPassive(RectangleROIThresholdTool.toolName);
      toolGroup.setToolPassive(SplineROITool.toolName);
      toolGroup.setToolPassive(LivewireContourTool.toolName);
      toolGroup.setToolPassive(MagnifyTool.toolName);
      toolGroup.setToolPassive(ReferenceLinesTool.toolName);
      toolGroup.setToolPassive(OverlayGridTool.toolName);
      toolGroup.setToolPassive(CrosshairsTool.toolName);
      toolGroup.setToolPassive(ScaleOverlayTool.toolName);
      toolGroup.setToolPassive(AdvancedMagnifyTool.toolName);
      toolGroup.setToolPassive(UltrasoundDirectionalTool.toolName);
      toolGroup.setToolPassive(RectangleScissorsTool.toolName);
      toolGroup.setToolPassive(CircleScissorsTool.toolName);
      toolGroup.setToolPassive(SphereScissorsTool.toolName);

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
        case "Length":
          toolGroup.setToolActive(LengthTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "RectangleROI":
          toolGroup.setToolActive(RectangleROITool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "EllipticalROI":
          toolGroup.setToolActive(EllipticalROITool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "CircleROI":
          toolGroup.setToolActive(CircleROITool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "ArrowAnnotate":
          toolGroup.setToolActive(ArrowAnnotateTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "Probe":
          toolGroup.setToolActive(ProbeTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "Angle":
          toolGroup.setToolActive(AngleTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "Bidirectional":
          toolGroup.setToolActive(BidirectionalTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "PlanarFreehandROI":
          toolGroup.setToolActive(PlanarFreehandROITool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "CobbAngle":
          toolGroup.setToolActive(CobbAngleTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "RectangleROIStartEndThreshold":
          toolGroup.setToolActive(RectangleROIStartEndThresholdTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "RectangleROIThreshold":
          toolGroup.setToolActive(RectangleROIThresholdTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "SplineROI":
          toolGroup.setToolActive(SplineROITool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "LivewireContour":
          toolGroup.setToolActive(LivewireContourTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "Magnify":
          toolGroup.setToolActive(MagnifyTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "ReferenceLines":
          toolGroup.setToolActive(ReferenceLinesTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "OverlayGrid":
          toolGroup.setToolActive(OverlayGridTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "Crosshairs":
          toolGroup.setToolActive(CrosshairsTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "ScaleOverlay":
          toolGroup.setToolActive(ScaleOverlayTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "AdvancedMagnify":
          toolGroup.setToolActive(AdvancedMagnifyTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "UltrasoundDirectional":
          toolGroup.setToolActive(UltrasoundDirectionalTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "RectangleScissors":
          toolGroup.setToolActive(RectangleScissorsTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "CircleScissors":
          toolGroup.setToolActive(CircleScissorsTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
          break;
        case "SphereScissors":
          toolGroup.setToolActive(SphereScissorsTool.toolName, {
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
          <div className="mt-4 space-y-3">
            {/* 基本操作工具 */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-300">
                基本操作:
              </span>

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

              <button
                onClick={() => switchTool("Probe")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "Probe"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                🔎 探针
              </button>
            </div>

            {/* 测量工具 */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-green-300">
                测量工具:
              </span>

              <button
                onClick={() => switchTool("Length")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "Length"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                📏 长度测量
              </button>

              <button
                onClick={() => switchTool("Angle")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "Angle"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                📐 角度测量
              </button>

              <button
                onClick={() => switchTool("Bidirectional")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "Bidirectional"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                ↔️ 双向测量
              </button>
            </div>

            {/* 标注工具 */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-purple-300">
                标注工具:
              </span>

              <button
                onClick={() => switchTool("RectangleROI")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "RectangleROI"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                ▭ 矩形标注
              </button>

              <button
                onClick={() => switchTool("EllipticalROI")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "EllipticalROI"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                ⚬ 椭圆标注
              </button>

              <button
                onClick={() => switchTool("CircleROI")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "CircleROI"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                ◯ 圆形标注
              </button>

              <button
                onClick={() => switchTool("PlanarFreehandROI")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "PlanarFreehandROI"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                🎨 平面绘制
              </button>

              <button
                onClick={() => switchTool("ArrowAnnotate")}
                className={`
                  px-3 py-1.5 text-sm rounded transition-all duration-200 flex items-center gap-2
                  ${
                    activeTool === "ArrowAnnotate"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }
                `}
              >
                ➡️ 箭头标注
              </button>
            </div>

            {/* 当前工具信息 */}
            <div className="text-sm text-gray-300 bg-gray-700 bg-opacity-50 px-3 py-2 rounded">
              <span className="text-yellow-300">当前工具:</span>{" "}
              <span className="font-medium">
                {getToolDisplayName(activeTool)}
              </span>
              <span className="mx-2 text-gray-500">|</span>
              <span className="text-blue-300">
                {getToolInstructions(activeTool)}
              </span>
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
