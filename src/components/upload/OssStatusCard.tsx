import React from "react";
import { Card, CardBody, Button } from "@heroui/react";

interface OssStatusCardProps {
  ossConnected: boolean | null;
  onCheckConnection: () => void;
}

export const OssStatusCard: React.FC<OssStatusCardProps> = ({
  ossConnected,
  onCheckConnection,
}) => {
  return (
    <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardBody className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full shadow-sm ${
                  ossConnected === true
                    ? "bg-green-500 animate-pulse"
                    : ossConnected === false
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
                }`}
              ></div>
              <span className="text-sm font-semibold text-gray-700">
                OSS存储状态：
                {ossConnected === true && (
                  <span className="text-green-600 ml-2 font-medium">
                    ✓ 连接正常
                  </span>
                )}
                {ossConnected === false && (
                  <span className="text-red-600 ml-2 font-medium">
                    ✗ 连接异常
                  </span>
                )}
                {ossConnected === null && (
                  <span className="text-yellow-600 ml-2 font-medium">
                    ⏳ 检查中...
                  </span>
                )}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onClick={onCheckConnection}
            isLoading={ossConnected === null}
            className="shadow-md hover:shadow-lg transition-all duration-200"
            aria-label="重新检测OSS连接状态"
          >
            重新检测
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
