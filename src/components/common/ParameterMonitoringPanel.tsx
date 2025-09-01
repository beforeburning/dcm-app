import React from "react";

interface ParameterMonitoringPanelProps {
  currentImageIndex: number;
  totalImages: number;
  frameRate?: number;
  zoom?: number;
  windowWidth?: number;
  windowCenter?: number;
  renderTime?: number;
  isVisible?: boolean;
}

export default function ParameterMonitoringPanel({
  currentImageIndex,
  totalImages,
  frameRate = 0,
  zoom = 1,
  windowWidth = 0,
  windowCenter = 0,
  renderTime = 0,
  isVisible = true,
}: ParameterMonitoringPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg shadow-lg border border-gray-600 min-w-[200px]">
      <div className="space-y-2 text-sm">
        {/* 图像信息 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Img:</span>
          <em className="text-white font-mono">
            {currentImageIndex || 1}/{totalImages}
          </em>
        </div>

        {/* FPS */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">FPS:</span>
          <em className="text-white font-mono">
            {frameRate ? frameRate.toFixed(1) : "0.0"}
          </em>
        </div>

        {/* 缩放 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Zoom:</span>
          <em className="text-white font-mono">
            {zoom ? zoom.toFixed(2) : "1.00"}
          </em>
        </div>

        {/* 窗宽窗位 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">WW/WL:</span>
          <em className="text-white font-mono">
            {windowWidth ? windowWidth.toFixed(0) : "0"}/
            {windowCenter ? windowCenter.toFixed(0) : "0"}
          </em>
        </div>

        {/* 渲染时间 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Render:</span>
          <em className="text-white font-mono">
            {renderTime ? renderTime.toFixed(1) : "0.0"}ms
          </em>
        </div>
      </div>
    </div>
  );
}
