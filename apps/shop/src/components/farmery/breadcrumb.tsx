import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

/** 12.5px, #8a9184; mục cuối #3d4a37. Mobile: một dòng, cắt bằng dấu … */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="truncate text-caption text-muted-foreground">
      <ol className="inline">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${i}-${c.label}`}>
              <li className="inline" aria-current={last ? "page" : undefined}>
                {last || !c.href ? (
                  <span className={last ? "text-ink-2" : undefined}>{c.label}</span>
                ) : (
                  <Link href={c.href} className="text-muted-foreground hover:text-primary-hover">
                    {c.label}
                  </Link>
                )}
              </li>
              {!last && (
                <li aria-hidden className="inline">
                  {" / "}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
