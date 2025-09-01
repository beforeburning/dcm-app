import { Button } from "@heroui/react";

type Props = {
  visible: boolean;
  isLoading: boolean;
  imageCount: number;
  currentIndex: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  currentFileName?: string;
  currentFile?: {
    file_name: string;
    file_size: number;
    file_path: string;
    created_at: string;
    updated_at: string;
  };
  // DICOM 医学影像参数
  dicomMetadata?: {
    rows?: number; // 图像行数（高度）
    columns?: number; // 图像列数（宽度）
    pixelSpacing?: number[]; // 像素间距 [rowSpacing, columnSpacing]
    sliceThickness?: number; // 层厚
    windowCenter?: number; // 窗位
    windowWidth?: number; // 窗宽
    bitsAllocated?: number; // 位分配
    bitsStored?: number; // 位存储
    highBit?: number; // 高位
    samplesPerPixel?: number; // 每像素样本数
    photometricInterpretation?: string; // 光度解释
    modality?: string; // 模态（CT、MRI等）
    studyDate?: string; // 检查日期
    seriesDate?: string; // 序列日期
    acquisitionDate?: string; // 采集日期
  };
};

export default function ImageSwitcher({
  visible,
  isLoading,
  imageCount,
  currentIndex,
  expanded,
  onToggleExpanded,
  onPrev,
  onNext,
  onJump,
  currentFileName,
}: Props) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="mb-2">
        <Button
          size="sm"
          onClick={onToggleExpanded}
          className="bg-gray-800 bg-opacity-90 backdrop-blur-sm hover:bg-gray-700 text-white border border-gray-600 shadow-lg"
        >
          {expanded ? "🔽" : "🖼️"} {currentIndex + 1}/{imageCount}
        </Button>
      </div>

      {expanded && (
        <div className="bg-gray-800 w-[320px] bg-opacity-95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl p-4 min-w-72">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-orange-300">
              图像切换:
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={onPrev}
                disabled={imageCount <= 1 || isLoading}
                className="bg-gray-600 hover:bg-gray-500 text-white min-w-unit-8 h-8"
              >
                ◀
              </Button>
              <span className="text-sm text-gray-300 px-3 min-w-16 text-center">
                {currentIndex + 1} / {imageCount}
              </span>
              <Button
                size="sm"
                onClick={onNext}
                disabled={imageCount <= 1 || isLoading}
                className="bg-gray-600 hover:bg-gray-500 text-white min-w-unit-8 h-8"
              >
                ▶
              </Button>
            </div>
          </div>

          <div className="mb-3 space-y-2">
            {/* 当前文件名 - 强制换行 */}
            <div>
              <span className="text-xs text-gray-400 block mb-1">
                当前文件:
              </span>
              <div className="text-xs text-gray-300 bg-gray-700 bg-opacity-50 p-2 rounded break-all leading-relaxed">
                {currentFileName || "未知"}
              </div>
            </div>
          </div>

          {imageCount > 2 && (
            <div>
              <div className="text-xs text-gray-400 mb-2">快速跳转:</div>
              <div className="flex gap-1 overflow-x-auto pb-2 max-w-64">
                {Array.from({ length: imageCount }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onJump(index)}
                    disabled={isLoading}
                    className={`
                          flex-shrink-0 w-8 h-6 text-xs rounded transition-all
                          ${
                            index === currentIndex
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

          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="text-xs text-gray-500">💡 快捷键: ← → 切换图像</div>
          </div>
        </div>
      )}
    </div>
  );
}
