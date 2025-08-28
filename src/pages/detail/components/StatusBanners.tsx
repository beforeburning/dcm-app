type Props = {
  error: string | null;
  dataLoading: boolean;
  isInitialized: boolean;
};

export default function StatusBanners({
  error,
  dataLoading,
  isInitialized,
}: Props) {
  return (
    <>
      {error && (
        <div className="p-3 bg-red-100 text-red-800 border-b border-red-300">
          错误: {error}
        </div>
      )}
      {dataLoading && (
        <div className="p-3 bg-blue-100 text-blue-800 border-b border-blue-300">
          正在加载数据...
        </div>
      )}
      {!isInitialized && (
        <div className="p-3 bg-cyan-100 text-cyan-800 border-b border-cyan-300">
          正在初始化 Cornerstone...
        </div>
      )}
    </>
  );
}
