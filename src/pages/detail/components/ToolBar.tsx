import {
  getToolDisplayName,
  getToolInstructions,
  type ToolName,
} from "./Tooling";

type Props = {
  isInitialized: boolean;
  activeTool: string;
  onSwitch: (tool: ToolName | string) => void;
};

export default function ToolBar({
  isInitialized,
  activeTool,
  onSwitch,
}: Props) {
  if (!isInitialized) return null;

  const ToolButton = ({
    name,
    label,
  }: {
    name: ToolName | string;
    label: string;
  }) => (
    <button
      onClick={() => onSwitch(name)}
      className={`px-2 py-1 text-xs rounded transition-all ${
        activeTool === name
          ? "bg-blue-600 text-white"
          : "bg-gray-600 text-gray-200 hover:bg-gray-500"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2 bg-gray-800 px-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-blue-300 mr-1">基本:</span>
        <ToolButton name="WindowLevel" label="🌅 窗位" />
        <ToolButton name="Pan" label="✋ 平移" />
        <ToolButton name="Zoom" label="🔍 缩放" />
        <ToolButton name="Probe" label="🔎 探针" />

        <span className="text-xs font-medium text-green-300 mr-1 ml-3">
          测量:
        </span>
        <ToolButton name="Length" label="📏 长度" />
        <ToolButton name="Angle" label="📐 角度" />
        <ToolButton name="Bidirectional" label="↔️ 双向" />

        <span className="text-xs font-medium text-purple-300 mr-1 ml-3">
          标注:
        </span>
        <ToolButton name="RectangleROI" label="▭ 矩形" />
        <ToolButton name="EllipticalROI" label="⚬ 椭圆" />
        <ToolButton name="CircleROI" label="◯ 圆形" />
        <ToolButton name="PlanarFreehandROI" label="🎨 绘制" />
        <ToolButton name="ArrowAnnotate" label="➡️ 箭头" />
        <ToolButton name="Label" label="📝 文字" />
      </div>

      <div className="text-xs text-gray-300 py-1 rounded">
        <span className="text-yellow-300">当前:</span>{" "}
        <span className="font-medium">{getToolDisplayName(activeTool)}</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className="text-blue-300">{getToolInstructions(activeTool)}</span>
      </div>
    </div>
  );
}
