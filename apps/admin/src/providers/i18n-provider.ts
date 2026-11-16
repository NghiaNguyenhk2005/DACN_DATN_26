import type { I18nProvider } from "@refinedev/core";

// Chỉ dịch các khóa Refine dựng sẵn đang hiện trên màn hình; khóa lạ giữ câu mặc định.
const VI: Record<string, string> = {
  "actions.list": "Danh sách",
  "actions.show": "Chi tiết",
  "actions.create": "Tạo mới",
  "actions.edit": "Sửa",
  "buttons.logout": "Đăng xuất",
  "buttons.refresh": "Tải lại",
  "buttons.show": "Chi tiết",
  "buttons.edit": "Sửa",
  "buttons.create": "Tạo mới",
  "buttons.save": "Lưu",
  "buttons.delete": "Xóa",
  "buttons.cancel": "Hủy",
  "buttons.confirm": "Bạn chắc chắn chứ?",
  "buttons.filter": "Lọc",
  "buttons.clear": "Xóa lọc",
  "buttons.notAccessTooltip": "Bạn không có quyền thực hiện thao tác này",
  "notifications.success": "Thành công",
  "notifications.error": "Có lỗi",
  "pages.error.404": "Không tìm thấy trang này.",
  "pages.error.backHome": "Về trang chủ",
  "pages.error.info": "Bạn có thể quên thêm action {{action}} vào resource {{resource}}.",
  "warnWhenUnsavedChanges": "Bạn có thay đổi chưa lưu, vẫn rời trang?",
  "loading": "Đang tải",
};

export const i18nProvider: I18nProvider = {
  // Nút "Danh sách" của trang chi tiết dịch theo khóa "<resource>.titles.list".
  translate: (key, _options, defaultMessage) =>
    VI[key] ?? defaultMessage ?? (key.endsWith(".titles.list") ? "Danh sách" : key),
  changeLocale: async () => undefined,
  getLocale: () => "vi",
};
