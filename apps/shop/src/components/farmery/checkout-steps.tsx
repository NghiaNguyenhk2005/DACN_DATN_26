import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Giỏ hàng", "Giao hàng & thanh toán", "Xác nhận"];

/** Thanh bước mua hàng: 1. Giỏ hàng › 2. Giao hàng & thanh toán › 3. Xác nhận. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3 text-caption md:py-5 md:text-small" aria-label="Các bước mua hàng">
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          <li
            aria-current={i === current ? "step" : undefined}
            className={cn(i <= current ? "font-semibold text-primary" : "text-subtle", i !== current && "max-sm:hidden")}
          >
            {i + 1}. {label}
          </li>
          {i < STEPS.length - 1 && (
            <li aria-hidden className={cn("text-faint", i !== current && "max-sm:hidden")}>
              <ChevronRight className="size-3.5" />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
}
