"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Schema } from "@farmery/contract";
import { api } from "@/lib/api";
import { authedClient } from "@/lib/data/account";
import { problemMessage } from "@/lib/problem";

async function getClient() {
  const authed = await authedClient();
  return authed ?? api;
}

export type CreateBatchResult = {
  ok: boolean;
  message?: string;
  batchId?: string;
};

/** Server Action: Khai báo lô hàng mới (POST /seller/batches) */
export async function createBatchAction(
  _prev: CreateBatchResult | null,
  formData: FormData,
): Promise<CreateBatchResult> {
  const productId = String(formData.get("productId") ?? "").trim();
  const harvestDate = String(formData.get("harvestDate") ?? "").trim();
  const bestBefore = String(formData.get("bestBefore") ?? "").trim();
  const declaredQuantity = Number(formData.get("declaredQuantity") ?? 0);

  if (!productId) {
    return { ok: false, message: "Vui lòng chọn sản phẩm." };
  }
  if (!harvestDate) {
    return { ok: false, message: "Vui lòng chọn ngày thu hoạch." };
  }
  if (!bestBefore) {
    return { ok: false, message: "Vui lòng chọn hạn sử dụng tốt nhất (bestBefore)." };
  }
  if (bestBefore <= harvestDate) {
    return { ok: false, message: "Hạn sử dụng tốt nhất phải sau ngày thu hoạch." };
  }
  if (declaredQuantity <= 0 || isNaN(declaredQuantity)) {
    return { ok: false, message: "Sản lượng khai báo phải lớn hơn 0." };
  }

  let createdBatchId = "";

  try {
    const client = await getClient();
    const { data, error, response } = await client.POST("/seller/batches", {
      body: {
        productId,
        harvestDate,
        bestBefore,
        declaredQuantity,
      },
    });

    if (data) {
      createdBatchId = data.id;
    } else {
      const msg = problemMessage(
        error as Schema<"Problem">,
        response.status,
        "Không thể tạo lô hàng. Vui lòng kiểm tra lại thông tin.",
      );
      return { ok: false, message: msg };
    }
  } catch {
    return { ok: false, message: "Lỗi kết nối tới máy chủ API khi tạo lô." };
  }

  revalidatePath("/nha-cung-cap");
  revalidatePath("/nha-cung-cap/lo-hang");
  if (createdBatchId) {
    redirect(`/nha-cung-cap/lo-hang/${createdBatchId}?thanh-cong=1`);
  }
  redirect("/nha-cung-cap/lo-hang");
}

export type AddFarmingLogResult = {
  ok: boolean;
  message?: string;
};

/** Server Action: Ghi nhật ký canh tác (chỉ nối thêm / đính chính) */
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
  const today = new Date().toISOString().slice(0, 10);
  if (activityDate > today) return { ok: false, message: "Ngày thực hiện không được ở tương lai." };
  if (!description) return { ok: false, message: "Vui lòng nhập mô tả hoạt động." };

  try {
    const client = await getClient();
    const { data, error, response } = await client.POST("/seller/batches/{batchId}/logs", {
      params: { path: { batchId } },
      body: {
        activityDate,
        activity,
        description,
        supersedesId,
      },
    });

    if (data) {
      revalidatePath(`/nha-cung-cap/lo-hang/${batchId}`);
      return { ok: true, message: "Đã ghi nhật ký canh tác thành công!" };
    }

    const msg = problemMessage(
      error as Schema<"Problem">,
      response.status,
      "Chưa ghi được nhật ký. Vui lòng thử lại.",
    );
    return { ok: false, message: msg };
  } catch {
    return { ok: false, message: "Lỗi kết nối tới máy chủ khi ghi nhật ký." };
  }
}
