import { useState } from "react";
import { Show } from "@refinedev/antd";
import { useInvalidate, useShow } from "@refinedev/core";
import { useParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Image,
  Input,
  List as AntList,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import type { Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { ACTIVITY_LABELS, CERT_LABELS, REVIEW_STATUS, TASK_STATUS, TASK_TYPE_LABELS } from "../../lib/labels";
import { unwrap } from "../../lib/problem";

type ReviewTaskDetail = Schema<"ReviewTaskDetail">;
type BatchReview = NonNullable<ReviewTaskDetail["batch"]>;

const fmtDate = (v: string) => dayjs(v).format("DD/MM/YYYY");
const fmtTime = (v: string) => dayjs(v).format("HH:mm DD/MM/YYYY");

export function ReviewTaskShow() {
  const { id = "" } = useParams();
  const { query, result: task } = useShow<ReviewTaskDetail>({ resource: "review-tasks", id });
  const invalidate = useInvalidate();
  const { message } = App.useApp();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const decide = async (kind: "approve" | "reject") => {
    setBusy(kind);
    try {
      if (kind === "approve") {
        await unwrap(
          api.POST("/admin/review-tasks/{taskId}/approve", { params: { path: { taskId: id } } }),
          "Chưa duyệt được, vui lòng thử lại.",
        );
        message.success("Đã duyệt.");
      } else {
        await unwrap(
          api.POST("/admin/review-tasks/{taskId}/reject", {
            params: { path: { taskId: id } },
            body: { reason: reason.trim() },
          }),
          "Chưa từ chối được, vui lòng thử lại.",
        );
        message.success("Đã từ chối, lý do được gửi cho nhà cung cấp.");
        setRejectOpen(false);
        setReason("");
      }
    } catch (e) {
      message.error((e as { message: string }).message);
    } finally {
      setBusy(null);
      await invalidate({ resource: "review-tasks", invalidates: ["list", "detail"], id });
    }
  };

  const pending = task?.status === "open" || task?.status === "in_review";
  const reasonValid = reason.trim().length >= 5;

  return (
    <Show
      title={task?.title ?? "Việc duyệt"}
      isLoading={query.isLoading}
      canEdit={false}
      canDelete={false}
      headerButtons={() =>
        pending && (
          <Space wrap>
            <Popconfirm
              title="Duyệt việc này?"
              description={task?.taskType === "batch" ? "Lô sẽ mở bán và có mã QR truy xuất công khai." : undefined}
              okText="Duyệt"
              cancelText="Huỷ"
              onConfirm={() => decide("approve")}
            >
              <Button type="primary" loading={busy === "approve"} disabled={busy !== null}>
                Duyệt
              </Button>
            </Popconfirm>
            <Button danger disabled={busy !== null} onClick={() => setRejectOpen(true)}>
              Từ chối
            </Button>
          </Space>
        )
      }
    >
      {query.isError && <Alert type="error" showIcon message={query.error?.message} />}
      {task && (
        <Flex vertical gap={16}>
          <Descriptions size="small" column={{ xs: 1, md: 2 }} bordered>
            <Descriptions.Item label="Loại">{TASK_TYPE_LABELS[task.taskType]}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={TASK_STATUS[task.status].color}>{TASK_STATUS[task.status].label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tạo lúc">{fmtTime(task.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Hạn xử lý">{task.dueAt ? fmtTime(task.dueAt) : "—"}</Descriptions.Item>
            {task.decidedAt && <Descriptions.Item label="Quyết định lúc">{fmtTime(task.decidedAt)}</Descriptions.Item>}
            {task.decisionReason && (
              <Descriptions.Item label="Lý do từ chối">{task.decisionReason}</Descriptions.Item>
            )}
          </Descriptions>

          {task.batch ? (
            <BatchSection review={task.batch} />
          ) : (
            <Alert type="info" showIcon message="Màn hình chưa hiển thị chi tiết cho loại việc duyệt này." />
          )}
        </Flex>
      )}

      <Modal
        title="Từ chối việc duyệt"
        open={rejectOpen}
        okText="Từ chối"
        cancelText="Huỷ"
        okButtonProps={{ danger: true, disabled: !reasonValid, loading: busy === "reject" }}
        onOk={() => decide("reject")}
        onCancel={() => setRejectOpen(false)}
      >
        <Typography.Paragraph type="secondary">Lý do được gửi cho nhà cung cấp (5–1000 ký tự).</Typography.Paragraph>
        <Input.TextArea
          rows={4}
          maxLength={1000}
          showCount
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ví dụ: Nhật ký thiếu lần phun thuốc ngày 10/10, đề nghị bổ sung."
        />
      </Modal>
    </Show>
  );
}

function BatchSection({ review }: { review: BatchReview }) {
  const { batch, supplier, logs, certifications } = review;
  const sortedLogs = [...logs].sort((a, b) => a.activityDate.localeCompare(b.activityDate));

  return (
    <Flex vertical gap={16}>
      {batch.status === "approved" && batch.traceUrl && batch.traceCode && (
        <TraceQrCard traceUrl={batch.traceUrl} traceCode={batch.traceCode} />
      )}

      <Card title="Lô hàng" size="small">
        <Descriptions size="small" column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="Mã lô">{batch.batchCode}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái lô">
            <Tag color={REVIEW_STATUS[batch.status].color}>{REVIEW_STATUS[batch.status].label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">{batch.productName}</Descriptions.Item>
          <Descriptions.Item label="Sản lượng khai báo">{batch.declaredQuantity.toLocaleString("vi-VN")}</Descriptions.Item>
          <Descriptions.Item label="Ngày thu hoạch">{fmtDate(batch.harvestDate)}</Descriptions.Item>
          <Descriptions.Item label="Hạn dùng">{fmtDate(batch.bestBefore)}</Descriptions.Item>
          <Descriptions.Item label="Nhà cung cấp">{supplier.displayName}</Descriptions.Item>
          <Descriptions.Item label="Vùng trồng">{supplier.growingRegion}</Descriptions.Item>
          {batch.recalledAt && (
            <Descriptions.Item label="Thu hồi lúc">
              <Typography.Text type="danger">{fmtTime(batch.recalledAt)}</Typography.Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="Chứng nhận của nhà cung cấp" size="small">
        <AntList
          dataSource={certifications}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có chứng nhận" /> }}
          renderItem={(c) => (
            <AntList.Item>
              <AntList.Item.Meta
                title={
                  <Space wrap>
                    {CERT_LABELS[c.type]}
                    {c.valid ? <Tag color="green">Còn hiệu lực</Tag> : <Tag color="red">Hết hiệu lực</Tag>}
                  </Space>
                }
                description={`Số ${c.certificateNumber} · ${c.issuingAuthority} · ${fmtDate(c.issuedDate)} – ${fmtDate(c.expiryDate)}`}
              />
            </AntList.Item>
          )}
        />
      </Card>

      <Card title={`Nhật ký canh tác (${logs.length})`} size="small">
        {sortedLogs.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Lô chưa có nhật ký" />
        ) : (
          <Timeline
            items={sortedLogs.map((log) => ({
              color: log.superseded ? "gray" : log.supersedesId ? "orange" : "green",
              children: (
                <Flex vertical gap={4}>
                  <Space wrap size={6}>
                    <Typography.Text strong delete={log.superseded}>
                      {fmtDate(log.activityDate)} · {ACTIVITY_LABELS[log.activity]}
                    </Typography.Text>
                    {log.superseded && <Tag>Đã được đính chính</Tag>}
                    {log.supersedesId && <Tag color="orange">Bản đính chính</Tag>}
                  </Space>
                  {log.description && (
                    <Typography.Text type={log.superseded ? "secondary" : undefined}>{log.description}</Typography.Text>
                  )}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {log.enteredBy.displayName}
                    {log.enteredBy.onBehalf ? " (nhập hộ)" : ""} · ghi lúc {fmtTime(log.createdAt)}
                  </Typography.Text>
                  {log.imageUrls.length > 0 && (
                    <Image.PreviewGroup>
                      <Space wrap>
                        {log.imageUrls.map((url) => (
                          <Image key={url} src={url} width={72} height={72} style={{ objectFit: "cover", borderRadius: 6 }} />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  )}
                </Flex>
              ),
            }))}
          />
        )}
      </Card>
    </Flex>
  );
}

function TraceQrCard({ traceUrl, traceCode }: { traceUrl: string; traceCode: string }) {
  return (
    <Card size="small" title="Mã QR truy xuất">
      <Flex wrap gap={24} align="center">
        <QRCodeSVG value={traceUrl} size={168} marginSize={2} />
        <Flex vertical gap={8}>
          <Typography.Text>
            Mã truy xuất: <Typography.Text strong copyable>{traceCode}</Typography.Text>
          </Typography.Text>
          <Typography.Link href={traceUrl} target="_blank" rel="noreferrer">
            Mở trang truy xuất
          </Typography.Link>
          <Typography.Text type="secondary" style={{ fontSize: 12, wordBreak: "break-all" }}>
            {traceUrl}
          </Typography.Text>
        </Flex>
      </Flex>
    </Card>
  );
}
