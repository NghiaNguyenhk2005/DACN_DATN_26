import { List, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Link } from "react-router";
import { Flex, Select, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { Schema } from "@farmery/contract";
import { TASK_STATUS, TASK_TYPE_LABELS } from "../../lib/labels";

type ReviewTask = Schema<"ReviewTask">;

function filterValue(filters: CrudFilter[], field: string): string | undefined {
  const f = filters.find((x) => "field" in x && x.field === field);
  return f?.value as string | undefined;
}

export function ReviewTaskList() {
  const { tableProps, filters, setFilters } = useTable<ReviewTask>({
    resource: "review-tasks",
    pagination: { pageSize: 20 },
    filters: { initial: [{ field: "status", operator: "eq", value: "open" }] },
    sorters: { mode: "off" },
    syncWithLocation: true,
  });

  const setFilter = (field: string, value: string | undefined) =>
    setFilters([{ field, operator: "eq", value }], "merge");

  return (
    <List title="Hàng đợi duyệt">
      <Flex wrap gap={8} style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ minWidth: 160 }}
          value={filterValue(filters, "status")}
          onChange={(v) => setFilter("status", v)}
          options={Object.entries(TASK_STATUS).map(([value, s]) => ({ value, label: s.label }))}
        />
        <Select
          allowClear
          placeholder="Loại việc"
          style={{ minWidth: 180 }}
          value={filterValue(filters, "type")}
          onChange={(v) => setFilter("type", v)}
          options={Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Flex>
      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: 720 }}
        pagination={tableProps.pagination && { ...tableProps.pagination, simple: true, showSizeChanger: false }}
      >
        <Table.Column<ReviewTask>
          dataIndex="title"
          title="Việc duyệt"
          render={(title: string, row) => <Link to={`/kiem-duyet/${row.id}`}>{title}</Link>}
        />
        <Table.Column<ReviewTask>
          dataIndex="taskType"
          title="Loại"
          width={160}
          render={(t: ReviewTask["taskType"]) => TASK_TYPE_LABELS[t]}
        />
        <Table.Column<ReviewTask>
          dataIndex="status"
          title="Trạng thái"
          width={120}
          render={(s: ReviewTask["status"]) => <Tag color={TASK_STATUS[s].color}>{TASK_STATUS[s].label}</Tag>}
        />
        <Table.Column<ReviewTask>
          dataIndex="dueAt"
          title="Hạn xử lý"
          width={150}
          render={(dueAt: string | null, row) => {
            if (!dueAt) return "—";
            const overdue = (row.status === "open" || row.status === "in_review") && dayjs(dueAt).isBefore(dayjs());
            return (
              <Typography.Text type={overdue ? "danger" : undefined}>{dayjs(dueAt).format("HH:mm DD/MM")}</Typography.Text>
            );
          }}
        />
        <Table.Column<ReviewTask>
          dataIndex="createdAt"
          title="Tạo lúc"
          width={150}
          render={(v: string) => dayjs(v).format("HH:mm DD/MM/YYYY")}
        />
      </Table>
    </List>
  );
}
