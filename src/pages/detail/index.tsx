import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  getOriginalDataDetailRequest,
  type DcmData,
  saveDcmAnnotationsRequest,
} from "@/api/dcm";
import { getDicomMetadata } from "@/utils/dicomMetadata";
import TopBar from "./components/TopBar";
import ToolBar from "./components/ToolBar";
import StatusBanners from "./components/StatusBanners";
import ViewerCanvas from "./components/ViewerCanvas";
import ImageSwitcher from "./components/ImageSwitcher";
import { ParameterMonitoringPanel } from "@/components/common";

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
  const [dcmData, setDcmData] = useState<DcmData | null>(null); // DCM数据
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 当前图像索引
  const [imageIds, setImageIds] = useState<string[]>([]); // 图像 ID列表
  const [isImageControlExpanded, setIsImageControlExpanded] = useState(true); // 图像切换控件展开状态
  const [dicomMetadata, setDicomMetadata] = useState<any>(null); // DICOM 元数据
  const [frameRate, setFrameRate] = useState<number>(0); // FPS
  const [zoom, setZoom] = useState<number>(1); // 缩放
  const [windowWidth, setWindowWidth] = useState<number>(0); // 窗宽
  const [windowCenter, setWindowCenter] = useState<number>(0); // 窗位
  const [renderTime, setRenderTime] = useState<number>(0); // 渲染时间
  const renderingEngineRef = useRef(null);
  const toolGroupRef = useRef(null); // 保存工具组引用
  const loadSeqRef = useRef(0); // 加载序列，用于防止并发操作导致的已销毁实例访问
  const viewportListenerCleanupRef = useRef<(() => void) | null>(null);
  const lastRenderTsRef = useRef<number>(0);
  const initialParallelScaleRef = useRef<number | null>(null);

  // 打印并保存当前注释/测量 JSON
  const printAnnotations = useCallback(async () => {
    try {
      const all =
        (csToolsAnnotation as any)?.state?.getAllAnnotations?.() || [];
      console.log("🚀 ~ printAnnotations ~ all:", JSON.stringify(all));

      if (!id) {
        addToast({ color: "danger", description: "无效的数据ID，无法保存" });
        return;
      }

      const res = await saveDcmAnnotationsRequest(Number(id), all);
      if (res.success) {
        addToast({ color: "success", description: "注释已保存" });
      } else {
        addToast({ color: "warning", description: res.message || "保存失败" });
      }
    } catch (e: any) {
      console.warn("无法获取或保存注释数据", e);
      addToast({ color: "danger", description: "保存失败" });
    }
  }, [id]);

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

          // 默认缩放 0.9
          try {
            const cam = (viewport as any)?.getCamera?.();
            const basePS = cam?.parallelScale;
            if (typeof basePS === "number" && basePS > 0) {
              initialParallelScaleRef.current = basePS;
              const targetPS = basePS / 0.9;
              (viewport as any)?.setCamera?.({
                ...cam,
                parallelScale: targetPS,
              });
            }
          } catch {}

          renderingEngine.render();
          setCurrentImageIndex(index);

          // 获取 DICOM 元数据
          try {
            const metadata = await getDicomMetadata(
              imageIds[index],
              renderingEngine
            );

            setDicomMetadata(metadata);
          } catch (error) {
            console.warn("获取 DICOM 元数据失败:", error);
            setDicomMetadata(null);
          }

          // 更新监控参数
          setTimeout(() => {
            updateMonitoringParameters();
          }, 50);

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
        const response = await getOriginalDataDetailRequest(Number(id));
        console.log("🚀 ~ loadDcmData ~ response:", response);

        if (response.success && response.data) {
          setDcmData(response.data);

          // 初始化图像 ID 列表
          if (response.data.files && response.data.files.length > 0) {
            const ids = response.data.files.map((file) => {
              // 使用新的文件结构，直接使用 fresh_url
              return `wadouri:${file.fresh_url}`;
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

  // 重新应用当前激活工具（不改变UI状态，仅应用到工具组）
  const reapplyActiveTool = useCallback(() => {
    if (!toolGroupRef.current) return;
    const toolName = activeTool;
    if (!toolName || toolName === "DeleteAnnotation") return;

    try {
      const toolGroup: any = toolGroupRef.current;

      const maybePassive = (tool: any) => {
        try {
          toolGroup.setToolPassive(tool.toolName);
        } catch {}
      };
      [
        WindowLevelTool,
        PanTool,
        ZoomTool,
        LengthTool,
        RectangleROITool,
        EllipticalROITool,
        CircleROITool,
        ArrowAnnotateTool,
        ProbeTool,
        AngleTool,
        BidirectionalTool,
        PlanarFreehandROITool,
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
      ].forEach(maybePassive);

      const primary = [{ mouseButton: MouseBindings.Primary }];
      const setActive = (tool: any, bindings: any) => {
        try {
          toolGroup.setToolActive(tool.toolName, { bindings });
        } catch {}
      };

      switch (toolName) {
        case "WindowLevel":
          setActive(WindowLevelTool, primary);
          break;
        case "Pan":
          setActive(PanTool, primary);
          break;
        case "Zoom":
          setActive(ZoomTool, primary);
          break;
        case "Length":
          setActive(LengthTool, primary);
          break;
        case "RectangleROI":
          setActive(RectangleROITool, primary);
          break;
        case "EllipticalROI":
          setActive(EllipticalROITool, primary);
          break;
        case "CircleROI":
          setActive(CircleROITool, primary);
          break;
        case "ArrowAnnotate":
          setActive(ArrowAnnotateTool, primary);
          break;
        case "Probe":
          setActive(ProbeTool, primary);
          break;
        case "Angle":
          setActive(AngleTool, primary);
          break;
        case "Bidirectional":
          setActive(BidirectionalTool, primary);
          break;
        case "PlanarFreehandROI":
          setActive(PlanarFreehandROITool, primary);
          break;
        case "CobbAngle":
          setActive(CobbAngleTool, primary);
          break;
        case "RectangleROIStartEndThreshold":
          setActive(RectangleROIStartEndThresholdTool, primary);
          break;
        case "RectangleROIThreshold":
          setActive(RectangleROIThresholdTool, primary);
          break;
        case "SplineROI":
          setActive(SplineROITool, primary);
          break;
        case "LivewireContour":
          setActive(LivewireContourTool, primary);
          break;
        case "Magnify":
          setActive(MagnifyTool, primary);
          break;
        case "OverlayGrid":
          setActive(OverlayGridTool, primary);
          break;
        case "ScaleOverlay":
          setActive(ScaleOverlayTool, primary);
          break;
        case "AdvancedMagnify":
          setActive(AdvancedMagnifyTool, primary);
          break;
        case "UltrasoundDirectional":
          setActive(UltrasoundDirectionalTool, primary);
          break;
        case "RectangleScissors":
          setActive(RectangleScissorsTool, primary);
          break;
        case "CircleScissors":
          setActive(CircleScissorsTool, primary);
          break;
        case "SphereScissors":
          setActive(SphereScissorsTool, primary);
          break;
        case "Label":
          setActive(LabelTool, primary);
          break;
      }

      // 渲染以确保立即生效
      try {
        (renderingEngineRef.current as any)?.render?.();
      } catch {}
    } catch (e) {
      console.warn("重新应用工具失败", e);
    }
  }, [activeTool]);

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
          return `wadouri:${file.fresh_url}`;
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

      // 默认缩放 0.9
      try {
        const cam = (viewport as any)?.getCamera?.();
        const basePS = cam?.parallelScale;
        if (typeof basePS === "number" && basePS > 0) {
          initialParallelScaleRef.current = basePS;
          const targetPS = basePS / 0.9;
          (viewport as any)?.setCamera?.({ ...cam, parallelScale: targetPS });
        }
      } catch {}

      // 渲染
      if (seq !== loadSeqRef.current) return;
      renderingEngine.render();

      // 重新应用当前激活工具，避免被重置为窗位
      reapplyActiveTool();

      // 记录初始 parallelScale 作为缩放基准
      try {
        const cam0: any = (viewport as any)?.getCamera?.();
        const ps0 = cam0?.parallelScale;
        if (typeof ps0 === "number" && ps0 > 0) {
          initialParallelScaleRef.current = ps0;
          setZoom(1);
        }
      } catch {}

      // 绑定视口监听，实时更新 Zoom/FPS/WW/WL
      try {
        // 清理旧监听
        viewportListenerCleanupRef.current?.();
        const re: any = renderingEngine;
        const vp: any = viewport;

        const computeZoom = () => {
          // 优先使用 getScale，如果可用
          const s = vp?.getScale?.();
          if (typeof s === "number" && s > 0) return s;
          // 否则用 parallelScale 的相对比值
          const cam = vp?.getCamera?.();
          const ps = cam?.parallelScale;
          const base = initialParallelScaleRef.current;
          if (
            typeof ps === "number" &&
            ps > 0 &&
            typeof base === "number" &&
            base > 0
          ) {
            return base / ps;
          }
          return 1;
        };

        const handleRendered = () => {
          // FPS 估算
          const now = performance.now();
          if (lastRenderTsRef.current) {
            const delta = now - lastRenderTsRef.current;
            if (delta > 0) setFrameRate(1000 / delta);
          }
          lastRenderTsRef.current = now;

          // Zoom
          const z = computeZoom();
          if (!Number.isNaN(z) && Number.isFinite(z)) setZoom(z);

          // WW/WL from viewport options
          const opts = vp?.getViewportOptions?.();
          const ww = opts?.voi?.windowWidth;
          const wc = opts?.voi?.windowCenter;
          if (typeof ww === "number") setWindowWidth(ww);
          if (typeof wc === "number") setWindowCenter(wc);
        };

        const handleCameraChange = () => {
          const z = computeZoom();
          if (!Number.isNaN(z) && Number.isFinite(z)) setZoom(z);
        };

        // Cornerstone v3 视口提供事件 API（不同版本可能差异，做防御）
        vp?.addEventListener?.("rendered", handleRendered);
        vp?.addEventListener?.("cameraModified", handleCameraChange);

        // 立即触发一次，确保初始值正确
        handleRendered();

        viewportListenerCleanupRef.current = () => {
          try {
            vp?.removeEventListener?.("rendered", handleRendered);
            vp?.removeEventListener?.("cameraModified", handleCameraChange);
          } catch {}
        };
      } catch (e) {
        console.warn("绑定视口监听失败（可忽略）", e);
      }

      // 获取第一张图像的 DICOM 元数据
      try {
        if (currentImageIds.length > 0) {
          const metadata = await getDicomMetadata(
            currentImageIds[0],
            renderingEngine
          );
          setDicomMetadata(metadata);
          console.log("初始 DICOM 元数据获取成功:", metadata);
        }
      } catch (error) {
        console.warn("获取初始 DICOM 元数据失败:", error);
        setDicomMetadata(null);
      }

      console.log("DICOM 文件加载成功");
    } catch (err) {
      console.error("加载 DICOM 文件失败:", err);
      setError("加载失败: " + err.message);
    } finally {
      if (seq === loadSeqRef.current) setIsLoading(false);
    }
  }, [isInitialized, dcmData, imageIds, currentImageIndex, reapplyActiveTool]);

  // 切换工具
  const switchTool = useCallback((toolName) => {
    if (!toolGroupRef.current) return;

    try {
      const toolGroup: any = toolGroupRef.current;

      // 删除为一次性动作，不改变当前工具
      if (toolName === "DeleteAnnotation") {
        handleDeleteAnnotation();
        return;
      }

      // 将所有工具设为被动
      const maybePassive = (tool: any) => {
        try {
          toolGroup.setToolPassive(tool.toolName);
        } catch {}
      };
      [
        WindowLevelTool,
        PanTool,
        ZoomTool,
        LengthTool,
        RectangleROITool,
        EllipticalROITool,
        CircleROITool,
        ArrowAnnotateTool,
        ProbeTool,
        AngleTool,
        BidirectionalTool,
        PlanarFreehandROITool,
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
      ].forEach(maybePassive);

      // 依据工具设置正确的鼠标绑定
      const primary = [{ mouseButton: MouseBindings.Primary }];
      const secondary = [{ mouseButton: MouseBindings.Secondary }];
      const auxiliary = [{ mouseButton: MouseBindings.Auxiliary }];

      const setActive = (tool: any, bindings: any) => {
        try {
          toolGroup.setToolActive(tool.toolName, { bindings });
        } catch {}
      };

      switch (toolName) {
        case "WindowLevel":
          setActive(WindowLevelTool, primary);
          break;
        case "Pan":
          // 显式选择平移时，使用左键拖拽更直观
          setActive(PanTool, primary);
          break;
        case "Zoom":
          // 显式选择缩放时，使用左键拖拽更直观
          setActive(ZoomTool, primary);
          break;
        case "Length":
          setActive(LengthTool, primary);
          break;
        case "RectangleROI":
          setActive(RectangleROITool, primary);
          break;
        case "EllipticalROI":
          setActive(EllipticalROITool, primary);
          break;
        case "CircleROI":
          setActive(CircleROITool, primary);
          break;
        case "ArrowAnnotate":
          setActive(ArrowAnnotateTool, primary);
          break;
        case "Probe":
          setActive(ProbeTool, primary);
          break;
        case "Angle":
          setActive(AngleTool, primary);
          break;
        case "Bidirectional":
          setActive(BidirectionalTool, primary);
          break;
        case "PlanarFreehandROI":
          setActive(PlanarFreehandROITool, primary);
          break;
        case "CobbAngle":
          setActive(CobbAngleTool, primary);
          break;
        case "RectangleROIStartEndThreshold":
          setActive(RectangleROIStartEndThresholdTool, primary);
          break;
        case "RectangleROIThreshold":
          setActive(RectangleROIThresholdTool, primary);
          break;
        case "SplineROI":
          setActive(SplineROITool, primary);
          break;
        case "LivewireContour":
          setActive(LivewireContourTool, primary);
          break;
        case "Magnify":
          setActive(MagnifyTool, primary);
          break;
        case "OverlayGrid":
          setActive(OverlayGridTool, primary);
          break;
        case "ScaleOverlay":
          setActive(ScaleOverlayTool, primary);
          break;
        case "AdvancedMagnify":
          setActive(AdvancedMagnifyTool, primary);
          break;
        case "UltrasoundDirectional":
          setActive(UltrasoundDirectionalTool, primary);
          break;
        case "RectangleScissors":
          setActive(RectangleScissorsTool, primary);
          break;
        case "CircleScissors":
          setActive(CircleScissorsTool, primary);
          break;
        case "SphereScissors":
          setActive(SphereScissorsTool, primary);
          break;
        case "Label":
          setActive(LabelTool, primary);
          break;
      }

      setActiveTool(toolName);

      // 切换后强制渲染以确保生效
      try {
        const re = renderingEngineRef.current as any;
        re?.render?.();
      } catch {}

      console.log(`已切换到工具: ${toolName}`);
    } catch (error) {
      console.error("切换工具失败:", error);
    }
  }, []);

  // 删除当前选中的标注
  const handleDeleteAnnotation = useCallback(() => {
    try {
      const annoModule: any = (csToolsAnnotation as any)?.state;
      if (!annoModule) {
        addToast({ color: "danger", description: "标注模块不可用" });
        return;
      }

      // 优先通过官方方法获取选中标注
      let selectedUID: string | undefined;
      try {
        const selected = annoModule.getSelectedAnnotation?.();
        selectedUID = selected?.annotationUID;
      } catch {}

      // 回退方案：遍历所有标注，查找被选中的
      if (!selectedUID) {
        let all: any = [];
        const raw = annoModule.getAllAnnotations?.();

        if (Array.isArray(raw)) {
          // 可能是注释对象数组，或按工具分组的二维数组
          all = raw.flat ? raw.flat(2) : raw;
        } else if (raw && typeof raw === "object") {
          // 可能是按工具名分组的对象/map
          const values = Object.values(raw as Record<string, any>);
          values.forEach((v: any) => {
            if (Array.isArray(v)) all.push(...v);
          });
        }

        const selectedAnno = all.find(
          (a: any) =>
            a?.isSelected ||
            a?.isHighlighted ||
            a?.highlighted ||
            a?.selection?.isSelected
        );
        selectedUID = selectedAnno?.annotationUID;
      }

      if (!selectedUID) {
        addToast({ color: "warning", description: "请先选中要删除的标注" });
        return;
      }

      // 执行删除
      deleteAnnotation(selectedUID);
    } catch (error) {
      console.error("删除标注失败:", error);
      addToast({ color: "danger", description: "删除标注失败" });
    }
  }, []);

  // 删除标注
  const deleteAnnotation = useCallback((annotationId: string) => {
    try {
      // 使用 Cornerstone Tools 的 API 删除标注
      if ((csToolsAnnotation as any)?.state?.removeAnnotation) {
        (csToolsAnnotation as any).state.removeAnnotation(annotationId);
        console.log("标注已删除:", annotationId);

        addToast({
          color: "success",
          description: "标注已删除",
        });

        // 重新渲染
        if (renderingEngineRef.current) {
          renderingEngineRef.current.render();
        }
      } else {
        console.warn("无法删除标注，API 不可用");
        addToast({
          color: "danger",
          description: "删除标注失败",
        });
      }
    } catch (error) {
      console.error("删除标注失败:", error);
      addToast({
        color: "danger",
        description: "删除标注失败",
      });
    }
  }, []);

  // 更新监控参数
  const updateMonitoringParameters = useCallback(() => {
    if (!renderingEngineRef.current) return;

    try {
      const renderingEngine = renderingEngineRef.current;
      const viewport: any = renderingEngine.getViewport("CT_SAGITTAL_STACK");

      if (viewport) {
        // Zoom 优先从 getScale 获取，其次通过 parallelScale 基准比值计算
        let z: number | undefined;
        const s = viewport?.getScale?.();
        if (typeof s === "number" && s > 0) {
          z = s;
        } else {
          const cam = viewport?.getCamera?.();
          const ps = cam?.parallelScale;
          const base = initialParallelScaleRef.current;
          if (
            typeof ps === "number" &&
            ps > 0 &&
            typeof base === "number" &&
            base > 0
          ) {
            z = base / ps;
          }
        }
        if (typeof z === "number" && Number.isFinite(z)) setZoom(z);

        // 窗宽窗位
        const viewportOptions = viewport?.getViewportOptions?.();
        if (viewportOptions) {
          if (typeof viewportOptions.voi?.windowWidth === "number") {
            setWindowWidth(viewportOptions.voi.windowWidth);
          }
          if (typeof viewportOptions.voi?.windowCenter === "number") {
            setWindowCenter(viewportOptions.voi.windowCenter);
          }
        }

        // 渲染时间：不强制触发渲染，避免循环
      }
    } catch (error) {
      console.warn("更新监控参数失败:", error);
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
      // 图像切换快捷键
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

    // 删除标注快捷键
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        handleDeleteAnnotation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleDeleteKey);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleDeleteKey);
    };
  }, [
    imageIds.length,
    goToPreviousImage,
    goToNextImage,
    handleDeleteAnnotation,
  ]);

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

  // 定期更新监控参数
  useEffect(() => {
    if (!isInitialized || !renderingEngineRef.current) return;

    const interval = setInterval(() => {
      updateMonitoringParameters();
    }, 100); // 每100ms更新一次

    return () => clearInterval(interval);
  }, [isInitialized, updateMonitoringParameters]);

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
        visible={!!dcmData}
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
        currentFileName={dcmData?.files[currentImageIndex]?.file_name}
        currentFile={dcmData?.files[currentImageIndex]}
        dicomMetadata={dicomMetadata}
      />

      {/* 实时监控面板 */}
      <ParameterMonitoringPanel
        currentImageIndex={currentImageIndex + 1}
        totalImages={imageIds.length}
        frameRate={frameRate}
        zoom={zoom}
        windowWidth={windowWidth}
        windowCenter={windowCenter}
        renderTime={renderTime}
        isVisible={!!dcmData && isInitialized}
      />
    </div>
  );
}

export default DetailPage;
