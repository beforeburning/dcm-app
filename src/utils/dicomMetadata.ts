import * as cornerstone from "@cornerstonejs/core";

/**
 * 从 Cornerstone.js 中获取 DICOM 元数据
 * @param imageId 图像ID
 * @param renderingEngine 渲染引擎引用
 * @returns DICOM 元数据对象
 */
export async function getDicomMetadata(imageId: string, renderingEngine?: any) {
  try {
    console.log("开始获取 DICOM 元数据，imageId:", imageId);

    // 如果没有渲染引擎，无法获取元数据
    if (!renderingEngine) {
      console.warn("渲染引擎未提供，无法获取元数据");
      return null;
    }

    // 通过 viewport 获取图像信息
    const viewport = renderingEngine.getViewport("CT_SAGITTAL_STACK");
    if (!viewport) {
      console.warn("无法获取视口");
      return null;
    }

    // 获取当前图像数据
    const imageData = (viewport as any).getImageData?.();
    if (!imageData) {
      console.warn("无法获取图像数据");
      return null;
    }

    // 获取图像尺寸
    const rows = imageData?.rows || imageData?.height || 0;
    const columns = imageData?.columns || imageData?.width || 0;

    // 从 Cornerstone.js 的元数据提供者获取 DICOM 标签值
    const getTagValue = (tag: string) => {
      try {
        // 使用 Cornerstone.js v3 的元数据 API
        if (cornerstone.metaData && cornerstone.metaData.get) {
          return cornerstone.metaData.get("dicom", imageId, tag);
        }

        // 备用方案：从 viewport 中获取元数据
        if (viewport.metadata && viewport.metadata[tag]) {
          return viewport.metadata[tag];
        }

        // 尝试从图像数据中获取
        if (imageData && imageData[tag]) {
          return imageData[tag];
        }

        return null;
      } catch (error) {
        console.warn(`获取标签 ${tag} 失败:`, error);
        return null;
      }
    };

    // 构建元数据对象
    const dicomMetadata = {
      // 基本图像信息
      rows,
      columns,

      // 像素间距 (0018,0050)
      pixelSpacing: getTagValue("00180050"),

      // 层厚 (0018,0050)
      sliceThickness: getTagValue("00180050"),

      // 窗宽 (0028,1051)
      windowWidth: getTagValue("00281051"),

      // 窗位 (0028,1050)
      windowCenter: getTagValue("00281050"),

      // 位分配 (0028,0100)
      bitsAllocated: getTagValue("00280100"),

      // 位存储 (0028,0101)
      bitsStored: getTagValue("00280101"),

      // 高位 (0028,0102)
      highBit: getTagValue("00280102"),

      // 每像素样本数 (0028,0002)
      samplesPerPixel: getTagValue("00280002"),

      // 光度解释 (0028,0004)
      photometricInterpretation: getTagValue("00280004"),

      // 模态 (0008,0060)
      modality: getTagValue("00080060"),

      // 检查日期 (0008,0020)
      studyDate: getTagValue("00080020"),

      // 序列日期 (0008,0021)
      seriesDate: getTagValue("00080021"),

      // 采集日期 (0008,0022)
      acquisitionDate: getTagValue("00080022"),
    };

    console.log("DICOM 元数据:", dicomMetadata);
    return dicomMetadata;
  } catch (error) {
    console.error("获取 DICOM 元数据失败:", error);
    return null;
  }
}

/**
 * 格式化 DICOM 日期
 * @param dicomDate DICOM 格式的日期字符串 (YYYYMMDD)
 * @returns 格式化的日期字符串
 */
export function formatDicomDate(dicomDate: string | null): string | null {
  if (!dicomDate || dicomDate.length !== 8) return null;

  try {
    const year = dicomDate.substring(0, 4);
    const month = dicomDate.substring(4, 6);
    const day = dicomDate.substring(6, 8);
    return `${year}-${month}-${day}`;
  } catch {
    return dicomDate;
  }
}
