import type { RoleCode } from "@farmery/contract";

export const STAFF_ROLES: readonly RoleCode[] = [
  "staff_moderation",
  "staff_operations",
  "staff_sourcing",
  "staff_warehouse",
  "staff_support",
  "platform_owner",
];

export const ROLE_LABELS: Partial<Record<RoleCode, string>> = {
  staff_moderation: "Kiểm duyệt",
  staff_operations: "Vận hành",
  staff_sourcing: "Thu mua",
  staff_warehouse: "Kho",
  staff_support: "Hỗ trợ",
  platform_owner: "Chủ nền tảng",
};

export function isStaff(roles: readonly RoleCode[]): boolean {
  return roles.some((r) => STAFF_ROLES.includes(r));
}

/** `allowed` lấy theo `x-roles` của thao tác chính của màn hình; không khai thì mọi nhân sự đều xem được. */
export function hasAnyRole(roles: readonly RoleCode[], allowed: readonly RoleCode[] | undefined): boolean {
  if (!allowed?.length) return isStaff(roles);
  return roles.some((r) => allowed.includes(r));
}
