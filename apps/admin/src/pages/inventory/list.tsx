import { useState } from "react";
import { List } from "@refinedev/antd";
import { useQuery } from "@tanstack/react-query";
import { Alert, Empty, Flex, Input, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { Schema } from "@farmery/contract";
import { api } from "../../lib/api";
import { HOLDING_LOCATION_LABELS, HOLDING_OWNER_LABELS, MOVEMENT_LABELS } from "../../lib/labels";
import { unwrap } from "../../lib/problem";

type StockHolding = Schema<"StockHolding">;
type StockMovement = Schema<"StockMovement">;

const qty = (n: number) => n.toLocaleString("vi-VN");

export function InventoryList() {
  const [batchId, setBatchId] = useState<string>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["inventory", "holdings", batchId],
    queryFn: () =>
      unwrap(
        api.GET("/admin/inventory/holdings", { params: { query: { batchId } } }),
        "Không tải được tồn kho.",
      ),
  });

  return (
    <List title="Tồn kho theo lô">
      <Flex wrap gap={8} style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Lọc theo mã định danh lô (batchId)"
          style={{ maxWidth: 320 }}
          onSearch={(v) => setBatchId(v.trim() || undefined)}
        />
      </Flex>
      {isError && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={(error as { message?: string }).message} />}
      <Table<StockHolding>
        dataSource={data}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 20, simple: true, showSizeChanger: false }}
        expandable={{ expandedRowRender: (row) => <Movements holdingId={row.id} saleUnit={row.saleUnit} /> }}
      >
        <Table.Column<StockHolding> dataIndex="batchCode" title="Mã lô" />
        <Table.Column<StockHolding> dataIndex="productName" title="Sản phẩm" />
        <Table.Column<StockHolding>
          dataIndex="ownerType"
          title="Sở hữu"
          width={130}
          render={(v: StockHolding["ownerType"]) => HOLDING_OWNER_LABELS[v]}
        />
        <Table.Column<StockHolding>
          dataIndex="locationType"
          title="Vị trí"
          width={130}
          render={(v: StockHolding["locationType"]) => HOLDING_LOCATION_LABELS[v]}
        />
        <Table.Column<StockHolding>
          title="Tồn"
          width={110}
          align="right"
          render={(_, row) => `${qty(row.qtyOnHand)} ${row.saleUnit}`}
        />
        <Table.Column<StockHolding>
          title="Đang giữ chỗ"
          width={120}
          align="right"
          render={(_, row) => qty(row.qtyReserved)}
        />
        <Table.Column<StockHolding>
          title="Còn bán được"
          width={120}
          align="right"
          render={(_, row) => (row.isLocked ? 0 : qty(Math.max(0, row.qtyOnHand - row.qtyReserved)))}
        />
        <Table.Column<StockHolding>
          dataIndex="isLocked"
          title="Khoá"
          width={90}
          render={(locked: boolean) => (locked ? <Tag color="red">Đã khoá</Tag> : <Tag>Mở</Tag>)}
        />
      </Table>
    </List>
  );
}

function Movements({ holdingId, saleUnit }: { holdingId: string; saleUnit: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["inventory", "movements", holdingId],
    queryFn: () =>
      unwrap(
        api.GET("/admin/inventory/holdings/{holdingId}/movements", { params: { path: { holdingId } } }),
        "Không tải được sổ nhập xuất.",
      ),
  });

  if (isError) return <Alert type="warning" showIcon message={(error as { message?: string }).message} />;
  return (
    <Table<StockMovement>
      size="small"
      dataSource={data}
      loading={isLoading}
      rowKey="id"
      pagination={false}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có biến động" /> }}
    >
      <Table.Column<StockMovement>
        dataIndex="createdAt"
        title="Thời điểm"
        width={150}
        render={(v: string) => dayjs(v).format("HH:mm DD/MM/YYYY")}
      />
      <Table.Column<StockMovement>
        dataIndex="movementType"
        title="Loại"
        width={150}
        render={(v: StockMovement["movementType"]) => MOVEMENT_LABELS[v]}
      />
      <Table.Column<StockMovement>
        dataIndex="quantity"
        title="Số lượng"
        width={120}
        align="right"
        render={(n: number) => (
          <Typography.Text type={n < 0 ? "danger" : "success"}>
            {n > 0 ? "+" : ""}
            {qty(n)} {saleUnit}
          </Typography.Text>
        )}
      />
      <Table.Column<StockMovement>
        title="Chứng từ"
        render={(_, m) => `${m.sourceType} #${m.sourceId}`}
      />
      <Table.Column<StockMovement> dataIndex="reason" title="Lý do" render={(v?: string | null) => v ?? "—"} />
    </Table>
  );
}
