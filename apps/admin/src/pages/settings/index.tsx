import { useEffect, useState } from "react";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Form, InputNumber, Skeleton, Space, TimePicker, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { describeError } from "../inventory/labels";

type Settings = Schema<"PlatformSettings">;
type SettingsUpdate = Schema<"PlatformSettingsUpdate">;
type SlotRange = [Dayjs, Dayjs] | null;

interface FormValues {
  codMaxAmount: number;
  cutoffTime: Dayjs;
  slots: SlotRange[];
  shippingFee: number;
  freeShippingThreshold: number;
  reservationMinutes: number;
  retailVatPercent: number;
}

const HM = "HH:mm";
const toDayjs = (hm: string): Dayjs => {
  const [h = "0", m = "0"] = hm.split(":");
  return dayjs().hour(Number(h)).minute(Number(m)).second(0).millisecond(0);
};
const toHm = (d: Dayjs): string => d.format(HM);

function toFormValues(s: Settings): FormValues {
  return {
    codMaxAmount: s.codMaxAmount,
    cutoffTime: toDayjs(s.cutoffTime),
    slots: s.deliverySlots.map((slot) => {
      const [from = "00:00", to = "00:00"] = slot.split("-");
      return [toDayjs(from), toDayjs(to)] as [Dayjs, Dayjs];
    }),
    shippingFee: s.shippingFee,
    freeShippingThreshold: s.freeShippingThreshold,
    reservationMinutes: s.reservationMinutes,
    retailVatPercent: s.retailVatPercent,
  };
}

// Chỉ gửi những khóa người dùng đã đổi: API cập nhật một phần, khóa không gửi giữ nguyên.
function diff(current: Settings, v: FormValues): SettingsUpdate {
  const next: Settings = {
    codMaxAmount: v.codMaxAmount,
    cutoffTime: toHm(v.cutoffTime),
    deliverySlots: v.slots.filter((r): r is [Dayjs, Dayjs] => r !== null).map(([a, b]) => `${toHm(a)}-${toHm(b)}`),
    shippingFee: v.shippingFee,
    freeShippingThreshold: v.freeShippingThreshold,
    reservationMinutes: v.reservationMinutes,
    retailVatPercent: v.retailVatPercent,
  };
  const changes: SettingsUpdate = {};
  for (const key of Object.keys(next) as (keyof Settings)[]) {
    if (JSON.stringify(next[key]) !== JSON.stringify(current[key])) Object.assign(changes, { [key]: next[key] });
  }
  return changes;
}

const vnd = (n: number | null | undefined) => `${(n ?? 0).toLocaleString("vi-VN")} đ`;

export function SettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [current, setCurrent] = useState<Settings | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.GET("/admin/settings"), api.GET("/me")])
      .then(([settings, me]) => {
        if (cancelled) return;
        if (!settings.data) {
          setError(describeError(settings.error));
          return;
        }
        setCurrent(settings.data);
        setCanEdit(Boolean(me.data?.roles.includes("platform_owner")));
        form.setFieldsValue(toFormValues(settings.data));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(describeError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [form]);

  async function save(values: FormValues) {
    if (!current) return;
    const changes = diff(current, values);
    if (Object.keys(changes).length === 0) {
      void message.info("Không có thay đổi nào để lưu");
      return;
    }
    setSaving(true);
    try {
      const { data, error: err } = await api.PUT("/admin/settings", { body: changes });
      if (data) {
        setCurrent(data);
        form.setFieldsValue(toFormValues(data));
        void message.success("Đã lưu cấu hình, có hiệu lực ngay cho đơn mới");
      } else {
        void message.error(describeError(err));
      }
    } catch (e) {
      void message.error(describeError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Cấu hình nền tảng">
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      {!error && !current && <Skeleton active />}
      {current && (
        <>
          {!canEdit && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Bạn chỉ xem được cấu hình. Chỉ Chủ nền tảng được thay đổi."
            />
          )}
          <Form<FormValues> form={form} layout="vertical" disabled={!canEdit || saving} onFinish={save} style={{ maxWidth: 560 }}>
            <Typography.Title level={5}>Thanh toán và giao hàng</Typography.Title>
            <Form.Item label="Mức tối đa cho đơn COD (đ)" name="codMaxAmount" rules={[{ required: true }]} extra="Đơn có tổng tiền vượt mức này không được chọn COD.">
              <InputNumber min={0} step={50000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Phí giao (đ, đã gồm thuế)" name="shippingFee" rules={[{ required: true }]}>
              <InputNumber min={0} step={5000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Miễn phí giao từ tiền hàng (đ)" name="freeShippingThreshold" rules={[{ required: true }]}>
              <InputNumber min={0} step={50000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Giờ chốt đơn trong ngày" name="cutoffTime" rules={[{ required: true }]} extra="Sau giờ này, khung giờ giao hôm nay không còn nhận đơn.">
              <TimePicker format={HM} minuteStep={5} allowClear={false} needConfirm={false} />
            </Form.Item>

            <Typography.Title level={5}>Khung giờ giao</Typography.Title>
            <Form.List name="slots" rules={[{ validator: async (_, v: SlotRange[]) => (v && v.length > 0 ? undefined : Promise.reject(new Error("Cần ít nhất một khung giờ"))) }]}>
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline" style={{ display: "flex" }}>
                      <Form.Item {...field} rules={[{ required: true, message: "Chọn giờ bắt đầu và kết thúc" }]}>
                        <TimePicker.RangePicker format={HM} minuteStep={15} allowClear={false} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Form.Item>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add([toDayjs("08:00"), toDayjs("11:00")])}>
                      Thêm khung giờ
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Typography.Title level={5}>Giữ chỗ và thuế</Typography.Title>
            <Form.Item label="Thời hạn giữ chỗ (phút)" name="reservationMinutes" rules={[{ required: true }]} extra="Đơn trả trước quá hạn chưa thanh toán sẽ tự hủy và nhả hàng.">
              <InputNumber min={1} max={120} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Thuế GTGT bán lẻ (%)" name="retailVatPercent" rules={[{ required: true }]} extra="Thuế đã nằm trong giá niêm yết; hệ thống chỉ tách ra để hiển thị.">
              <InputNumber min={0} max={100} step={0.5} style={{ width: "100%" }} />
            </Form.Item>

            {canEdit && (
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Lưu cấu hình
                </Button>
                <Button onClick={() => form.setFieldsValue(toFormValues(current))}>Hoàn tác</Button>
              </Space>
            )}
            <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
              Hiện tại: COD tối đa {vnd(current.codMaxAmount)}, cước {vnd(current.shippingFee)}, miễn cước từ {vnd(current.freeShippingThreshold)}.
            </Typography.Paragraph>
          </Form>
        </>
      )}
    </Card>
  );
}
