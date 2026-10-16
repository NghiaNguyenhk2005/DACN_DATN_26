import { AnnouncementBar } from "@/components/farmery/announcement-bar";
import { CategoryNav } from "@/components/farmery/category-nav";
import { SiteFooter } from "@/components/farmery/site-footer";
import { SiteHeader } from "@/components/farmery/site-header";
import { getCategories } from "@/lib/data";
import { categoryHref } from "@/lib/slug";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Lỗi tải danh mục không được làm hỏng cả layout: thanh danh mục để trống, trang tự báo lỗi của nó.
  const categories = await getCategories().catch(() => []);
  const nav = categories.map((c) => ({ label: c.name, href: categoryHref(c) }));

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <CategoryNav items={nav} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 md:px-12">{children}</main>
      <SiteFooter categories={nav} />
    </>
  );
}
