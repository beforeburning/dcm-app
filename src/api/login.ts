import { ApiResponse } from ".";

const mockJwtToken = "jwt-1234567890";

export type loginParams = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export const loginRequest = async (
  params: loginParams
): Promise<ApiResponse<LoginResponse>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (params.username !== "admin" || params.password !== "123456") {
    return {
      code: 401,
      message: "用户名或密码错误",
    };
  }

  return {
    code: 200,
    message: "success",
    data: {
      token: mockJwtToken,
    },
  };
};

export type UserInfo = {
  userName: string;
  userId: string;
  createTime: string;
  updateTime: string;
};

export const getUserInfoRequest = async (
  token: string
): Promise<ApiResponse<UserInfo>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (token !== mockJwtToken) {
    return {
      code: 401,
      message: "token 无效",
    };
  }

  return {
    code: 200,
    message: "success",
    data: {
      userName: "Burning",
      userId: "1234567890",
      createTime: "2021-01-01",
      updateTime: "2021-01-01",
    },
  };
};
