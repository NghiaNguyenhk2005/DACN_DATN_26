import { RefineThemes } from "@refinedev/antd";
import type { ThemeConfig } from "antd";

// Token antd của ứng dụng nội bộ — chỉnh theo bảng màu của apps/shop.
export const adminTheme: ThemeConfig = {
  ...RefineThemes.Green,
  token: { ...RefineThemes.Green.token, borderRadius: 8 },
};
