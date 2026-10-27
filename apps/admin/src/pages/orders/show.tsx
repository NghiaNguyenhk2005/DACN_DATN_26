import { useState } from "react";
import { Show } from "@refinedev/antd";
import { useInvalidate, useShow } from "@refinedev/core";
import { useParams } from "react-router";
import { Alert, App, Button, Card, Descriptions, Flex, Input, Modal, Steps, Table, Tag, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import type { Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { EVENT_SOURCE_LABELS, nextOrderStep, ORDER_STATUS, ORDER_STEPS } from "../../lib/labels";
import { unwrap } from "../../lib/problem";

type OrderDetail = Schema<"OrderDetail">;
type OrderItem = Schema<"OrderItem">;

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}₫`;
const fmtTime = (v: string) => dayjs(v).format("HH:mm DD/MM/YYYY");

export function OrderShow() {
  const { id = "" } = useParams();
  const { query, result: order } = useShow<OrderDetail>({ resource: "orders", id });
  const invalidate = useInvalidate();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const next = order ? nextOrderStep(order.status) : null;

  const advance = async () => {
    setBusy(true);
    try {
      const trimmed = note.trim();
      const updated = await unwrap(
        api.POST("/admin/orders/{orderId}/advance", {
          params: { path: { orderId: id } },
          body: trimmed ? { note: trimmed } : {},
        }),
        "Chưa chuyển được bước, vui lòng thử lại.",
      );
      message.success(`Đơn đã chuyển sang: ${ORDER_STATUS[updated.status].label}.`);
      setOpen(false);
      setNote("");
    } catch (e) {
      message.error((e as { message: string }).message);
    } finally {
      setBusy(false);
      await invalidate({ resource: "orders", invalidates: ["list", "detail"], id });
    }
  };

  const stepIndex = order ? ORDER_STEPS.reduce((last, s, i) => (order.timeline.some((e) => e.toStatus === s) ? i : last), 0) : 0;
  const branch = order && !(ORDER_STEPS as readonly string[]).includes(order.status);

  return (
    <Show
      title={order ? `Đơn ${order.orderCode}` : "Đơn hàng"}
      isLoading={query.isLoading}
      canEdit={false}
      canDelete={false}
      headerButtons={() =>
        next && (
          <Button type="primary" onClick={() => setOpen(true)}>
            Chuyển sang: {ORDER_STATUS[next].label}
          </Button>
        )
      }
    >
      {query.isError && <Alert type="error" showIcon message={query.error?.message} />}
      {order && (
        <Flex vertical gap={16}>
          {branch && (
            <Alert type="warning" showIcon message={`Đơn đang ở nhánh: ${ORDER_STATUS[order.status].label}`} />
          )}
          {order.status === "placed" && (
            <Alert type="info" showIcon message="Đơn trả trước chưa thanh toán: chờ khách thanh toán hoặc hết 15 phút giữ chỗ." />
          )}
          <Card size="small">
            <Steps
              size="small"
              direction="vertical"
              current={stepIndex}
              status={branch ? "error" : order.status === "completed" ? "finish" : "process"}
              items={ORDER_STEPS.map((s) => {
                const event = order.timeline.filter((e) => e.toStatus === s).at(-1);
                return {
                  title: ORDER_STATUS[s].label,
                  description: event ? fmtTime(event.occurredAt) : undefined,
                };
              })}
            />
          </Card>

          <Descriptions size="small" column={{ xs: 1, md: 2 }} bordered>
            <Descriptions.Item label="Trạng thái">
              <Tag color={ORDER_STATUS[order.status].color}>{ORDER_STATUS[order.status].label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Đặt lúc">{fmtTime(order.placedAt)}</Descriptions.Item>
            <Descriptions.Item label="Thanh toán">
              {order.paymentOption === "cod" ? "Tiền mặt khi nhận (COD)" : "Trả trước"}
            </Descriptions.Item>
            <Descriptions.Item label="Giao">
              {dayjs(order.deliveryDate).format("DD/MM/YYYY")} · {order.deliverySlot}
            </Descriptions.Item>
            <Descriptions.Item label="Người nhận">
              {order.address.recipientName} · {order.address.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {order.address.addressLine}, {order.address.ward}, {order.address.province}
            </Descriptions.Item>
          </Descriptions>

          <Card size="small" title={`Hàng trong đơn (${order.items.length})`}>
            <Table<OrderItem>
              dataSource={order.items}
              rowKey={(i) => `${i.batchCode}-${i.productName}`}
              pagination={false}
              size="small"
              scroll={{ x: 560 }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    Tổng (gồm phí giao {vnd(order.shippingFee)})
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Typography.Text strong>{vnd(order.totalAmount)}</Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            >
              <Table.Column<OrderItem> dataIndex="productName" title="Sản phẩm" />
              <Table.Column<OrderItem> dataIndex="batchCode" title="Lô" width={140} />
              <Table.Column<OrderItem>
                title="Số lượng"
                width={110}
                render={(_, i) => `${i.quantity.toLocaleString("vi-VN")} ${i.saleUnit ?? ""}`}
              />
              <Table.Column<OrderItem> dataIndex="lineTotal" title="Thành tiền" width={120} align="right" render={vnd} />
            </Table>
          </Card>

          <Card size="small" title="Nhật ký trạng thái">
            <Timeline
              items={order.timeline.map((e) => ({
                children: (
                  <Flex vertical gap={2}>
                    <Typography.Text strong>{ORDER_STATUS[e.toStatus].label}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {fmtTime(e.occurredAt)} · {EVENT_SOURCE_LABELS[e.source]}
                    </Typography.Text>
                    {e.note && <Typography.Text>{e.note}</Typography.Text>}
                  </Flex>
                ),
              }))}
            />
          </Card>
        </Flex>
      )}

      <Modal
        title={next ? `Chuyển đơn sang: ${ORDER_STATUS[next].label}` : ""}
        open={open}
        okText="Chuyển bước"
        cancelText="Huỷ"
        okButtonProps={{ loading: busy }}
        onOk={advance}
        onCancel={() => setOpen(false)}
      >
        <Typography.Paragraph type="secondary">Ghi chú (không bắt buộc) hiện trên nhật ký trạng thái của đơn.</Typography.Paragraph>
        <Input.TextArea rows={3} maxLength={500} showCount value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </Show>
  );
}
