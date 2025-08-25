import { ApiResponse } from ".";

export type DcmFile = {
  id: string;
  name: string;
  size: number;
  path: string;
};

export type DcmList = {
  id: string;
  name: string;
  createTime: number;
  updateTime: number;
  files: DcmFile[];
  totalFiles: number;
  totalSize: number;
};

// 使用可靠的DICOM测试数据源
export const qiniuBaseUrl = "http://t1am3584v.hn-bkt.clouddn.com/";

// 模拟读取文件系统数据
const getDcmFolderData = (): DcmList[] => {
  // 模拟从文件系统读取的数据
  const folderData = [
    {
      id: "1",
      files: [
        {
          id: "1-1",
          name: "000e6a9a.dcm",
          size: 253 * 1024,
          path: "1/000e6a9a.dcm",
        },
        {
          id: "1-2",
          name: "000e6a9b.dcm",
          size: 253 * 1024,
          path: "1/000e6a9b.dcm",
        },
        {
          id: "1-3",
          name: "000e6a9c.dcm",
          size: 254 * 1024,
          path: "1/000e6a9c.dcm",
        },
        {
          id: "1-4",
          name: "000e6a9d.dcm",
          size: 254 * 1024,
          path: "1/000e6a9d.dcm",
        },
        {
          id: "1-5",
          name: "000e6a9e.dcm",
          size: 255 * 1024,
          path: "1/000e6a9e.dcm",
        },
        {
          id: "1-6",
          name: "000e6a9f.dcm",
          size: 255 * 1024,
          path: "1/000e6a9f.dcm",
        },
      ],
    },
    {
      id: "2",
      files: [
        {
          id: "2-1",
          name: "000e6a98.dcm",
          size: 253 * 1024,
          path: "2/000e6a98.dcm",
        },
        {
          id: "2-2",
          name: "000e6a99.dcm",
          size: 252 * 1024,
          path: "2/000e6a99.dcm",
        },
      ],
    },
    {
      id: "3",
      files: [
        {
          id: "3-1",
          name: "000e6aa0.dcm",
          size: 257 * 1024,
          path: "3/000e6aa0.dcm",
        },
        {
          id: "3-2",
          name: "000e6aa1.dcm",
          size: 258 * 1024,
          path: "3/000e6aa1.dcm",
        },
        {
          id: "3-3",
          name: "000e6aa2.dcm",
          size: 259 * 1024,
          path: "3/000e6aa2.dcm",
        },
        {
          id: "3-4",
          name: "000e6aa3.dcm",
          size: 258 * 1024,
          path: "3/000e6aa3.dcm",
        },
        {
          id: "3-5",
          name: "000e6aa4.dcm",
          size: 260 * 1024,
          path: "3/000e6aa4.dcm",
        },
        {
          id: "3-6",
          name: "000e6aa5.dcm",
          size: 258 * 1024,
          path: "3/000e6aa5.dcm",
        },
        {
          id: "3-7",
          name: "000e6aa6.dcm",
          size: 260 * 1024,
          path: "3/000e6aa6.dcm",
        },
        {
          id: "3-8",
          name: "000e6aa7.dcm",
          size: 261 * 1024,
          path: "3/000e6aa7.dcm",
        },
        {
          id: "3-9",
          name: "000e6aa8.dcm",
          size: 290 * 1024,
          path: "3/000e6aa8.dcm",
        },
        {
          id: "3-10",
          name: "000e6aa9.dcm",
          size: 289 * 1024,
          path: "3/000e6aa9.dcm",
        },
      ],
    },
    {
      id: "4",
      files: [
        {
          id: "4-1",
          name: "000e6ab7.dcm",
          size: 247 * 1024,
          path: "4/000e6ab7.dcm",
        },
        {
          id: "4-2",
          name: "000e6ab8.dcm",
          size: 246 * 1024,
          path: "4/000e6ab8.dcm",
        },
        {
          id: "4-3",
          name: "000e6ab9.dcm",
          size: 245 * 1024,
          path: "4/000e6ab9.dcm",
        },
      ],
    },
    {
      id: "5",
      files: [
        {
          id: "5-1",
          name: "000e6ac6.dcm",
          size: 238 * 1024,
          path: "5/000e6ac6.dcm",
        },
        {
          id: "5-2",
          name: "000e6ac7.dcm",
          size: 237 * 1024,
          path: "5/000e6ac7.dcm",
        },
        {
          id: "5-3",
          name: "000e6ac8.dcm",
          size: 236 * 1024,
          path: "5/000e6ac8.dcm",
        },
        {
          id: "5-4",
          name: "000e6ac9.dcm",
          size: 235 * 1024,
          path: "5/000e6ac9.dcm",
        },
      ],
    },
    {
      id: "6",
      files: [
        {
          id: "6-1",
          name: "000e6ad5.dcm",
          size: 229 * 1024,
          path: "6/000e6ad5.dcm",
        },
        {
          id: "6-2",
          name: "000e6ad6.dcm",
          size: 228 * 1024,
          path: "6/000e6ad6.dcm",
        },
        {
          id: "6-3",
          name: "000e6ad7.dcm",
          size: 227 * 1024,
          path: "6/000e6ad7.dcm",
        },
        {
          id: "6-4",
          name: "000e6ad8.dcm",
          size: 226 * 1024,
          path: "6/000e6ad8.dcm",
        },
        {
          id: "6-5",
          name: "000e6ad9.dcm",
          size: 225 * 1024,
          path: "6/000e6ad9.dcm",
        },
      ],
    },
    {
      id: "7",
      files: [
        {
          id: "7-1",
          name: "000e6ae7.dcm",
          size: 217 * 1024,
          path: "7/000e6ae7.dcm",
        },
        {
          id: "7-2",
          name: "000e6ae8.dcm",
          size: 216 * 1024,
          path: "7/000e6ae8.dcm",
        },
        {
          id: "7-3",
          name: "000e6ae9.dcm",
          size: 215 * 1024,
          path: "7/000e6ae9.dcm",
        },
      ],
    },
    {
      id: "8",
      files: [
        {
          id: "8-1",
          name: "000e6af6.dcm",
          size: 208 * 1024,
          path: "8/000e6af6.dcm",
        },
        {
          id: "8-2",
          name: "000e6af7.dcm",
          size: 207 * 1024,
          path: "8/000e6af7.dcm",
        },
        {
          id: "8-3",
          name: "000e6af8.dcm",
          size: 206 * 1024,
          path: "8/000e6af8.dcm",
        },
        {
          id: "8-4",
          name: "000e6af9.dcm",
          size: 205 * 1024,
          path: "8/000e6af9.dcm",
        },
      ],
    },
    {
      id: "9",
      files: [
        {
          id: "9-1",
          name: "000e6b05.dcm",
          size: 199 * 1024,
          path: "9/000e6b05.dcm",
        },
        {
          id: "9-2",
          name: "000e6b06.dcm",
          size: 198 * 1024,
          path: "9/000e6b06.dcm",
        },
        {
          id: "9-3",
          name: "000e6b07.dcm",
          size: 197 * 1024,
          path: "9/000e6b07.dcm",
        },
        {
          id: "9-4",
          name: "000e6b08.dcm",
          size: 196 * 1024,
          path: "9/000e6b08.dcm",
        },
        {
          id: "9-5",
          name: "000e6b09.dcm",
          size: 195 * 1024,
          path: "9/000e6b09.dcm",
        },
      ],
    },
    {
      id: "10",
      files: [
        {
          id: "10-1",
          name: "000e6b17.dcm",
          size: 187 * 1024,
          path: "10/000e6b17.dcm",
        },
        {
          id: "10-2",
          name: "000e6b18.dcm",
          size: 186 * 1024,
          path: "10/000e6b18.dcm",
        },
        {
          id: "10-3",
          name: "000e6b19.dcm",
          size: 185 * 1024,
          path: "10/000e6b19.dcm",
        },
      ],
    },
    {
      id: "11",
      files: [
        {
          id: "11-1",
          name: "000e6b26.dcm",
          size: 178 * 1024,
          path: "11/000e6b26.dcm",
        },
        {
          id: "11-2",
          name: "000e6b27.dcm",
          size: 177 * 1024,
          path: "11/000e6b27.dcm",
        },
        {
          id: "11-3",
          name: "000e6b28.dcm",
          size: 176 * 1024,
          path: "11/000e6b28.dcm",
        },
        {
          id: "11-4",
          name: "000e6b29.dcm",
          size: 175 * 1024,
          path: "11/000e6b29.dcm",
        },
      ],
    },
    {
      id: "12",
      files: [
        {
          id: "12-1",
          name: "000e6b35.dcm",
          size: 169 * 1024,
          path: "12/000e6b35.dcm",
        },
        {
          id: "12-2",
          name: "000e6b36.dcm",
          size: 168 * 1024,
          path: "12/000e6b36.dcm",
        },
        {
          id: "12-3",
          name: "000e6b37.dcm",
          size: 167 * 1024,
          path: "12/000e6b37.dcm",
        },
        {
          id: "12-4",
          name: "000e6b38.dcm",
          size: 166 * 1024,
          path: "12/000e6b38.dcm",
        },
        {
          id: "12-5",
          name: "000e6b39.dcm",
          size: 165 * 1024,
          path: "12/000e6b39.dcm",
        },
      ],
    },
    {
      id: "13",
      files: [
        {
          id: "13-1",
          name: "000e6b47.dcm",
          size: 157 * 1024,
          path: "13/000e6b47.dcm",
        },
        {
          id: "13-2",
          name: "000e6b48.dcm",
          size: 156 * 1024,
          path: "13/000e6b48.dcm",
        },
        {
          id: "13-3",
          name: "000e6b49.dcm",
          size: 155 * 1024,
          path: "13/000e6b49.dcm",
        },
      ],
    },
    {
      id: "14",
      files: [
        {
          id: "14-1",
          name: "000e6b56.dcm",
          size: 148 * 1024,
          path: "14/000e6b56.dcm",
        },
        {
          id: "14-2",
          name: "000e6b57.dcm",
          size: 147 * 1024,
          path: "14/000e6b57.dcm",
        },
        {
          id: "14-3",
          name: "000e6b58.dcm",
          size: 146 * 1024,
          path: "14/000e6b58.dcm",
        },
        {
          id: "14-4",
          name: "000e6b59.dcm",
          size: 145 * 1024,
          path: "14/000e6b59.dcm",
        },
      ],
    },
    {
      id: "15",
      files: [
        {
          id: "15-1",
          name: "000e6b65.dcm",
          size: 139 * 1024,
          path: "15/000e6b65.dcm",
        },
        {
          id: "15-2",
          name: "000e6b66.dcm",
          size: 138 * 1024,
          path: "15/000e6b66.dcm",
        },
        {
          id: "15-3",
          name: "000e6b67.dcm",
          size: 137 * 1024,
          path: "15/000e6b67.dcm",
        },
        {
          id: "15-4",
          name: "000e6b68.dcm",
          size: 136 * 1024,
          path: "15/000e6b68.dcm",
        },
        {
          id: "15-5",
          name: "000e6b69.dcm",
          size: 135 * 1024,
          path: "15/000e6b69.dcm",
        },
      ],
    },
  ];

  return folderData.map((folder) => {
    const totalSize = folder.files.reduce((sum, file) => sum + file.size, 0);
    return {
      id: folder.id,
      name: `DCM-${folder.id}`,
      createTime: 1755697500,
      updateTime: 1755697500,
      files: folder.files,
      totalFiles: folder.files.length,
      totalSize,
    };
  });
};

export const getDcmListRequest = async (): Promise<ApiResponse<DcmList[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const dcmList = getDcmFolderData();

  return {
    code: 200,
    message: "success",
    data: dcmList,
  };
};
