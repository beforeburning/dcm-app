import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Chip, Card, CardBody, CardHeader } from "@heroui/react";
import { addToast } from "@heroui/toast";
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
import { getDcmDetailRequest, qiniuBaseUrl, type DcmList } from "@/api/dcm";

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const elementRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // 数据加载状态
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTool, setActiveTool] = useState("WindowLevel"); // 当前激活的工具
  const [dcmData, setDcmData] = useState<DcmList | null>(null); // DCM数据
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 当前图像索引
  const [imageIds, setImageIds] = useState<string[]>([]); // 图像 ID列表
  const [isImageControlExpanded, setIsImageControlExpanded] = useState(false); // 图像切换控件展开状态
  const renderingEngineRef = useRef(null);
  const toolGroupRef = useRef(null); // 保存工具组引用

  // 分类显示映射
  const getCategoryLabel = (category?: string): string => {
    const categoryMap: { [key: string]: string } = {
      xray: "X光",
      ct: "CT",
      mri: "MRI",
      ultrasound: "超声",
      pet: "PET",
      pathology: "病理图像",
    };
    return category ? categoryMap[category] || category : "未分类";
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
  };

  // 切换到上一张图像
  const goToPreviousImage = useCallback(() => {
    if (imageIds.length <= 1) return;
    const newIndex =
      currentImageIndex > 0 ? currentImageIndex - 1 : imageIds.length - 1;
    switchToImage(newIndex);
  }, [currentImageIndex, imageIds.length]);

  // 切换到下一张图像
  const goToNextImage = useCallback(() => {
    if (imageIds.length <= 1) return;
    const newIndex =
      currentImageIndex < imageIds.length - 1 ? currentImageIndex + 1 : 0;
    switchToImage(newIndex);
  }, [currentImageIndex, imageIds.length]);

  // 切换到指定图像
  const switchToImage = useCallback(
    async (index: number) => {
      if (!renderingEngineRef.current || !imageIds[index]) return;

      try {
        setIsLoading(true);
        const renderingEngine = renderingEngineRef.current;
        const viewport = renderingEngine.getViewport("CT_SAGITTAL_STACK");

        if (viewport) {
          // 设置单个图像
          await (viewport as any).setStack([imageIds[index]]);
          renderingEngine.render();
          setCurrentImageIndex(index);
          console.log(`已切换到第 ${index + 1} 张图像`);
        }
      } catch (error) {
        console.error("切换图像失败:", error);
        setError("切换图像失败: " + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [imageIds]
  );

  // 加载DCM数据详情
  useEffect(() => {
    const loadDcmData = async () => {
      if (!id) {
        addToast({
          color: "danger",
          description: "数据ID无效",
        });
        navigate("/list");
        return;
      }

      setDataLoading(true);
      try {
        const response = await getDcmDetailRequest(id);

        if (response.code === 200 && response.data) {
          setDcmData(response.data);

          // 初始化图像 ID 列表
          if (response.data.files && response.data.files.length > 0) {
            const ids = response.data.files.map((file) => {
              const fullPath = `${qiniuBaseUrl}${file.path}`;
              return `wadouri:${fullPath}`;
            });
            setImageIds(ids);
            setCurrentImageIndex(0); // 重置到第一张图
          }
        } else {
          addToast({
            color: "danger",
            description: response.message || "加载数据失败",
          });
          navigate("/list");
        }
      } catch (err) {
        console.error("加载数据错误:", err);
        addToast({
          color: "danger",
          description: "加载数据失败",
        });
        navigate("/list");
      } finally {
        setDataLoading(false);
      }
    };

    loadDcmData();
  }, [id, navigate]);

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
    if (!isInitialized || !elementRef.current || !dcmData) return;

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

      // 加载图像 - 使用状态中的imageIds
      let currentImageIds: string[] = [];

      if (imageIds.length > 0) {
        // 使用已加载的图像 ID，只显示当前图像
        currentImageIds = [imageIds[currentImageIndex]];
      } else if (dcmData.files && dcmData.files.length > 0) {
        // 如果状态中还没有imageIds，使用dcmData构建
        const allImageIds = dcmData.files.map((file) => {
          const fullPath = `${qiniuBaseUrl}${file.path}`;
          return `wadouri:${fullPath}`;
        });
        // 同时更新状态
        setImageIds(allImageIds);
        currentImageIds = [allImageIds[0]]; // 只显示第一张
      } else {
        // 如果没有文件，使用默认的测试文件
        const imageId = "wadouri:/3.dcm";
        currentImageIds = [imageId];
      }

      console.log("加载图像 ID:", currentImageIds);

      // 设置图像堆栈（只显示当前图像）
      await (viewport as any).setStack(currentImageIds);

      // 渲染
      renderingEngine.render();

      console.log("DICOM 文件加载成功");
    } catch (err) {
      console.error("加载 DICOM 文件失败:", err);
      setError("加载失败: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, dcmData, imageIds, currentImageIndex]);

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
    if (isInitialized && dcmData && !dataLoading) {
      // 等待DOM元素渲染完成
      setTimeout(() => {
        loadDicomFile();
      }, 100);
    }
  }, [isInitialized, dcmData, dataLoading, loadDicomFile]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (imageIds.length <= 1) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPreviousImage();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToNextImage();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageIds.length, goToPreviousImage, goToNextImage]);

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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/list")}
              className="bg-gray-600 hover:bg-gray-700 text-white"
              size="sm"
            >
              ← 返回列表
            </Button>
            <h1 className="text-xl font-bold">
              {dataLoading
                ? "DICOM 图像查看器"
                : dcmData?.name || "DICOM 图像查看器"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadDicomFile}
              disabled={!isInitialized || isLoading || !dcmData}
              className={`
                text-sm rounded transition-colors duration-200
                ${
                  isInitialized && dcmData
                    ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    : "bg-gray-500 cursor-not-allowed"
                }
                ${!isInitialized || isLoading || !dcmData ? "opacity-75" : ""}
              `}
            >
              {isLoading ? "加载中..." : "重新加载"}
            </Button>

            <Button
              onClick={resetView}
              disabled={!isInitialized || isLoading || !dcmData}
              className={`
                text-sm rounded transition-colors duration-200
                ${
                  isInitialized && dcmData
                    ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                    : "bg-gray-500 cursor-not-allowed"
                }
                ${!isInitialized || isLoading || !dcmData ? "opacity-75" : ""}
              `}
            >
              重置视图
            </Button>
          </div>
        </div>

        {/* 工具栏 */}
        {isInitialized && (
          <div className="mt-2 space-y-2">
            {/* 紧凑工具栏 */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 基本操作 */}
              <span className="text-xs font-medium text-blue-300 mr-1">
                基本:
              </span>
              <button
                onClick={() => switchTool("WindowLevel")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "WindowLevel"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                🌅 窗位
              </button>
              <button
                onClick={() => switchTool("Pan")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "Pan"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                ✋ 平移
              </button>
              <button
                onClick={() => switchTool("Zoom")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "Zoom"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                🔍 缩放
              </button>
              <button
                onClick={() => switchTool("Probe")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "Probe"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                🔎 探针
              </button>

              {/* 测量工具 */}
              <span className="text-xs font-medium text-green-300 mr-1 ml-3">
                测量:
              </span>
              <button
                onClick={() => switchTool("Length")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "Length"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                📏 长度
              </button>
              <button
                onClick={() => switchTool("Angle")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "Angle"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                📐 角度
              </button>
              <button
                onClick={() => switchTool("Bidirectional")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "Bidirectional"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                ↔️ 双向
              </button>

              {/* 标注工具 */}
              <span className="text-xs font-medium text-purple-300 mr-1 ml-3">
                标注:
              </span>
              <button
                onClick={() => switchTool("RectangleROI")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "RectangleROI"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                ▭ 矩形
              </button>
              <button
                onClick={() => switchTool("EllipticalROI")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "EllipticalROI"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                ⚬ 椭圆
              </button>
              <button
                onClick={() => switchTool("CircleROI")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "CircleROI"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                ◯ 圆形
              </button>
              <button
                onClick={() => switchTool("PlanarFreehandROI")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "PlanarFreehandROI"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                🎨 绘制
              </button>
              <button
                onClick={() => switchTool("ArrowAnnotate")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  activeTool === "ArrowAnnotate"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                }`}
              >
                ➡️ 箭头
              </button>
            </div>

            {/* 当前工具信息 - 更紧凑 */}
            <div className="text-xs text-gray-300 bg-gray-700 bg-opacity-50 px-2 py-1 rounded">
              <span className="text-yellow-300">当前:</span>{" "}
              <span className="font-medium">
                {getToolDisplayName(activeTool)}
              </span>
              <span className="mx-1 text-gray-500">|</span>
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

      {dataLoading && (
        <div className="p-3 bg-blue-100 text-blue-800 border-b border-blue-300">
          正在加载数据...
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
          {!isLoading && isInitialized && dcmData && (
            <>
              <div className="absolute top-4 left-4 text-gray-400 text-sm bg-black bg-opacity-50 px-2 py-1 rounded z-10">
                图像将自动加载，或点击按钮重新加载
              </div>
              {imageIds.length > 1 && (
                <div className="absolute top-4 right-4 text-gray-400 text-sm bg-black bg-opacity-50 px-2 py-1 rounded z-10">
                  使用 ← → 键切换图像
                </div>
              )}
            </>
          )}
          {!dcmData && !dataLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📁</div>
                <div>数据加载失败</div>
              </div>
            </div>
          )}
          {dataLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">🔄</div>
                <div>正在加载数据...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 悬浮图像切换控件 */}
      {dcmData && imageIds.length > 1 && (
        <div className="fixed bottom-4 left-4 z-50">
          {/* 展开/收起按钮 */}
          <div className="mb-2">
            <Button
              size="sm"
              onClick={() => setIsImageControlExpanded(!isImageControlExpanded)}
              className="bg-gray-800 bg-opacity-90 backdrop-blur-sm hover:bg-gray-700 text-white border border-gray-600 shadow-lg"
            >
              {isImageControlExpanded ? "🔽" : "🖼️"} {currentImageIndex + 1}/
              {imageIds.length}
            </Button>
          </div>

          {/* 展开的控制面板 */}
          {isImageControlExpanded && (
            <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl p-4 min-w-72">
              {/* 控制按钮区域 */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-orange-300">
                  图像切换:
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={goToPreviousImage}
                    disabled={imageIds.length <= 1 || isLoading}
                    className="bg-gray-600 hover:bg-gray-500 text-white min-w-unit-8 h-8"
                  >
                    ◀
                  </Button>

                  <span className="text-sm text-gray-300 px-3 min-w-16 text-center">
                    {currentImageIndex + 1} / {imageIds.length}
                  </span>

                  <Button
                    size="sm"
                    onClick={goToNextImage}
                    disabled={imageIds.length <= 1 || isLoading}
                    className="bg-gray-600 hover:bg-gray-500 text-white min-w-unit-8 h-8"
                  >
                    ▶
                  </Button>
                </div>
              </div>

              {/* 当前文件信息 */}
              <div className="mb-3">
                <span className="text-xs text-gray-400">
                  当前文件: {dcmData.files[currentImageIndex]?.name || "未知"}
                </span>
              </div>

              {/* 缩略图列表（当图像较多时显示） */}
              {imageIds.length > 2 && (
                <div>
                  <div className="text-xs text-gray-400 mb-2">快速跳转:</div>
                  <div className="flex gap-1 overflow-x-auto pb-2 max-w-64">
                    {imageIds.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => switchToImage(index)}
                        disabled={isLoading}
                        className={`
                          flex-shrink-0 w-8 h-6 text-xs rounded transition-all
                          ${
                            index === currentImageIndex
                              ? "bg-orange-600 text-white"
                              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                          }
                          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 键盘快捷键提示 */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-500">
                  💡 快捷键: ← → 切换图像
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DetailPage;
