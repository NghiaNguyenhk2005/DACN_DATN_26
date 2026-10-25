import { useCallback, useEffect, useMemo, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Input, Space, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { describeError, LOCATION_LABELS, MOVEMENT_LABELS, OWNER_LABELS, SOURCE_LABELS } from "./labels";

type Holding = Schema<"StockHolding">;
type Movement = Schema<"StockMovement">;

const REFRESH_MS = 5000;
const fmtQty = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
const fmtTime = (iso: string) => new Date(iso).toLocaleString("vi-VN");

function MovementTable({ movements }: { movements: Movement[] | undefined }) {
  if (!movements) return <Typography.Text type="secondary">Đang tải sổ nhập xuất…</Typography.Text>;
  if (movements.length === 0) return <Empty description="Chưa có biến động" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  return (
    <Table<Movement>
      size="small"
      rowKey="id"
      pagination={false}
      dataSource={movements}
      columns={[
        { title: "Thời điểm", dataIndex: "createdAt", render: fmtTime, width: 170 },
        { title: "Loại", dataIndex: "movementType", render: (t: Movement["movementType"]) => MOVEMENT_LABELS[t] },
        {
          title: "Số lượng",
          dataIndex: "quantity",
          align: "right",
          render: (q: number) => <Typography.Text type={q < 0 ? "danger" : "success"}>{q > 0 ? `+${fmtQty(q)}` : fmtQty(q)}</Typography.Text>,
        },
        { title: "Nguồn", render: (_: unknown, m: Movement) => `${SOURCE_LABELS[m.sourceType] ?? m.sourceType} #${m.sourceId}` },
        { title: "Lý do", dataIndex: "reason", render: (r: string | null | undefined) => r ?? "—" },
      ]}
    />
  );
}

export function InventoryPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [movements, setMovements] = useState<Record<string, Movement[]>>({});
  const [expanded, setExpanded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [auto, setAuto] = useState(true);
  const [search, setSearch] = useState("");

  const loadMovements = useCallback(async (holdingId: string) => {
    const { data, error: err } = await api.GET("/admin/inventory/holdings/{holdingId}/movements", {
      params: { path: { holdingId } },
    });
    if (data) setMovements((m) => ({ ...m, [holdingId]: data }));
    else if (err) setError(describeError(err));
  }, []);

  // Đọc dòng tồn rồi mới đặt state ở callback, để dùng được cả trong effect lẫn nút làm mới.
  const refresh = useCallback(() => {
    return api
      .GET("/admin/inventory/holdings")
      .then(({ data, error: err }) => {
        if (data) {
          setHoldings(data);
          setError(null);
        } else {
          setError(describeError(err));
        }
      })
      .catch((e: unknown) => setError(describeError(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Tự làm mới để thấy tồn giảm ngay sau khi khách đặt hàng (kịch bản demo bước 6).
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      void refresh();
      expanded.forEach((id) => void loadMovements(id));
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [auto, expanded, refresh, loadMovements]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? holdings.filter((h) => `${h.productName} ${h.batchCode}`.toLowerCase().includes(q)) : holdings;
  }, [holdings, search]);

  const columns: ColumnsType<Holding> = [
    { title: "Lô", dataIndex: "batchCode", render: (c: string) => <Typography.Text code>{c}</Typography.Text> },
    { title: "Sản phẩm", dataIndex: "productName" },
    {
      title: "Chủ / vị trí",
      render: (_: unknown, h: Holding) => (
        <Space size={4} wrap>
          <Tag>{OWNER_LABELS[h.ownerType]}</Tag>
          <Tag>{LOCATION_LABELS[h.locationType]}</Tag>
        </Space>
      ),
    },
    { title: "Tồn thực", dataIndex: "qtyOnHand", align: "right", render: (n: number, h) => `${fmtQty(n)} ${h.saleUnit}` },
    { title: "Đang giữ chỗ", dataIndex: "qtyReserved", align: "right", render: (n: number) => fmtQty(n) },
    {
      title: "Còn bán được",
      align: "right",
      render: (_: unknown, h: Holding) => <strong>{h.isLocked ? 0 : fmtQty(h.qtyOnHand - h.qtyReserved)}</strong>,
    },
    { title: "Trạng thái", render: (_: unknown, h: Holding) => (h.isLocked ? <Tag color="error">Đã khóa</Tag> : <Tag color="success">Đang bán</Tag>) },
  ];

  return (
    <Card
      title="Kho — dòng tồn theo lô"
      extra={
        <Space wrap>
          <Input.Search allowClear placeholder="Tìm sản phẩm hoặc mã lô" onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          <Space size={6}>
            <Switch size="small" checked={auto} onChange={setAuto} />
            <span>Tự làm mới 5 giây</span>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
            Làm mới
          </Button>
        </Space>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Typography.Paragraph type="secondary">
        Còn bán được = tồn thực − đang giữ chỗ. Bấm dấu mũi tên ở đầu dòng để xem sổ nhập xuất của lô, mới nhất trước.
      </Typography.Paragraph>
      <Table<Holding>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ x: "max-content" }}
        expandable={{
          expandedRowKeys: expanded,
          onExpand: (isOpen, h) => {
            setExpanded((keys) => (isOpen ? [...keys, h.id] : keys.filter((k) => k !== h.id)));
            if (isOpen) void loadMovements(h.id);
          },
          expandedRowRender: (h) => <MovementTable movements={movements[h.id]} />,
        }}
      />
    </Card>
  );
}
