import { Button } from "@heroui/react";

type Props = {
  title: string;
  isInitialized: boolean;
  isLoading: boolean;
  hasData: boolean;
  onBack: () => void;
  onReload: () => void;
  onReset: () => void;
  onConsoleEditData?: () => void;
};

export default function TopBar({
  title,
  isInitialized,
  isLoading,
  hasData,
  onBack,
  onReload,
  onReset,
  onConsoleEditData,
}: Props) {
  return (
    <div className="bg-gray-800 text-white px-4 pt-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white"
            size="sm"
          >
            ← 返回列表
          </Button>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {onConsoleEditData && (
            <Button
              onClick={onConsoleEditData}
              disabled={!hasData}
              className={`
                text-sm rounded transition-colors duration-200
                ${
                  hasData
                    ? "bg-gray-700 hover:bg-gray-600 cursor-pointer"
                    : "bg-gray-500 cursor-not-allowed"
                }
              `}
            >
              💾 保存数据
            </Button>
          )}
          <Button
            onClick={onReload}
            disabled={!isInitialized || isLoading || !hasData}
            className={`
                text-sm rounded transition-colors duration-200
                ${
                  isInitialized && hasData
                    ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    : "bg-gray-500 cursor-not-allowed"
                }
                ${!isInitialized || isLoading || !hasData ? "opacity-75" : ""}
              `}
          >
            {isLoading ? "加载中..." : "重新加载"}
          </Button>

          <Button
            onClick={onReset}
            disabled={!isInitialized || isLoading || !hasData}
            className={`
                text-sm rounded transition-colors duration-200
                ${
                  isInitialized && hasData
                    ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                    : "bg-gray-500 cursor-not-allowed"
                }
                ${!isInitialized || isLoading || !hasData ? "opacity-75" : ""}
              `}
          >
            重置视图
          </Button>
        </div>
      </div>
    </div>
  );
}
