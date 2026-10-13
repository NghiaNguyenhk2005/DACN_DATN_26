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
      <Typography.Paragraph>Khung ứng dụng nội bộ — các màn Kiểm duyệt, Vận hành, Kho, Cấu hình sẽ thêm vào menu.</Typography.Paragraph>
      {health === undefined && <Tag>API: đang kiểm tra…</Tag>}
      {health === null && <Tag color="error">API: chưa chạy</Tag>}
      {health && <Tag color="success">API: {health.status}</Tag>}
    </Card>
  );
}
