"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  appliedFilters,
  CERT_OPTIONS,
  countFilters,
  filtersToSearch,
  REGION_OPTIONS,
  type Filters,
} from "@/lib/filters";
import { CERT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { FilterChip } from "./filter-chip";

interface Props {
  /** Đường dẫn của trang danh sách, vd "/tim-kiem" hoặc "/danh-muc/dau-tay-da-lat-11". */
  basePath: string;
  q?: string;
  filters: Filters;
  children: React.ReactNode;
}

const parsePrice = (s: string) => {
  const digits = s.replace(/\D/g, "");
  return digits ? Number(digits) : undefined;
};
const showPrice = (n: number | undefined) => (n === undefined ? "" : n.toLocaleString("vi-VN"));

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-panel border border-line bg-background p-[18px] max-lg:rounded-none max-lg:border-0 max-lg:p-0 max-lg:py-3">
      <legend className="float-left mb-[11px] w-full text-[13.5px] font-bold text-ink">{title}</legend>
      <div className="clear-both flex flex-col">{children}</div>
    </fieldset>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-small text-ink-2 lg:min-h-0 lg:gap-[9px] lg:py-[5px]">
      <Checkbox checked={checked} onCheckedChange={onChange} className="size-5 lg:size-[15px]" />
      {label}
    </label>
  );
}

function PriceInputs({ value, onChange }: { value: Filters; onChange: (min?: number, max?: number) => void }) {
  const [min, setMin] = useState(showPrice(value.minPrice));
  const [max, setMax] = useState(showPrice(value.maxPrice));
  const commit = () => onChange(parsePrice(min), parsePrice(max));
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        commit();
      }}
    >
      <Input
        inputMode="numeric"
        placeholder="10.000₫"
        value={min}
        aria-label="Giá từ"
        onChange={(e) => setMin(e.target.value)}
        onBlur={commit}
        className="h-11 text-title lg:h-9 lg:text-caption"
      />
      <span className="text-faint">–</span>
      <Input
        inputMode="numeric"
        placeholder="200.000₫"
        value={max}
        aria-label="Giá đến"
        onChange={(e) => setMax(e.target.value)}
        onBlur={commit}
        className="h-11 text-title lg:h-9 lg:text-caption"
      />
      <button type="submit" className="sr-only">
        Áp dụng khoảng giá
      </button>
    </form>
  );
}

/** Cột bộ lọc ≥lg: mỗi nhóm một khung bo 14px; chứng nhận, vùng trồng chọn một (hợp đồng nhận một giá trị). */
function SidebarPanel({ value, onChange }: { value: Filters; onChange: (next: Filters) => void }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Group title="Chứng nhận">
        {CERT_OPTIONS.map((c) => (
          <CheckRow
            key={c}
            label={CERT_LABELS[c]}
            checked={value.cert === c}
            onChange={() => onChange({ ...value, cert: value.cert === c ? undefined : c })}
          />
        ))}
      </Group>
      <Group title="Vùng trồng">
        {REGION_OPTIONS.map((r) => (
          <CheckRow
            key={r}
            label={r}
            checked={value.region === r}
            onChange={() => onChange({ ...value, region: value.region === r ? undefined : r })}
          />
        ))}
      </Group>
      <Group title="Khoảng giá">
        <PriceInputs
          key={`${value.minPrice}-${value.maxPrice}`}
          value={value}
          onChange={(minPrice, maxPrice) => {
            if (minPrice !== value.minPrice || maxPrice !== value.maxPrice) onChange({ ...value, minPrice, maxPrice });
          }}
        />
      </Group>
      <Group title="Tình trạng">
        <label className="flex cursor-pointer items-center justify-between gap-3 py-[5px] text-small text-ink-2">
          Còn hàng
          <Switch checked={!!value.inStock} onCheckedChange={(on) => onChange({ ...value, inStock: on || undefined })} />
        </label>
      </Group>
    </div>
  );
}

