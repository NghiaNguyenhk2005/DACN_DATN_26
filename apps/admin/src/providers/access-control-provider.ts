import type { AccessControlProvider } from "@refinedev/core";
import type { RoleCode } from "@farmery/contract";
import { hasAnyRole } from "../lib/roles";
import { currentRoles } from "./auth-provider";

// Menu và nút theo vai trò: mỗi resource khai `meta.roles` chép từ `x-roles` của hợp đồng.
export const accessControlProvider: AccessControlProvider = {
  can: async ({ params }) => {
    const allowed = params?.resource?.meta?.roles as RoleCode[] | undefined;
    return hasAnyRole(currentRoles(), allowed)
      ? { can: true }
      : { can: false, reason: "Tài khoản của bạn không có quyền vào mục này." };
  },
  options: { buttons: { enableAccessControl: true, hideIfUnauthorized: true } },
};
