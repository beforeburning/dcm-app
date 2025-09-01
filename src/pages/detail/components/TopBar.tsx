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

        <div className="flex items-center gap-2">
          {onConsoleEditData && (
            <Button
              onClick={onConsoleEditData}
              disabled={!hasData}
              size="sm"
              variant="solid"
              color={hasData ? "success" : "default"}
              className="font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform text-white"
              startContent={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
              }
            >
              保存数据
            </Button>
          )}

          <Button
            onClick={onReload}
            disabled={!isInitialized || isLoading || !hasData}
            size="sm"
            variant="solid"
            color={isInitialized && hasData ? "primary" : "default"}
            className="font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform"
            startContent={
              isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )
            }
          >
            {isLoading ? "加载中..." : "重新加载"}
          </Button>

          <Button
            onClick={onReset}
            disabled={!isInitialized || isLoading || !hasData}
            size="sm"
            variant="solid"
            color={isInitialized && hasData ? "warning" : "default"}
            className="font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform text-white"
            startContent={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            }
          >
            重置视图
          </Button>
        </div>
      </div>
    </div>
  );
}
