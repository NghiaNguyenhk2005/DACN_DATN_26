import { useEffect, useState } from "react";
import { usePermissions } from "@refinedev/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, Card, Form, Input, InputNumber, Modal, Select, Skeleton } from "antd";
import type { RoleCode, Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { unwrap } from "../../lib/problem";

type PlatformSettings = Schema<"PlatformSettings">;
type SettingsUpdate = Schema<"PlatformSettingsUpdate">;

const LABELS: Record<keyof PlatformSettings, string> = {
  shippingFee: "Phí giao hàng",
  freeShippingThreshold: "Ngưỡng miễn phí giao",
  codMaxAmount: "Giá trị COD tối đa",
  cutoffTime: "Giờ chốt đơn",
  deliverySlots: "Khung giờ giao",
  reservationMinutes: "Thời gian giữ chỗ",
  retailVatPercent: "Thuế GTGT bán lẻ",
  wholesaleCommissionRate: "Tỷ lệ hoa hồng sỉ",
};

const TIME = "([01][0-9]|2[0-3]):[0-5][0-9]";
const SLOT = new RegExp(`^${TIME}-${TIME}$`);

function validateSlots(_: unknown, slots: string[] | undefined) {
  if (!slots?.length || slots.length > 12) return Promise.reject(new Error("Cần từ 1 đến 12 khung giờ."));
  if (new Set(slots).size !== slots.length) return Promise.reject(new Error("Khung giờ giao bị trùng."));
  if (slots.some((slot) => !SLOT.test(slot) || slot.slice(0, 5) >= slot.slice(6))) {
    return Promise.reject(new Error("Nhập khung giờ hợp lệ, ví dụ 08:00-11:00."));
  }
  return Promise.resolve();
}

function showValue(key: keyof PlatformSettings, value: PlatformSettings[typeof key]) {
  if (Array.isArray(value)) return value.join(", ");
  if (key === "wholesaleCommissionRate") return `${(Number(value) * 100).toLocaleString("vi-VN")}%`;
  if (key === "retailVatPercent") return `${value}%`;
  if (key === "reservationMinutes") return `${value} phút`;
  if (typeof value === "number") return `${value.toLocaleString("vi-VN")} ₫`;
  return value;
}

const QUERY_KEY = ["settings"];
const vndFormatter = (v?: number | string) => (v === undefined || v === "" ? "" : Number(v).toLocaleString("vi-VN"));
const vndParser = (v?: string) => Number((v ?? "").replace(/\./g, ""));

// PUT chỉ gửi khóa đã đổi theo hợp đồng.
function changedKeys(before: PlatformSettings, after: PlatformSettings): SettingsUpdate {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(after)) {
    if (JSON.stringify(v) !== JSON.stringify(before[k as keyof PlatformSettings])) out[k] = v;
  }
  return out as SettingsUpdate;
}

export function SettingsPage() {
  const { data: roles } = usePermissions<RoleCode[]>({});
  const canEdit = !!roles?.includes("platform_owner");
  const [form] = Form.useForm<PlatformSettings>();
  const [changes, setChanges] = useState<SettingsUpdate | null>(null);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => unwrap(api.GET("/admin/settings"), "Không tải được cấu hình."),
  });

  useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  const save = useMutation({
    mutationFn: (body: SettingsUpdate) => unwrap(api.PUT("/admin/settings", { body }), "Chưa lưu được cấu hình."),
    onSuccess: (saved) => {
      queryClient.setQueryData(QUERY_KEY, saved);
      setChanges(null);
      message.success("Đã lưu cấu hình.");
    },
    onError: (e) => message.error((e as { message?: string }).message),
  });

  const onFinish = (values: PlatformSettings) => {
    if (!data) return;
    const body = changedKeys(data, values);
    if (Object.keys(body).length === 0) {
      message.info("Chưa có thay đổi nào.");
      return;
    }
    setChanges(body);
  };

  return (
    <Card title="Cấu hình nền tảng">
      {isError && <Alert type="warning" showIcon message={(error as { message?: string }).message} />}
      {isLoading && <Skeleton active />}
      {data && (
        <>
          {!canEdit && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Chỉ chủ nền tảng được sửa cấu hình; bạn đang xem ở chế độ chỉ đọc."
            />
          )}
          <Form form={form} layout="vertical" disabled={!canEdit} onFinish={onFinish} style={{ maxWidth: 560 }}>
            <Form.Item name="shippingFee" label="Phí giao hàng (đã gồm thuế)" rules={[{ required: true }]}>
              <InputNumber min={0} max={10_000_000} step={1000} addonAfter="₫" formatter={vndFormatter} parser={vndParser} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="freeShippingThreshold" label="Miễn phí giao từ (tiền hàng)" rules={[{ required: true }]}>
              <InputNumber min={0} max={1_000_000_000} step={10000} addonAfter="₫" formatter={vndFormatter} parser={vndParser} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="codMaxAmount" label="Giá trị tối đa cho thanh toán khi nhận hàng" rules={[{ required: true }]}>
              <InputNumber min={0} max={1_000_000_000} step={100000} addonAfter="₫" formatter={vndFormatter} parser={vndParser} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="cutoffTime"
              label="Giờ chốt đơn trong ngày"
              rules={[{ required: true, pattern: /^([01][0-9]|2[0-3]):[0-5][0-9]$/, message: "Định dạng HH:mm, ví dụ 16:00" }]}
            >
              <Input placeholder="16:00" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item
              name="deliverySlots"
              label="Khung giờ giao"
              tooltip="Gõ khung giờ dạng 08:00-11:00 rồi Enter"
              rules={[{ validator: validateSlots }]}
            >
              <Select mode="tags" tokenSeparators={[","]} open={false} />
            </Form.Item>
            <Form.Item name="reservationMinutes" label="Thời gian giữ chỗ khi đặt đơn" rules={[{ required: true }]}>
              <InputNumber min={1} max={120} precision={0} addonAfter="phút" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="retailVatPercent" label="Thuế GTGT bán lẻ" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="wholesaleCommissionRate" label="Tỷ lệ hoa hồng sỉ (0 đến 1)"
              rules={[{ required: true }, {
                validator: (_, rate?: number) => rate === undefined || Math.round(rate * 10_000) / 10_000 === rate
                  ? Promise.resolve()
                  : Promise.reject(new Error("Dùng tối đa 4 chữ số thập phân.")),
              }]}>
              <InputNumber min={0} max={1} step={0.0001} style={{ width: 160 }} />
            </Form.Item>
            {canEdit && (
              <Button type="primary" htmlType="submit" loading={save.isPending}>
                Lưu cấu hình
              </Button>
            )}
          </Form>
          <Modal
            title="Xác nhận thay đổi cấu hình"
            open={changes !== null}
            okText="Lưu thay đổi"
            cancelText="Quay lại"
            confirmLoading={save.isPending}
            cancelButtonProps={{ disabled: save.isPending }}
            onCancel={() => { if (!save.isPending) setChanges(null); }}
            onOk={() => { if (changes && !save.isPending) save.mutate(changes); }}
          >
            <dl>
              {(Object.keys(changes ?? {}) as (keyof PlatformSettings)[]).map((key) => (
                <div key={key} style={{ marginBottom: 8 }}>
                  <dt>{LABELS[key]}</dt>
                  <dd>{showValue(key, data[key])} → {showValue(key, changes![key]!)}</dd>
                </div>
              ))}
            </dl>
          </Modal>
        </>
      )}
    </Card>
  );
}
