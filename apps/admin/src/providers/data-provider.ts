import type { DataProvider } from "@refinedev/core";
import { API_URL } from "../lib/api";

// Stub: mỗi resource nối vào client của @farmery/contract khi endpoint tương ứng xong.
const notImplemented = () => Promise.reject(new Error("Chưa nối data provider với API"));

export const dataProvider: DataProvider = {
  getApiUrl: () => API_URL,
  getList: notImplemented,
  getOne: notImplemented,
  create: notImplemented,
  update: notImplemented,
  deleteOne: notImplemented,
};
