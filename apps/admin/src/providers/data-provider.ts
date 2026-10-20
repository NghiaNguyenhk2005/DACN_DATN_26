import type { BaseRecord, CrudFilter, DataProvider, GetListResponse, HttpError } from "@refinedev/core";
import type { Schema } from "@farmery/contract";
import { api, API_URL } from "../lib/api";
import { unwrap } from "../lib/problem";

type Page = { items: BaseRecord[]; nextCursor: string | null };
type ListQuery = { filters: Record<string, string>; cursor?: string; limit: number };

type ResourceHandlers = {
  list?: (q: ListQuery) => Promise<Page>;
  one?: (id: string) => Promise<BaseRecord>;
};

// Mỗi resource của Refine ánh xạ tới thao tác trong hợp đồng; resource chưa khai thì báo đang hoàn thiện.
const resources: Record<string, ResourceHandlers> = {
  "review-tasks": {
    list: ({ filters, cursor, limit }) =>
      unwrap(
        api.GET("/admin/review-tasks", {
          params: {
            query: {
              type: filters.type as Schema<"TaskType"> | undefined,
              status: filters.status as Schema<"TaskStatus"> | undefined,
              cursor,
              limit,
            },
          },
        }),
        "Không tải được hàng đợi duyệt.",
      ),
    one: (taskId) =>
      unwrap(
        api.GET("/admin/review-tasks/{taskId}", { params: { path: { taskId } } }),
        "Không tải được việc duyệt.",
      ),
  },
};

function handlersFor(resource: string): ResourceHandlers {
  return resources[resource] ?? {};
}

const notImplemented = (): Promise<never> =>
  Promise.reject({ message: "Chức năng đang được hoàn thiện.", statusCode: 501 } satisfies HttpError);

function eqFilters(filters: CrudFilter[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of filters ?? []) {
    if ("field" in f && f.operator === "eq" && f.value !== undefined && f.value !== null && f.value !== "") {
      out[f.field] = String(f.value);
    }
  }
  return out;
}

// API phân trang theo cursor, bảng antd theo số trang: nhớ cursor đầu mỗi trang theo bộ lọc, trang chưa biết thì đi
// lần lượt từ trang gần nhất đã biết.
const cursorCache = new Map<string, (string | undefined)[]>();

async function getPage(resource: string, list: NonNullable<ResourceHandlers["list"]>, filters: Record<string, string>, page: number, limit: number) {
  const key = JSON.stringify([resource, filters, limit]);
  if (page === 1 || !cursorCache.has(key)) cursorCache.set(key, [undefined]);
  const cursors = cursorCache.get(key)!;
  let known = Math.min(page, cursors.length);
  let result = await list({ filters, cursor: cursors[known - 1], limit });
  while (known < page && result.nextCursor) {
    cursors[known] = result.nextCursor;
    known += 1;
    result = await list({ filters, cursor: result.nextCursor, limit });
  }
  if (result.nextCursor) cursors[known] = result.nextCursor;
  return { result, page: known };
}

export const dataProvider: DataProvider = {
  getApiUrl: () => API_URL,
  getList: async <TData extends BaseRecord = BaseRecord>({ resource, pagination, filters }: Parameters<DataProvider["getList"]>[0]) => {
    const { list } = handlersFor(resource);
    if (!list) return notImplemented();
    const limit = pagination?.pageSize ?? 20;
    const { result, page } = await getPage(resource, list, eqFilters(filters), pagination?.currentPage ?? 1, limit);
    const total = result.nextCursor ? page * limit + 1 : (page - 1) * limit + result.items.length;
    return { data: result.items as TData[], total } satisfies GetListResponse<TData>;
  },
  getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: Parameters<DataProvider["getOne"]>[0]) => {
    const { one } = handlersFor(resource);
    if (!one) return notImplemented();
    return { data: (await one(String(id))) as TData };
  },
  create: notImplemented,
  update: notImplemented,
  deleteOne: notImplemented,
};
