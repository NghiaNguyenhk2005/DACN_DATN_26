import { RefineThemes } from "@refinedev/antd";
import type { ThemeConfig } from "antd";

// Token antd của ứng dụng nội bộ, ánh xạ từ token của apps/shop (globals.css) theo design/04 §1.
export const adminTheme: ThemeConfig = {
  ...RefineThemes.Green,
  token: {
    ...RefineThemes.Green.token,
    colorPrimary: "#1f5132",
    colorLink: "#1f5132",
    colorSuccess: "#2f7a48",
    colorWarning: "#d97706",
    colorError: "#b42318",
    colorText: "#1c211b",
    colorBorder: "#e6ebe2",
    borderRadius: 8,
    fontFamily: '"Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif',
  },
};
