import { useEffect, useState } from "react";
import { usePermissions } from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Alert, Button, Card, Col, Empty, Flex, List, Row, Skeleton, Statistic, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { RoleCode, Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { TASK_STATUS, TASK_TYPE_LABELS } from "../../lib/labels";
import { unwrap } from "../../lib/problem";

type ReviewTask = Schema<"ReviewTask">;

const PENDING_STATUSES = ["open", "in_review"] as const;
const MAX_PAGES = 20;

// Hợp đồng chỉ có phân trang cursor, không trả tổng nên đọc hết các trang để đếm.
async function fetchPendingTasks(): Promise<ReviewTask[]> {
  const all: ReviewTask[] = [];
  for (const status of PENDING_STATUSES) {
    let cursor: string | undefined;
    for (let i = 0; i < MAX_PAGES; i++) {
      const page = await unwrap(
        api.GET("/admin/review-tasks", { params: { query: { status, cursor, limit: 100 } } }),
        "Không tải được hàng đợi duyệt.",
      );
      all.push(...page.items);
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
  }
  return all;
}

const isOverdue = (t: ReviewTask) => !!t.dueAt && dayjs(t.dueAt).isBefore(dayjs());

export function DashboardPage() {
  const { data: roles } = usePermissions<RoleCode[]>({});
  const [health, setHealth] = useState<Schema<"Health"> | null | undefined>(undefined);

  useEffect(() => {
    api
      .GET("/health")
      .then(({ data }) => setHealth(data ?? null))
      .catch(() => setHealth(null));
  }, []);

  return (
    <Flex vertical gap={16}>
      <Card title="Tổng quan">
        <Typography.Paragraph>Ứng dụng nội bộ Farmery — chọn mục trong menu theo vai trò của bạn.</Typography.Paragraph>
        {health === undefined && <Tag>API: đang kiểm tra…</Tag>}
        {health === null && <Tag color="error">API: chưa chạy</Tag>}
        {health && <Tag color="success">API: {health.status}</Tag>}
      </Card>
      {roles?.includes("staff_moderation") && <ModerationSummary />}
    </Flex>
  );
}

function ModerationSummary() {
  const { data: tasks, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", "review-tasks", "pending"],
    queryFn: fetchPendingTasks,
  });

  const overdue = tasks?.filter(isOverdue) ?? [];
  const byType = Object.entries(
    (tasks ?? []).reduce<Partial<Record<ReviewTask["taskType"], number>>>((acc, t) => {
      acc[t.taskType] = (acc[t.taskType] ?? 0) + 1;
      return acc;
    }, {}),
  ) as [ReviewTask["taskType"], number][];
  const upcoming = [...(tasks ?? [])]
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"))
    .slice(0, 5);

  return (
    <Card
      title="Kiểm duyệt"
      extra={
        <Link to="/kiem-duyet">
          <Button type="link">Mở hàng đợi</Button>
        </Link>
      }
    >
      {isError && <Alert type="error" showIcon message={(error as { message?: string })?.message} />}
      {isLoading ? (
        <Skeleton active />
      ) : (
        tasks && (
          <Flex vertical gap={16}>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Statistic title="Chờ duyệt" value={tasks.length} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Quá hạn"
                  value={overdue.length}
                  valueStyle={overdue.length > 0 ? { color: "#cf1322" } : undefined}
                />
              </Col>
            </Row>
            {byType.length > 0 && (
              <Flex wrap gap={8}>
                {byType.map(([type, count]) => (
                  <Tag key={type}>
                    {TASK_TYPE_LABELS[type]}: {count}
                  </Tag>
                ))}
              </Flex>
            )}
            <List
              header={<Typography.Text strong>Gần hạn nhất</Typography.Text>}
              dataSource={upcoming}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không còn việc chờ duyệt" /> }}
              renderItem={(t) => (
                <List.Item>
                  <Flex wrap justify="space-between" gap={8} style={{ width: "100%" }}>
                    <Link to={`/kiem-duyet/${t.id}`}>{t.title}</Link>
                    <Flex gap={8}>
                      <Tag color={TASK_STATUS[t.status].color}>{TASK_STATUS[t.status].label}</Tag>
                      <Typography.Text type={isOverdue(t) ? "danger" : "secondary"}>
                        {t.dueAt ? dayjs(t.dueAt).format("HH:mm DD/MM") : "—"}
                      </Typography.Text>
                    </Flex>
                  </Flex>
                </List.Item>
              )}
            />
          </Flex>
        )
      )}
    </Card>
  );
}
