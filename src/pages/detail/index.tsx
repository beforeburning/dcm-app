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
  OverlayGridTool,
  ScaleOverlayTool,
  AdvancedMagnifyTool,
  UltrasoundDirectionalTool,
  RectangleScissorsTool,
  CircleScissorsTool,
  SphereScissorsTool,
  LabelTool,
  ToolGroupManager,
  Enums as ToolsEnums,
  annotation as csToolsAnnotation,
} from "@cornerstonejs/tools";
import dicomImageLoader, {
  init as dicomImageLoaderInit,
} from "@cornerstonejs/dicom-image-loader";
import * as dicomParser from "dicom-parser";
import { getDcmDetailRequest, qiniuBaseUrl, type DcmList } from "@/api/dcm";
import TopBar from "./components/TopBar";
import ToolBar from "./components/ToolBar";
import StatusBanners from "./components/StatusBanners";
import ViewerCanvas from "./components/ViewerCanvas";
import ImageSwitcher from "./components/ImageSwitcher";

const { ViewportType } = Enums;
const { MouseBindings } = ToolsEnums;

// 工具显示与说明已拆分到组件内部

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
  const loadSeqRef = useRef(0); // 加载序列，用于防止并发操作导致的已销毁实例访问

  // 打印当前注释/测量数据为简化 JSON
  const printAnnotations = useCallback(() => {
    try {
      const all =
        (csToolsAnnotation as any)?.state?.getAllAnnotations?.() || [];
      const simplified = all.map((a: any) => ({
        annotationUID: a?.annotationUID,
        toolName: a?.metadata?.toolName || a?.toolName,
        referencedImageId: a?.metadata?.referencedImageId,
        frameOfReferenceUID: a?.metadata?.frameOfReferenceUID,
        cachedStats: a?.cachedStats,
        data: a?.data,
      }));
      console.log("[DetailPage] 注释JSON:", simplified);
    } catch (e: any) {
      console.warn("无法获取注释数据", e);
    }
  }, []);

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

  // 切换到上一张/下一张图像在 switchToImage 下方定义，避免依赖顺序问题

  // 切换到指定图像
  const switchToImage = useCallback(
    async (index: number) => {
      if (isLoading || !renderingEngineRef.current || !imageIds[index]) return;

      try {
        setIsLoading(true);
        const renderingEngine = renderingEngineRef.current;
        const viewport = renderingEngine.getViewport("CT_SAGITTAL_STACK");

        if (viewport && typeof (viewport as any).setStack === "function") {
          // 设置单个图像
          await (viewport as any).setStack([imageIds[index]]);
          if (typeof (viewport as any).resetCamera === "function") {
            (viewport as any).resetCamera();
          }
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
    [imageIds, isLoading]
  );

  // 切换到上一张图像
  const goToPreviousImage = useCallback(() => {
    if (isLoading || imageIds.length <= 1) return;
    const newIndex =
      currentImageIndex > 0 ? currentImageIndex - 1 : imageIds.length - 1;
    switchToImage(newIndex);
  }, [currentImageIndex, imageIds.length, isLoading, switchToImage]);

  // 切换到下一张图像
  const goToNextImage = useCallback(() => {
    if (isLoading || imageIds.length <= 1) return;
    const newIndex =
      currentImageIndex < imageIds.length - 1 ? currentImageIndex + 1 : 0;
    switchToImage(newIndex);
  }, [currentImageIndex, imageIds.length, isLoading, switchToImage]);

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
        // 配置 Web Workers（禁用以避免在深路径刷新时的 worker 404 问题）
        try {
          (dicomImageLoader as any).configure({ useWebWorkers: false });
        } catch (e) {
          console.warn("配置 dicomImageLoader 失败（可忽略）", e);
        }

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
        addTool(OverlayGridTool);
        addTool(ScaleOverlayTool);
        addTool(AdvancedMagnifyTool);
        addTool(UltrasoundDirectionalTool);
        addTool(RectangleScissorsTool);
        addTool(CircleScissorsTool);
        addTool(SphereScissorsTool);
        addTool(LabelTool);

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
    const seq = ++loadSeqRef.current;

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
          if (seq !== loadSeqRef.current) return;
          renderingEngine.resize(true);
          const vp = renderingEngine.getViewport(viewportId);
          if (vp && typeof (vp as any).resetCamera === "function") {
            (vp as any).resetCamera();
          }
          renderingEngine.render();
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
      toolGroup.addTool(OverlayGridTool.toolName);
      toolGroup.addTool(ScaleOverlayTool.toolName);
      toolGroup.addTool(AdvancedMagnifyTool.toolName);
      toolGroup.addTool(UltrasoundDirectionalTool.toolName);
      toolGroup.addTool(RectangleScissorsTool.toolName);
      toolGroup.addTool(CircleScissorsTool.toolName);
      toolGroup.addTool(SphereScissorsTool.toolName);
      toolGroup.addTool(LabelTool.toolName);

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
      if (seq !== loadSeqRef.current) return;
      await (viewport as any).setStack(currentImageIds);
      if (typeof (viewport as any).resetCamera === "function") {
        (viewport as any).resetCamera();
      }

      // 渲染
      if (seq !== loadSeqRef.current) return;
      renderingEngine.render();

      console.log("DICOM 文件加载成功");
    } catch (err) {
      console.error("加载 DICOM 文件失败:", err);
      setError("加载失败: " + err.message);
    } finally {
      if (seq === loadSeqRef.current) setIsLoading(false);
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
      toolGroup.setToolPassive(OverlayGridTool.toolName);
      toolGroup.setToolPassive(ScaleOverlayTool.toolName);
      toolGroup.setToolPassive(AdvancedMagnifyTool.toolName);
      toolGroup.setToolPassive(UltrasoundDirectionalTool.toolName);
      toolGroup.setToolPassive(RectangleScissorsTool.toolName);
      toolGroup.setToolPassive(CircleScissorsTool.toolName);
      toolGroup.setToolPassive(SphereScissorsTool.toolName);
      toolGroup.setToolPassive(LabelTool.toolName);

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
        case "OverlayGrid":
          toolGroup.setToolActive(OverlayGridTool.toolName, {
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
        case "Label":
          toolGroup.setToolActive(LabelTool.toolName, {
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

  // 初始化完成后自动加载（取消上一次未完成的加载）
  useEffect(() => {
    if (isInitialized && dcmData && !dataLoading) {
      // 等待DOM元素渲染完成
      setTimeout(() => {
        loadSeqRef.current++;
        loadDicomFile();
      }, 100);
    }
  }, [isInitialized, dcmData, dataLoading, loadDicomFile]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoading || imageIds.length <= 1) return;

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
      <TopBar
        title={
          dataLoading ? "DICOM 图像查看器" : dcmData?.name || "DICOM 图像查看器"
        }
        isInitialized={!!isInitialized}
        isLoading={!!isLoading}
        hasData={!!dcmData}
        onBack={() => navigate("/list")}
        onReload={loadDicomFile}
        onReset={resetView}
        onConsoleEditData={printAnnotations}
      />
      <ToolBar
        isInitialized={!!isInitialized}
        activeTool={activeTool}
        onSwitch={switchTool}
      />

      <StatusBanners
        error={error}
        dataLoading={dataLoading}
        isInitialized={isInitialized}
      />

      <ViewerCanvas
        elementRef={elementRef}
        isLoading={isLoading}
        isInitialized={isInitialized}
        hasData={!!dcmData}
        showSwitchHint={imageIds.length > 1}
      />

      <ImageSwitcher
        visible={!!dcmData && imageIds.length > 1}
        isLoading={isLoading}
        imageCount={imageIds.length}
        currentIndex={currentImageIndex}
        expanded={isImageControlExpanded}
        onToggleExpanded={() =>
          setIsImageControlExpanded(!isImageControlExpanded)
        }
        onPrev={goToPreviousImage}
        onNext={goToNextImage}
        onJump={(index) => switchToImage(index)}
        currentFileName={dcmData?.files[currentImageIndex]?.name}
      />
    </div>
  );
}

export default DetailPage;
