import { cn } from "@/lib/utils";

type Variant = "full" | "full-dark" | "mark" | "mark-dark";

function Mark({ dark, size }: { dark: boolean; size: number }) {
  const main = dark ? "#ffffff" : "#1f5132";
  const cut = dark ? "#14261a" : "#ffffff";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="flex-none" aria-hidden>
      <path d="M22 20v-3a10 10 0 0 1 20 0v3" stroke={main} strokeWidth="4" strokeLinecap="round" />
      <path d="M12 20h40v34a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V20Z" fill={main} />
      <path d="M32 42V33" stroke={cut} strokeWidth="3" strokeLinecap="round" />
      <path d="M32 35c0-5-3.5-8-9-8 0 5 3.5 8 9 8Z" fill={dark ? "#4f9c56" : "#a8cf9c"} />
      <path d="M32 33c0-4.6 3.2-7.5 8.5-7.5 0 4.6-3.2 7.5-8.5 7.5Z" fill={dark ? "#14261a" : "#ffffff"} />
      <path d="M15 47c8-3 26-3 34 0" stroke={cut} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Logo Farmery. `size` = cỡ chữ wordmark (px). Header: 24 (mobile 22), chân trang: 21.
 * Biểu tượng luôn ≈ 1.08 × cỡ chữ.
 */
export function Logo({ variant = "full", size = 24, className }: { variant?: Variant; size?: number; className?: string }) {
  const dark = variant.endsWith("dark");
  if (variant.startsWith("mark")) return <Mark dark={dark} size={size} />;
  return (
    <span role="img" className={cn("inline-flex items-center", className)} style={{ gap: size * 0.375 }} aria-label="Farmery">
      <Mark dark={dark} size={Math.round(size * 1.083)} />
      <span
        className={cn("relative font-bold leading-none tracking-[-0.03em]", dark ? "text-white" : "text-primary")}
        style={{ fontSize: size }}
        aria-hidden
      >
        farme
        <span className="relative">
          r
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-px top-px"
            style={{ width: size * 0.417, height: size * 0.417 }}
          >
            <path d="M5 19c0-7.5 5.5-12 15-12-1 8.5-6.5 12-15 12Z" fill={dark ? "#7dc286" : "#4f9c56"} />
            <path d="M5 19C8 14.5 12 11.5 16.5 9.5" stroke={dark ? "#14261a" : "#1f5132"} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        y
      </span>
    </span>
  );
}
