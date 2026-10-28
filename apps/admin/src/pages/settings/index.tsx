import { useEffect } from "react";
import { usePermissions } from "@refinedev/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, Card, Form, Input, InputNumber, Select, Skeleton } from "antd";
import type { RoleCode, Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { unwrap } from "../../lib/problem";

type PlatformSettings = Schema<"PlatformSettings">;

const QUERY_KEY = ["settings"];
const vndFormatter = (v?: number | string) => (v === undefined || v === "" ? "" : Number(v).toLocaleString("vi-VN"));
const vndParser = (v?: string) => Number((v ?? "").replace(/\D/g, ""));

// PUT chỉ gửi khoá đã đổi theo hợp đồng.
function changedKeys(before: PlatformSettings, after: PlatformSettings): PlatformSettings {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(after)) {
    if (JSON.stringify(v) !== JSON.stringify(before[k as keyof PlatformSettings])) out[k] = v;
  }
  return out as PlatformSettings;
}

export function SettingsPage() {
  const { data: roles } = usePermissions<RoleCode[]>({});
  const canEdit = !!roles?.includes("platform_owner");
  const [form] = Form.useForm<PlatformSettings>();
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
    mutationFn: (body: PlatformSettings) => unwrap(api.PUT("/admin/settings", { body }), "Chưa lưu được cấu hình."),
    onSuccess: (saved) => {
      queryClient.setQueryData(QUERY_KEY, saved);
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
    save.mutate(body);
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
              <InputNumber min={0} step={1000} addonAfter="₫" formatter={vndFormatter} parser={vndParser} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="freeShippingThreshold" label="Miễn phí giao từ (tiền hàng)" rules={[{ required: true }]}>
              <InputNumber min={0} step={10000} addonAfter="₫" formatter={vndFormatter} parser={vndParser} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="codMaxAmount" label="Giá trị tối đa cho thanh toán khi nhận hàng" rules={[{ required: true }]}>
              <InputNumber min={0} step={100000} addonAfter="₫" formatter={vndFormatter} parser={vndParser} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="cutoffTime"
              label="Giờ chốt đơn trong ngày"
              rules={[{ required: true, pattern: /^[0-2][0-9]:[0-5][0-9]$/, message: "Định dạng HH:mm, ví dụ 16:00" }]}
            >
              <Input placeholder="16:00" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item
              name="deliverySlots"
              label="Khung giờ giao"
              tooltip="Gõ khung giờ dạng 08:00-11:00 rồi Enter"
              rules={[{ required: true, type: "array", min: 1, message: "Cần ít nhất một khung giờ" }]}
            >
              <Select mode="tags" tokenSeparators={[","]} open={false} />
            </Form.Item>
            <Form.Item name="reservationMinutes" label="Thời gian giữ chỗ khi đặt đơn" rules={[{ required: true }]}>
              <InputNumber min={1} addonAfter="phút" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="retailVatPercent" label="Thuế GTGT bán lẻ" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.5} addonAfter="%" style={{ width: 160 }} />
            </Form.Item>
            {canEdit && (
              <Button type="primary" htmlType="submit" loading={save.isPending}>
                Lưu cấu hình
              </Button>
            )}
          </Form>
        </>
      )}
    </Card>
  );
}
