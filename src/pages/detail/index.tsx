import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  copyPublicDataToPrivateRequest,
  getStudentDataDetailRequest,
} from "@/api/dcm";
import { errorHandler } from "@/utils/errorHandler";

import { getDicomMetadata } from "@/utils/dicomMetadata";
import TopBar from "./components/TopBar";
import ToolBar from "./components/ToolBar";
import StatusBanners from "./components/StatusBanners";
import ViewerCanvas from "./components/ViewerCanvas";
import ImageSwitcher from "./components/ImageSwitcher";
import { ParameterMonitoringPanel } from "@/components/common";
import { useAuthStore } from "@/stores/auth";
import {
  updateOriginalAnnotationRequest,
  updateStudentAnnotationRequest,
} from "@/api/dicom";
import { StudentCopyDataDetail, OriginalDataDetail } from "@/types/api";
import {
  Annotation,
  Annotations,
} from "@cornerstonejs/tools/types/AnnotationTypes";
import deepMerge from "@cornerstonejs/core/utilities/deepMerge";

const { ViewportType } = Enums;
const { MouseBindings } = ToolsEnums;

// 工具显示与说明已拆分到组件内部

function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const path = useLocation().pathname;

  const elementRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // 数据加载状态
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTool, setActiveTool] = useState("WindowLevel"); // 当前激活的工具
  const [dcmData, setDcmData] = useState<
    StudentCopyDataDetail | OriginalDataDetail | null
  >(null); // DCM数据
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 当前图像索引

  const [imageIds, setImageIds] = useState<string[]>([]); // 图像 ID列表
  const [isImageControlExpanded, setIsImageControlExpanded] = useState(true); // 图像切换控件展开状态
  const [dicomMetadata, setDicomMetadata] = useState<any>(null); // DICOM 元数据
  const [frameRate, setFrameRate] = useState<number>(0); // FPS
  const [zoom, setZoom] = useState<number>(1); // 缩放
  const [windowWidth, setWindowWidth] = useState<number>(0); // 窗宽
  const [windowCenter, setWindowCenter] = useState<number>(0); // 窗位
  const [savedAnnotations, setSavedAnnotations] = useState<any[]>([]); // 保存的标注数据
  const [annotationColor, setAnnotationColor] = useState<string>("#00ff00"); // 标注颜色
  const renderingEngineRef = useRef(null);
  const toolGroupRef = useRef(null); // 保存工具组引用
  const loadSeqRef = useRef(0); // 加载序列，用于防止并发操作导致的已销毁实例访问
  const viewportListenerCleanupRef = useRef<(() => void) | null>(null);
  const lastRenderTsRef = useRef<number>(0);
  const initialParallelScaleRef = useRef<number | null>(null);
  const isOriginal = useMemo(() => path.includes("original"), [path]);

  // 打印并保存当前注释/测量 JSON（仅工具绘制数据）
  const printAnnotations = useCallback(async () => {
    try {
      // 收集所有标注
      let annotationsAll: Annotations =
        csToolsAnnotation.state.getAllAnnotations() || [];

      let annotationsAllCopy: Annotations = JSON.parse(
        JSON.stringify(annotationsAll)
      );

      let arr = annotationsAllCopy.map((item: Annotation) => {
        if (JSON.stringify(item.data.cachedStats) !== "{}") {
          let key = Object.keys(item.data.cachedStats)[0].split("?")[0];
          let value = Object.values(item.data.cachedStats)[0];
          let newValue = {
            [key]: value,
          };
          item.data.cachedStats = newValue;
        }

        item.metadata.referencedImageId =
          item.metadata.referencedImageId.split("?")[0];

        // 写入当前标注的颜色到保存数据中
        try {
          const toolName = item?.metadata?.toolName || (item as any)?.toolName;
          let effectiveColor = csToolsAnnotation.config.style.getStyleProperty(
            "color",
            {
              annotationUID: item.annotationUID,
              toolName,
            }
          );
          if (!effectiveColor) {
            effectiveColor = hexToRgb(annotationColor);
          }
          item.data = {
            ...(item.data || {}),
            style: {
              ...(item.data?.style as any),
              color: effectiveColor,
              textBoxColor: effectiveColor,
              textbox: {
                ...(item.data?.style as any)?.textbox,
                color: effectiveColor,
              },
            },
          };
        } catch (err) {
          // 忽略颜色写入失败
        }

        return item;
      });
      const annotationData = JSON.stringify(arr);
      console.log("🚀 ~ printAnnotations ~ annotationsAll:", arr);

      if (isOriginal) {
        // 原始数据 - 管理员/教师保存
        const response = await updateOriginalAnnotationRequest(
          dcmData.original_id,
          annotationData
        );

        if (response.success) {
          addToast({
            color: "success",
            description: "标注保存成功",
          });
        } else {
          addToast({
            color: "danger",
            description: response.message || "保存失败",
          });
        }
      } else {
        // 学生复制数据 - 学生保存
        const response = await updateStudentAnnotationRequest(
          (dcmData as any).user_copy_id,
          annotationData
        );

        if (response.success) {
          addToast({
            color: "success",
            description: "标注保存成功",
          });
        } else {
          addToast({
            color: "danger",
            description: response.message || "保存失败",
          });
        }
      }
    } catch (e: any) {
      console.warn("导出标注数据失败", e);
      addToast({ color: "danger", description: "导出失败" });
    }
  }, [imageIds, dcmData]);

  // 清空当前视图的所有标注数据（本地与渲染层）
  const clearAllAnnotations = useCallback(() => {
    try {
      // 1) 清空工具状态中的所有标注
      csToolsAnnotation.state.removeAllAnnotations();

      // 2) 清空本地已保存的标注快照
      setSavedAnnotations([]);

      // 3) 触发重渲染
      const renderingEngine = renderingEngineRef.current as any;
      if (renderingEngine) {
        const viewport = renderingEngine.getViewport("CT_SAGITTAL_STACK");
        viewport?.render?.();
      }

      addToast({ color: "success", description: "已清空所有标注" });
    } catch (e) {
      console.warn("清空标注失败", e);
      addToast({ color: "danger", description: "清空失败" });
    }
  }, []);

  // 为“新创建的标注”设置颜色（不影响已存在的标注）
  useEffect(() => {
    const onAnnotationAdded = (evt: any) => {
      const { annotation } = evt.detail || {};
      // if (!annotation || !annotation.annotationUID) return;

      try {
        csToolsAnnotation.config.style.setAnnotationStyles(
          annotation.annotationUID,
          {
            // 轮廓/线条颜色
            color: annotationColor,
            // 文本颜色（测量文本/Label 文本）
            textBoxColor: annotationColor,
            textbox: {
              color: annotationColor,
            },
          }
        );
      } catch (e) {
        console.warn("设置新标注颜色失败", e);
      }
    };

    cornerstone.eventTarget.addEventListener(
      ToolsEnums.Events.ANNOTATION_ADDED,
      onAnnotationAdded
    );

    return () => {
      cornerstone.eventTarget.removeEventListener(
        ToolsEnums.Events.ANNOTATION_ADDED,
        onAnnotationAdded
      );
    };
  }, [annotationColor]);

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

          try {
            const cam = (viewport as any)?.getCamera?.();
            const basePS = cam?.parallelScale;
            if (typeof basePS === "number" && basePS > 0) {
              initialParallelScaleRef.current = basePS;
              (viewport as any)?.setCamera?.({
                ...cam,
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
        const response = isOriginal
          ? await getOriginalDataDetailRequest(Number(id))
          : await getStudentDataDetailRequest(Number(id));

        if (response.success && response.data) {
          setDcmData(response.data);

          // 如果有保存的标注数据，保存到状态中，等待 Cornerstone 初始化后恢复

          let data =
            response.data.last_annotation?.annotation ||
            (response.data as any)?.original_data?.last_annotation?.annotation;

          if (data) {
            try {
              const savedAnnotations = JSON.parse(data);
              console.log("🚀解析保存的标注数据:", savedAnnotations);
              // 保存到状态中，等待后续恢复
              setSavedAnnotations(savedAnnotations);
            } catch (error) {
              console.warn("解析保存的标注数据失败:", error);
            }
          }

          // 初始化图像 ID 列表
          const files =
            (response.data as any).files ||
            (response.data as any).original_data?.files;
          if (files && files.length > 0) {
            const ids = files.map((file: any) => {
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
              onloadstart: (_e: any, params: any) => {},
              onprogress: (e: any, params: any) => {},
              onreadystatechange: (e: any, params: any) => {
                const xhr = e?.target;
              },
              onloadend: (_e: any, params: any) => {},
              beforeProcessing: (xhr: any) => Promise.resolve(xhr.response),
              errorInterceptor: (error: any) => {
                console.error("请求错误", error);
              },
            });
          }
        } catch (e) {
          console.warn("设置 dicomImageLoader 调试选项失败（可忽略）", e);
        }

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
      } else if ((dcmData as any).files && (dcmData as any).files.length > 0) {
        // 如果状态中还没有imageIds，使用dcmData构建
        const allImageIds = (dcmData as any).files.map((file: any) => {
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

      // 设置图像堆栈（只显示当前图像）
      if (seq !== loadSeqRef.current) return;
      await (viewport as any).setStack(currentImageIds);
      if (typeof (viewport as any).resetCamera === "function") {
        (viewport as any).resetCamera();
      }

      try {
        const cam = (viewport as any)?.getCamera?.();
        const basePS = cam?.parallelScale;
        if (typeof basePS === "number" && basePS > 0) {
          initialParallelScaleRef.current = basePS;
          (viewport as any)?.setCamera?.({ ...cam });
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

        // Cornerstone v3 视口事件（使用 Enums.Events）
        try {
          const EV = Enums?.Events || ({} as any);
          const RENDERED = EV.VIEWPORT_RENDERED || "rendered";
          const CAMERA = EV.CAMERA_MODIFIED || "cameraModified";
          const VOI = EV.VOI_MODIFIED || "voiModified";

          vp?.addEventListener?.(RENDERED, handleRendered);
          vp?.addEventListener?.(CAMERA, handleCameraChange);
          vp?.addEventListener?.(VOI, handleRendered);

          // 立即触发一次，确保初始值正确
          handleRendered();

          viewportListenerCleanupRef.current = () => {
            try {
              vp?.removeEventListener?.(RENDERED, handleRendered);
              vp?.removeEventListener?.(CAMERA, handleCameraChange);
              vp?.removeEventListener?.(VOI, handleRendered);
            } catch {}
          };
        } catch {}
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
        }
      } catch (error) {
        console.warn("获取初始 DICOM 元数据失败:", error);
        setDicomMetadata(null);
      }

      // 恢复保存的标注数据
      if (savedAnnotations.length > 0) {
        console.log("🚀开始恢复标注数据...");

        saveAnnotationsToCornerstone(savedAnnotations);
        // 恢复完成后清空状态
        setSavedAnnotations([]);
      }
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
        AdvancedMagnifyTool,
        UltrasoundDirectionalTool,
        RectangleScissorsTool,
        CircleScissorsTool,
        SphereScissorsTool,
        LabelTool,
      ].forEach(maybePassive);

      // 依据工具设置正确的鼠标绑定
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

  // 修改接下来标注颜色
  const changeAnnotationColor = useCallback((color: string) => {
    setAnnotationColor(color);
  }, []);

  // 删除标注
  const deleteAnnotation = useCallback((annotationId: string) => {
    try {
      // 使用 Cornerstone Tools 的 API 删除标注
      if ((csToolsAnnotation as any)?.state?.removeAnnotation) {
        (csToolsAnnotation as any).state.removeAnnotation(annotationId);
        console.log("标注已删除:", annotationId);

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

  // 恢复标注数据 - 使用官方方法
  const saveAnnotationsToCornerstone = (savedAnnotations: any[]) => {
    const files =
      dcmData.files || (dcmData as StudentCopyDataDetail).original_data?.files;
    try {
      let file = files.map((item) => {
        return {
          name: item.file_name,
          url: item.fresh_url,
        };
      });
      console.log("🚀恢复标注数据:", file);

      let data = savedAnnotations.map((item: Annotation) => {
        file.map((fileItem) => {
          if (item.metadata.referencedImageId.includes(fileItem.name)) {
            item.metadata.referencedImageId = `wadouri:${fileItem.url}`;

            if (JSON.stringify(item.data.cachedStats) !== "{}") {
              let value = Object.values(item.data.cachedStats)[0];
              item.data.cachedStats = {
                [`imageId:wadouri:${fileItem.url}`]: value,
              };
            }
          }
        });
        return item;
      });

      // 遍历保存的标注数据，逐个添加
      data.forEach((annotation: any) => {
        try {
          // 确保标注有正确的 metadata 结构
          if (!annotation.metadata) {
            annotation.metadata = {
              toolName: annotation.toolName || "Length",
              FrameOfReferenceUID: "default",
            };
          }

          // 确保有 FrameOfReferenceUID
          if (!annotation.metadata.FrameOfReferenceUID) {
            annotation.metadata.FrameOfReferenceUID = "default";
          }

          // 确保有正确的 toolName
          if (!annotation.metadata.toolName) {
            annotation.metadata.toolName = annotation.toolName || "Length";
          }

          // 确保标注有正确的数据结构
          if (!annotation.data) {
            annotation.data = {
              points: annotation.points || [],
              measurements: annotation.measurements || {},
            };
          }

          console.log("🚀添加标注:", annotation);

          // 使用官方方法添加单个标注
          // 根据文档，第二个参数应该是 element 或 FrameOfReferenceUID
          // 我们使用当前视口元素来确保标注被正确绑定到视口
          const annotationUID = csToolsAnnotation.state.addAnnotation(
            annotation,
            elementRef.current // 使用 DOM 元素作为 annotationGroupSelector
          );

          // 验证标注是否真的被添加了
          console.log(`🚀标注 ${annotationUID} 已添加到状态`);

          // 根据文档，需要触发标注添加事件到元素
          if (elementRef.current) {
            try {
              csToolsAnnotation.state.triggerAnnotationAddedForElement(
                annotation,
                elementRef.current
              );
              console.log(`🚀已触发标注添加事件到元素`);
            } catch (error) {
              console.warn("🚀触发标注添加事件失败:", error);
            }
          }

          // 如果保存数据里带有颜色，使用新的 UID 恢复该颜色
          try {
            const savedStyle = (annotation as any)?.data?.style;
            const savedColor = savedStyle?.color;
            const savedTextColor =
              savedStyle?.textBoxColor || savedStyle?.textbox?.color;
            if (annotationUID && (savedColor || savedTextColor)) {
              csToolsAnnotation.config.style.setAnnotationStyles(
                annotationUID,
                {
                  ...(savedColor ? { color: savedColor } : {}),
                  ...(savedTextColor
                    ? {
                        textBoxColor: savedTextColor,
                        textbox: { color: savedTextColor },
                      }
                    : {}),
                }
              );
            }
          } catch (e) {
            // 忽略单个标注样式恢复失败
          }

          console.log("🚀添加标注成功:", annotation.annotationUID);
        } catch (error) {
          console.warn("🚀添加单个标注失败:", error, annotation);
        }
      });

      // 强制重新渲染视口以显示标注
      if (renderingEngineRef.current) {
        setTimeout(() => {
          try {
            // 确保工具组中的标注被正确渲染
            const toolGroup = toolGroupRef.current;
            if (toolGroup) {
              // 重新激活当前工具以确保标注显示
              const currentTool = activeTool;
              if (currentTool && currentTool !== "DeleteAnnotation") {
                toolGroup.setToolActive(currentTool, {
                  bindings: [{ mouseButton: MouseBindings.Primary }],
                });
              }
            }

            // 关键：确保标注数据被绑定到视口
            const viewport =
              renderingEngineRef.current.getViewport("CT_SAGITTAL_STACK");
            if (viewport) {
              // 触发视口重新渲染事件
              viewport.render();
            }

            // 强制重新渲染
            renderingEngineRef.current.render();
            console.log("🚀标注恢复完成，已强制重新渲染");

            // 验证标注是否真的存在
            setTimeout(() => {
              const allAnnotations =
                csToolsAnnotation.state.getAllAnnotations();
              console.log("🚀恢复后的所有标注:", allAnnotations);
            }, 200);
          } catch (error) {
            console.warn("强制渲染失败:", error);
          }
        }, 100);
      }
    } catch (error) {
      console.error("🚀恢复标注数据失败:", error);
    }
  };

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

  // 可选：把 #rrggbb 转 rgb(r,g,b)
  function hexToRgb(hex: string) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    return `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(
      m[3],
      16
    )})`;
  }

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

  // 监听标注颜色变化，更新工具组配置
  useEffect(() => {
    if (toolGroupRef.current && isInitialized) {
      changeAnnotationColor(annotationColor);
    }
  }, [annotationColor, isInitialized, changeAnnotationColor]);

  // 处理复制数据
  const [loading, setLoading] = useState<{
    copy: boolean;
    delete: boolean;
  }>({ copy: false, delete: false });
  // 获取数据名称
  const getDataName = (
    data: StudentCopyDataDetail | OriginalDataDetail
  ): string => {
    if ("name" in data) return data.name;
    if ("copy_name" in data) return data.copy_name;
    return "未知数据";
  };
  const handleCopyData = async () => {
    if (!userInfo?.user_id) {
      addToast({
        color: "danger",
        description: "用户信息错误，请重新登录",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, copy: true }));
    try {
      const res = await copyPublicDataToPrivateRequest({
        original_id: dcmData.original_id,
        copy_name: `${getDataName(dcmData)} - 复制`,
      });

      if (res.success) {
        addToast({
          color: "success",
          description: "复制成功！数据已添加到您的账户",
        });
      } else {
        errorHandler.handleApiError(new Error(res.message), "复制失败");
      }
    } catch (error) {
      errorHandler.handleApiError(error, "复制失败");
    } finally {
      setLoading((prev) => ({ ...prev, copy: false }));
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        title={
          dataLoading
            ? "DICOM 图像查看器"
            : (dcmData as any)?.name ||
              (dcmData as any)?.copy_name ||
              "DICOM 图像查看器"
        }
        isInitialized={!!isInitialized}
        isLoading={!!isLoading}
        hasData={!!dcmData}
        onBack={() => navigate("/list")}
        onReload={loadDicomFile}
        onCopyData={handleCopyData}
        onConsoleEditData={printAnnotations}
        onClearData={clearAllAnnotations}
      />
      <ToolBar
        isInitialized={!!isInitialized}
        activeTool={activeTool}
        onSwitch={switchTool}
        annotationColor={annotationColor}
        onColorChange={changeAnnotationColor}
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
        currentFileName={
          (dcmData as any)?.files?.[currentImageIndex]?.file_name ||
          (dcmData as any)?.original_data?.files?.[currentImageIndex]?.file_name
        }
        currentFile={
          (dcmData as any)?.files?.[currentImageIndex] ||
          (dcmData as any)?.original_data?.files?.[currentImageIndex]
        }
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
        isVisible={!!dcmData && isInitialized}
      />
    </div>
  );
}

export default DetailPage;
