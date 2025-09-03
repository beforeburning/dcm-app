import { ReactNode } from "react";

type Props = {
  elementRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  isInitialized: boolean;
  hasData: boolean;
  showSwitchHint: boolean;
  children?: ReactNode;
};

export default function ViewerCanvas({
  elementRef,
  isLoading,
  isInitialized,
  hasData,
  showSwitchHint,
  children,
}: Props) {
  return (
    <div className="flex-1 relative overflow-hidden ">
      <div
        ref={elementRef as any}
        className="w-full h-full bg-black"
        style={{ minHeight: "400px" }}
      >
        {!isLoading && isInitialized && hasData && (
          <>
            <div className="absolute top-1 left-4 text-gray-400 text-sm bg-black bg-opacity-50 px-2 py-1 rounded z-10">
              图像将自动加载，或点击按钮重新加载
            </div>
            {/* {showSwitchHint && (
              <div className="absolute top-1 right-4 text-gray-400 text-sm bg-black bg-opacity-50 px-2 py-1 rounded z-10">
                使用 ← → 键切换图像
              </div>
            )} */}
          </>
        )}

        {!hasData && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📁</div>
              <div>数据加载失败</div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div>正在加载数据...</div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
