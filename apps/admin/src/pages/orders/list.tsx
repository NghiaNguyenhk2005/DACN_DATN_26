import { List, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Link } from "react-router";
import { Flex, Select, Table, Tag } from "antd";
import dayjs from "dayjs";
import type { Schema } from "@farmery/contract";
import { ORDER_STATUS } from "../../lib/labels";

type OrderSummary = Schema<"OrderSummary">;

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}₫`;

function filterValue(filters: CrudFilter[], field: string): string | undefined {
  const f = filters.find((x) => "field" in x && x.field === field);
  return f?.value as string | undefined;
}

export function OrderList() {
  const { tableProps, filters, setFilters } = useTable<OrderSummary>({
    resource: "orders",
    pagination: { pageSize: 20 },
    sorters: { mode: "off" },
    syncWithLocation: true,
  });

  return (
    <List title="Vận hành đơn">
      <Flex wrap gap={8} style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ minWidth: 220 }}
          value={filterValue(filters, "status")}
          onChange={(value) => setFilters([{ field: "status", operator: "eq", value }], "merge")}
          options={Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label }))}
        />
      </Flex>
      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: 760 }}
        pagination={tableProps.pagination && { ...tableProps.pagination, simple: true, showSizeChanger: false }}
      >
        <Table.Column<OrderSummary>
          dataIndex="orderCode"
          title="Mã đơn"
          render={(code: string, row) => <Link to={`/van-hanh/${row.id}`}>{code}</Link>}
        />
        <Table.Column<OrderSummary> dataIndex="buyerName" title="Khách" render={(v?: string) => v ?? "—"} />
        <Table.Column<OrderSummary>
          dataIndex="status"
          title="Trạng thái"
          width={200}
          render={(s: OrderSummary["status"]) => <Tag color={ORDER_STATUS[s].color}>{ORDER_STATUS[s].label}</Tag>}
        />
        <Table.Column<OrderSummary> dataIndex="itemCount" title="Số món" width={90} align="right" />
        <Table.Column<OrderSummary>
          dataIndex="totalAmount"
          title="Tổng tiền"
          width={130}
          align="right"
          render={(v: number) => vnd(v)}
        />
        <Table.Column<OrderSummary>
          dataIndex="placedAt"
          title="Đặt lúc"
          width={150}
          render={(v: string) => dayjs(v).format("HH:mm DD/MM/YYYY")}
        />
      </Table>
    </List>
  );
}
