import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Button, Card, Flex, List, Popconfirm, Space, Tag, Typography, theme } from "antd";
import type { Check } from "./review-checks";

export function ChecklistCard({ checks }: { checks: Check[] }) {
  if (checks.length === 0) return null;
  return (
    <Card size="small" title="Đối chiếu (tự tính, để tham khảo)">
      <List
        size="small"
        dataSource={checks}
        renderItem={(c) => (
          <List.Item>
            <Space>
              {c.ok ? <CheckCircleFilled style={{ color: "#2f7a48" }} /> : <CloseCircleFilled style={{ color: "#b42318" }} />}
              <Typography.Text>{c.label}</Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
}

/**
 * Thanh quyết định dính đáy vùng nội dung: người duyệt đọc từ trên xuống rồi quyết định ở cuối, không phải cuộn lên
 * header. Việc đã có quyết định thì thanh chỉ còn dòng trạng thái.
 */
export function DecisionBar({
  checks,
  pending,
  busy,
  isBatch,
  decidedLabel,
  onApprove,
  onReject,
}: {
  checks: Check[];
  pending: boolean;
  busy: "approve" | "reject" | null;
  isBatch: boolean;
  decidedLabel: React.ReactNode;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { token } = theme.useToken();
  const passed = checks.filter((c) => c.ok).length;
  return (
    <div
      role="region"
      aria-label="Quyết định duyệt"
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        margin: "8px -24px -24px",
        padding: "12px 24px",
        background: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {pending ? (
        <Flex wrap gap={12} align="center" justify="space-between">
          <Typography.Text type="secondary">
            {checks.length > 0 ? (
              <>
                Đối chiếu: <Tag color={passed === checks.length ? "green" : "gold"}>{`${passed}/${checks.length} mục đạt`}</Tag>
              </>
            ) : (
              "Xem hết nội dung phía trên trước khi quyết định."
            )}
          </Typography.Text>
          <Space wrap>
            <Button danger disabled={busy !== null} onClick={onReject}>
              Từ chối
            </Button>
            <Popconfirm
              title="Duyệt việc này?"
              description={isBatch ? "Lô sẽ mở bán và có mã QR truy xuất công khai." : undefined}
              okText="Duyệt"
              cancelText="Hủy"
              onConfirm={onApprove}
            >
              <Button type="primary" loading={busy === "approve"} disabled={busy !== null}>
                Duyệt
              </Button>
            </Popconfirm>
          </Space>
        </Flex>
      ) : (
        <Typography.Text>Đã có quyết định: {decidedLabel}</Typography.Text>
      )}
    </div>
  );
}
