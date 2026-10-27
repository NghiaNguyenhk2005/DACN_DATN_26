import { useEffect, useState } from "react";
import { Card, Tag, Typography } from "antd";
import type { Schema } from "@farmery/contract";
import { api } from "../../lib/api";

export function DashboardPage() {
  const [health, setHealth] = useState<Schema<"Health"> | null | undefined>(undefined);

  useEffect(() => {
    api
      .GET("/health")
      .then(({ data }) => setHealth(data ?? null))
      .catch(() => setHealth(null));
  }, []);

  return (
    <Card title="Tổng quan">
      <Typography.Paragraph>Ứng dụng nội bộ Farmery — chọn mục trong menu theo vai trò của bạn. Màn Kho, Cấu hình sẽ thêm sau.</Typography.Paragraph>
      {health === undefined && <Tag>API: đang kiểm tra…</Tag>}
      {health === null && <Tag color="error">API: chưa chạy</Tag>}
      {health && <Tag color="success">API: {health.status}</Tag>}
    </Card>
  );
}
