"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Schema } from "@farmery/contract";
import { mutate } from "@/lib/data/account";
import { loginHref } from "@/lib/session";

export type CreateBatchResult = {
  ok: boolean;
  message?: string;
};

/** Server Action: khai báo lô mới (POST /seller/batches), xong chuyển sang trang chi tiết lô. */
export async function createBatchAction(
  _prev: CreateBatchResult | null,
  formData: FormData,
): Promise<CreateBatchResult> {
  const productId = String(formData.get("productId") ?? "").trim();
  const harvestDate = String(formData.get("harvestDate") ?? "").trim();
  const bestBefore = String(formData.get("bestBefore") ?? "").trim();
  const declaredQuantity = Number(formData.get("declaredQuantity") ?? 0);

  if (!productId) return { ok: false, message: "Vui lòng chọn sản phẩm." };
  if (!harvestDate) return { ok: false, message: "Vui lòng chọn ngày thu hoạch." };
  if (!bestBefore) return { ok: false, message: "Vui lòng chọn hạn dùng." };
  if (bestBefore <= harvestDate) return { ok: false, message: "Hạn dùng phải sau ngày thu hoạch." };
  if (!(declaredQuantity > 0)) return { ok: false, message: "Sản lượng khai báo phải lớn hơn 0." };

  const res = await mutate(
    (api) => api.POST("/seller/batches", { body: { productId, harvestDate, bestBefore, declaredQuantity } }),
    "Không tạo được lô hàng. Vui lòng kiểm tra lại thông tin.",
  );
  if (!res.ok) {
    if (res.code === "UNAUTHENTICATED") redirect(loginHref("/nha-cung-cap/lo-hang/tao-moi"));
    return { ok: false, message: res.message };
  }

  revalidatePath("/nha-cung-cap", "layout");
  redirect(`/nha-cung-cap/lo-hang/${res.data.id}?thanh-cong=1`);
}

export type AddFarmingLogResult = {
  ok: boolean;
  message?: string;
};

/** Server Action: ghi nhật ký canh tác — chỉ nối thêm, đính chính thì trỏ `supersedesId` về dòng cũ. */
export async function appendFarmingLogAction(
  _prev: AddFarmingLogResult | null,
  formData: FormData,
): Promise<AddFarmingLogResult> {
  const batchId = String(formData.get("batchId") ?? "").trim();
  const activityDate = String(formData.get("activityDate") ?? "").trim();
  const activity = String(formData.get("activity") ?? "other") as Schema<"FarmingActivity">;
  const description = String(formData.get("description") ?? "").trim();
  const supersedesId = String(formData.get("supersedesId") ?? "").trim() || undefined;

  if (!batchId) return { ok: false, message: "Thiếu mã lô hàng." };
  if (!activityDate) return { ok: false, message: "Vui lòng chọn ngày thực hiện." };
  if (!description) return { ok: false, message: "Vui lòng nhập mô tả hoạt động." };

  const res = await mutate(
    (api) =>
      api.POST("/seller/batches/{batchId}/logs", {
        params: { path: { batchId } },
        body: { activityDate, activity, description, supersedesId },
      }),
    "Chưa ghi được nhật ký. Vui lòng thử lại.",
  );
  if (!res.ok) {
    if (res.code === "UNAUTHENTICATED") redirect(loginHref(`/nha-cung-cap/lo-hang/${batchId}`));
    return { ok: false, message: res.message };
  }

  revalidatePath(`/nha-cung-cap/lo-hang/${batchId}`);
  return { ok: true, message: supersedesId ? "Đã lưu bản đính chính." : "Đã ghi nhật ký canh tác." };
}
