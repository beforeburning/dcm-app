import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Chip,
  Select,
  SelectItem,
  Button,
} from "@heroui/react";

interface DatasetInfoFormProps {
  datasetName: string;
  setDatasetName: (name: string) => void;
  category: string;
  setCategory: (category: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  newTag: string;
  setNewTag: (tag: string) => void;
}

const categoryOptions = [
  { key: "1", label: "X光" },
  { key: "2", label: "CT" },
  { key: "3", label: "MRI" },
  { key: "4", label: "超声" },
  { key: "5", label: "PET" },
];

export const DatasetInfoForm: React.FC<DatasetInfoFormProps> = ({
  datasetName,
  setDatasetName,
  category,
  setCategory,
  tags,
  setTags,
  newTag,
  setNewTag,
}) => {
  // 添加标签
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 3) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">数据集信息</h2>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="dataset-name"
          >
            数据集名称 <span className="text-red-500">*</span>
          </label>
          <Input
            id="dataset-name"
            placeholder="请输入数据集名称，例如：胸部CT影像-案例01"
            value={datasetName}
            onValueChange={setDatasetName}
            variant="bordered"
            aria-label="数据集名称"
          />
          <p className="text-xs text-gray-500">
            给您的数据集起一个清晰、描述性的名称
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="image-type"
          >
            医学影像类型 <span className="text-red-500">*</span>
          </label>
          <Select
            id="image-type"
            placeholder="请选择医学影像类型"
            selectedKeys={category ? [category] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              setCategory(selectedKey || "");
            }}
            variant="bordered"
            aria-label="医学影像类型"
            classNames={{
              trigger: "min-h-12",
              value: "text-foreground",
            }}
          >
            {categoryOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
          <p className="text-xs text-gray-500">选择此数据集的医学影像类型</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="tag-input"
            >
              添加标签 <span className="text-gray-400">(可选)</span>
            </label>
            <div className="flex items-center space-x-2">
              <Input
                id="tag-input"
                placeholder="输入标签名称"
                value={newTag}
                onValueChange={setNewTag}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                variant="bordered"
                className="flex-1"
                aria-label="添加标签"
              />
              <Button
                size="lg"
                color="primary"
                variant="flat"
                onClick={addTag}
                isDisabled={!newTag.trim() || tags.length >= 3}
                aria-label="添加标签到列表"
              >
                添加
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              最多可添加3个标签，当前已添加{tags.length}个 (可选)
            </p>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Chip
                key={tag}
                color="primary"
                variant="flat"
                onClose={() => removeTag(tag)}
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
