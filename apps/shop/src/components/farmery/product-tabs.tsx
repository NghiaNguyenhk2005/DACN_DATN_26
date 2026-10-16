import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const trigger =
  "h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-[11px] text-title font-medium text-subtle shadow-none " +
  "data-active:border-primary data-active:bg-transparent data-active:font-semibold data-active:text-primary data-active:shadow-none after:hidden";

interface Props {
  description: React.ReactNode;
  /** Nội dung tab nhật ký (QR + dòng thời gian), dựng sẵn ở Server Component. */
  log: React.ReactNode;
}

/** Tab chi tiết sản phẩm: Mô tả · Nhật ký canh tác. Gạch chân 2px #1f5132 khi đang chọn; gap 24–26px. */
export function ProductTabs({ description, log }: Props) {
  return (
    <Tabs defaultValue="info" className="gap-0">
      <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-line bg-transparent p-0 group-data-horizontal/tabs:h-auto md:gap-[26px]">
        <TabsTrigger value="info" className={trigger}>
          Mô tả
        </TabsTrigger>
        <TabsTrigger value="trace" className={trigger}>
          Nhật ký canh tác
        </TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="mt-[18px] text-[14px] leading-[1.7] text-ink-2 md:text-body">
        {description}
      </TabsContent>
      <TabsContent value="trace" className="mt-[18px]">
        {log}
      </TabsContent>
    </Tabs>
  );
}