/** Ngăn kéo <lg: chứng nhận (checkbox 20px, dòng 44px), vùng trồng (chip), khoảng giá; áp dụng khi bấm "Xem kết quả". */
function SheetFilters({ value, onApply }: { value: Filters; onApply: (next: Filters) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const n = countFilters(value);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(value);
        setOpen(o);
      }}
    >
      <SheetTrigger
        render={
          <Button
            variant="outline"
            className="h-11 flex-1 gap-2 rounded-btn border-chip text-title font-semibold text-primary hover:text-primary"
          />
        }
      >
        <SlidersHorizontal className="size-4" aria-hidden /> Bộ lọc
        {n > 0 && (
          <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary text-[11px] text-white">
            {n}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl px-4 pb-4" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between px-0 pb-0">
          <SheetTitle className="text-[17px] font-bold">Bộ lọc</SheetTitle>
          <button
            type="button"
            onClick={() => setDraft({ inStock: draft.inStock, inSeason: draft.inSeason })}
            className="-mr-2 min-h-11 px-2 text-small text-muted-foreground"
          >
            Xoá lọc
          </button>
        </SheetHeader>
        <Group title="Chứng nhận">
          {CERT_OPTIONS.map((c) => (
            <CheckRow
              key={c}
              label={CERT_LABELS[c]}
              checked={draft.cert === c}
              onChange={() => setDraft({ ...draft, cert: draft.cert === c ? undefined : c })}
            />
          ))}
        </Group>
        <Group title="Vùng trồng">
          <div className="flex flex-wrap gap-2">
            {REGION_OPTIONS.map((r) => (
              <FilterChip
                key={r}
                label={r}
                active={draft.region === r}
                onClick={() => setDraft({ ...draft, region: draft.region === r ? undefined : r })}
              />
            ))}
          </div>
        </Group>
        <Group title="Khoảng giá">
          <PriceInputs
            key={`${open}`}
            value={draft}
            onChange={(minPrice, maxPrice) => setDraft((d) => ({ ...d, minPrice, maxPrice }))}
          />
        </Group>
        <SheetFooter className="mt-2 px-0 pb-[env(safe-area-inset-bottom)]">
          <Button
            onClick={() => {
              setOpen(false);
              onApply(draft);
            }}
            className="h-12 w-full rounded-btn bg-primary text-[15px] font-semibold text-white hover:bg-primary-hover"
          >
            Xem kết quả
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Khu vực danh sách có bộ lọc. ≥lg: lưới [250px | 1fr] gap 28px.
 * <lg: hàng [Bộ lọc (n)] [Còn hàng] cao 44px + chip đã áp dụng cuộn ngang.
 * Bộ lọc nằm trên URL; đổi bộ lọc → trang được dựng lại phía máy chủ.
 */
export function ProductFilters({ basePath, q, filters, children }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const apply = (next: Filters) =>
    startTransition(() => router.push(`${basePath}${filtersToSearch(q, next)}`, { scroll: false }));
  const applied = appliedFilters(filters);

  return (
    <div className="grid gap-5 lg:grid-cols-[250px_1fr] lg:gap-7">
      <aside className="hidden lg:block" aria-label="Bộ lọc">
        <SidebarPanel value={filters} onChange={apply} />
      </aside>
      <div className="min-w-0">
        <div className="mb-3 flex gap-2.5 lg:hidden">
          <SheetFilters value={filters} onApply={apply} />
          <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-btn border border-chip text-title font-semibold text-primary">
            <Switch checked={!!filters.inStock} onCheckedChange={(on) => apply({ ...filters, inStock: on || undefined })} />
            Còn hàng
          </label>
        </div>
        {applied.length > 0 && (
          <div className="scrollbar-none mb-4 flex items-center gap-2 overflow-x-auto lg:flex-wrap">
            {applied.map((a) => (
              <FilterChip key={a.key} label={a.label} onRemove={() => apply(a.without)} />
            ))}
            <button
              type="button"
              onClick={() => apply({})}
              className="min-h-10 flex-none px-1 text-caption text-muted-foreground"
            >
              Xoá lọc
            </button>
          </div>
        )}
        <div className={cn("transition-opacity", pending && "pointer-events-none opacity-60")} aria-busy={pending}>
          {children}
        </div>
      </div>
    </div>
  );
}
