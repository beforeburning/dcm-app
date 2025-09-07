import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";

type Props = {
  open: boolean;
  title: string;
  imageIndex: number; // 0-based
  onClose: () => void;
};

export default function DrawingOverlay({
  open,
  title,
  imageIndex,
  onClose,
}: Props) {
  const drawRef = useRef<any>(null);
  const [brushColor, setBrushColor] = useState<string>("red");
  const [brushRadius, setBrushRadius] = useState<number>(10);
  const [scale, setScale] = useState<number>(1);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!open) return;
    const update = () => {
      try {
        setSize({
          width: Math.round(window.innerWidth * scale),
          height: Math.round(window.innerHeight * scale),
        });
      } catch {}
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, scale]);

  if (!open) return null;

  const safeTitle = String(title || "DICOM")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_");
  const idx = (imageIndex || 0) + 1;

  return (
    <div className="w-full h-full fixed top-0 z-[99999] left-0">
      {size.width > 0 && size.height > 0 && (
        <CanvasDraw
          ref={drawRef}
          canvasWidth={size.width}
          canvasHeight={size.height}
          brushRadius={brushRadius}
          brushColor={brushColor}
          backgroundColor="transparent"
          lazyRadius={0}
          hideGrid
        />
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 p-3 bg-white/90 border border-gray-200 rounded-lg shadow-md">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm text-gray-700">画笔颜色</span>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer bg-white"
            title="选择标注颜色"
          />
          <button
            onClick={() => setBrushColor("#ff0000")}
            className="px-2 py-1 text-xs rounded bg-red-600 text-white cursor-pointer"
          >
            红
          </button>
          <button
            onClick={() => setBrushColor("#00aa00")}
            className="px-2 py-1 text-xs rounded bg-green-600 text-white cursor-pointer"
          >
            绿
          </button>
          <button
            onClick={() => setBrushColor("#0077ff")}
            className="px-2 py-1 text-xs rounded bg-blue-600 text-white cursor-pointer"
          >
            蓝
          </button>

          <span className="mx-2 h-5 w-px bg-gray-300" />

          <span className="text-sm text-gray-700">画笔粗细</span>
          <button
            onClick={() => setBrushRadius((r) => Math.max(1, r - 1))}
            className="px-2 py-1 text-xs rounded bg-gray-700 text-white cursor-pointer"
          >
            -
          </button>
          <span className="text-sm text-gray-800 min-w-[2ch] text-center">
            {brushRadius}
          </span>
          <button
            onClick={() => setBrushRadius((r) => Math.min(100, r + 1))}
            className="px-2 py-1 text-xs rounded bg-gray-700 text-white cursor-pointer"
          >
            +
          </button>

          <span className="mx-2 h-5 w-px bg-gray-300" />

          <button
            onClick={() => drawRef.current?.undo?.()}
            className="px-3 py-1 text-xs rounded bg-yellow-600 text-white cursor-pointer"
          >
            撤销
          </button>
          <button
            onClick={() => drawRef.current?.clear?.()}
            className="px-3 py-1 text-xs rounded bg-red-500 text-white cursor-pointer"
          >
            清空
          </button>
          <button
            onClick={() => {
              try {
                const dataUrl = drawRef.current?.getDataURL?.("image/png");
                if (!dataUrl) return;
                const ts = Date.now();
                const filename = `${safeTitle}-图像${idx}-${ts}.png`;
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch (e) {
                console.warn("保存图片失败", e);
              }
            }}
            className="px-3 py-1 text-xs rounded bg-blue-700 text-white cursor-pointer"
          >
            保存图片
          </button>
          <span className="mx-2 h-5 w-px bg-gray-300" />

          <button
            onClick={() => {
              try {
                onClose?.();
              } catch {}
            }}
            className="px-3 py-1 text-xs rounded bg-red-500 text-white cursor-pointer"
            title="退出画笔"
          >
            退出画笔
          </button>
        </div>
      </div>
    </div>
  );
}
