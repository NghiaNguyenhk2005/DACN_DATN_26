import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Schema } from "@farmery/contract";
import { Breadcrumb, type Crumb } from "@/components/farmery/breadcrumb";
import { FilterChip } from "@/components/farmery/filter-chip";
import { ProductFilters } from "@/components/farmery/filter-sidebar";
import { ProductResults } from "@/components/farmery/product-results";
import { getCategories, searchProducts } from "@/lib/data";
import { parseFilters, toProductQuery, type ProductQuery } from "@/lib/filters";
import { categoryHref, parseSlugId } from "@/lib/slug";

type Category = Schema<"Category">;

function findCategory(tree: Category[], id: string, parent?: Category): { node: Category; parent?: Category } | null {
  for (const c of tree) {
    if (c.id === id) return { node: c, parent };
    const hit = findCategory(c.children, id, c);
    if (hit) return hit;
  }
  return null;
}

async function load(slug: string) {
  const id = parseSlugId(slug);
  if (!id) return null;
  return findCategory(await getCategories(), id);
}

export async function generateMetadata({ params }: PageProps<"/danh-muc/[slug]">): Promise<Metadata> {
  const found = await load((await params).slug).catch(() => null);
  return { title: found?.node.name ?? "Danh mục" };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/danh-muc/[slug]">) {
  const found = await load((await params).slug);
  if (!found) notFound();
  const { node, parent } = found;

  const crumbs: Crumb[] = [{ label: "Trang chủ", href: "/" }];
  if (parent) crumbs.push({ label: parent.name, href: categoryHref(parent) });
  crumbs.push({ label: node.name });

  return (
    <div className="pb-6 pt-3.5 md:pt-5">
      <Breadcrumb items={crumbs} />
      <h1 className="mb-3.5 mt-2 font-serif text-h1-sm font-bold text-ink md:mb-5 md:text-h1">{node.name}</h1>
      {node.isLeaf ? (
        <LeafListing node={node} parent={parent} searchParams={await searchParams} />
      ) : (
        <ParentOverview node={node} />
      )}
    </div>
  );
}

/** Danh mục lá: danh sách có bộ lọc; chip các danh mục cùng cấp để chuyển nhanh. */
async function LeafListing({
  node,
  parent,
  searchParams,
}: {
  node: Category;
  parent?: Category;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const query = toProductQuery(undefined, filters, { categoryId: node.id, limit: 20 });
  const page = await searchProducts(query);
  const basePath = categoryHref(node);

  return (
    <>
      {parent && parent.children.length > 1 && (
        <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {parent.children.map((c) => (
            <FilterChip key={c.id} label={c.name} href={categoryHref(c)} active={c.id === node.id} />
          ))}
        </div>
      )}
      <ProductFilters basePath={basePath} filters={filters}>
        <ProductResults
          key={JSON.stringify(query)}
          initial={page}
          query={query}
          withSidebar
          empty={{ action: { label: "Bỏ bộ lọc", href: basePath } }}
        />
      </ProductFilters>
    </>
  );
}

/** Danh mục cha: mỗi danh mục con một khối (vài sản phẩm + "Xem tất cả"). */
async function ParentOverview({ node }: { node: Category }) {
  const sections = await Promise.all(
    node.children.map(async (child) => {
      const query: ProductQuery = { categoryId: child.id, limit: 5 };
      return { child, query, page: await searchProducts(query) };
    }),
  );

  return (
    <>
      <div className="scrollbar-none -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {node.children.map((c) => (
          <FilterChip key={c.id} label={c.name} href={categoryHref(c)} />
        ))}
      </div>
      {sections.map(({ child, query, page }) => (
        <section key={child.id} className="pt-6 md:pt-8" aria-labelledby={`dm-${child.id}`}>
          <div className="mb-3 flex items-baseline justify-between gap-4 md:mb-4">
            <h2 id={`dm-${child.id}`} className="text-h2-sm font-bold text-ink md:text-h2">
              {child.name}
            </h2>
            <Link href={categoryHref(child)} className="flex-none text-small font-semibold">
              Xem tất cả
            </Link>
          </div>
          <ProductResults
            initial={{ items: page.items, nextCursor: null }}
            query={query}
            empty={{ title: "Chưa có sản phẩm", description: "Danh mục này chưa có sản phẩm đang bán." }}
          />
        </section>
      ))}
    </>
  );
}
