"use client";

import { useEffect, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/data/cart-actions";
import { cn } from "@/lib/utils";

export type CartFeedback = { ok: boolean; text: string } | null;

/** Gọi Server Action thêm vào giỏ; chưa đăng nhập thì action tự chuyển /dang-nhap rồi quay lại trang này. */
export function useAddToCart() {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<CartFeedback>(null);

  useEffect(() => {
    if (!feedback?.ok) return;
    const t = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(t);
  }, [feedback]);

  function add(listingId: string, quantity: number, buyNow = false) {
    if (pending) return;
    setFeedback(null);
    startTransition(async () => {
      const returnTo = window.location.pathname + window.location.search;
      const result = await addToCart(listingId, quantity, { returnTo, buyNow });
      if (result) setFeedback(result.ok ? { ok: true, text: "Đã thêm vào giỏ" } : { ok: false, text: result.message });
    });
  }

  return { add, pending, feedback };
}

export function FeedbackText({ feedback, className }: { feedback: CartFeedback; className?: string }) {
  return (
    <p role="status" className={cn("text-micro font-medium", feedback?.ok ? "text-success" : "text-danger", className)}>
      {feedback?.text}
    </p>
  );
}

/** Nút "Thêm" ở thẻ sản phẩm (mobile: "Thêm vào giỏ" rộng hết thẻ). */
export function AddToCartButton({ listingId, disabled, className }: { listingId: string; disabled?: boolean; className?: string }) {
  const { add, pending, feedback } = useAddToCart();
  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={() => add(listingId, 1)}
        className={className}
      >
        {feedback?.ok ? (
          <>
            <Check className="size-3.5" aria-hidden /> Đã thêm
          </>
        ) : pending ? (
          "Đang thêm…"
        ) : (
          <>
            <span className="md:hidden">Thêm vào giỏ</span>
            <span className="hidden md:inline">Thêm</span>
          </>
        )}
      </Button>
      {feedback && !feedback.ok && <FeedbackText feedback={feedback} className="mt-1.5 md:text-right" />}
    </>
  );
}
