"use client";

import { useActionState, useState } from "react";
import { Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestOtp, verifyOtp, type OtpState } from "@/lib/data/auth-actions";

const inputClass =
  "h-11 w-full rounded-btn border border-border bg-background px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-danger";
const primaryClass = "h-11 w-full rounded-btn bg-primary text-title font-semibold text-white hover:bg-primary-hover";

function ErrorText({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role="alert" className="min-h-5 text-small text-danger">
      {message}
    </p>
  );
}

/** Đăng nhập hai bước: email → mã OTP 6 số. `next`, `them` chuyển tiếp cho Server Action. */
export function LoginForm({ next, them }: { next: string; them?: string }) {
  const [otp, sendAction, sending] = useActionState<OtpState, FormData>(requestOtp, { status: "idle" });
  const [editingEmail, setEditingEmail] = useState(false);
  const sent = otp.status === "sent" && !editingEmail;
  const email = otp.status === "idle" ? "" : otp.email;

  if (!sent) {
    return (
      <form action={sendAction} onSubmit={() => setEditingEmail(false)} className="flex flex-col gap-2" noValidate>
        <label htmlFor="email" className="text-small font-semibold text-ink-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={email}
          placeholder="ban@example.com"
          aria-invalid={otp.status === "error" || undefined}
          aria-describedby="email-error"
          className={inputClass}
        />
        <ErrorText id="email-error" message={otp.status === "error" ? otp.message : undefined} />
        <Button type="submit" disabled={sending} aria-busy={sending} className={primaryClass}>
          {sending ? "Đang gửi mã…" : "Nhận mã đăng nhập"}
        </Button>
        <p className="mt-1 text-caption text-muted-foreground">Mã OTP gồm 6 chữ số sẽ được gửi tới email của bạn.</p>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 rounded-tile bg-surface px-3.5 py-3 text-small text-ink-2">
        <Mail className="mt-0.5 size-4 flex-none text-primary" aria-hidden />
        <span>
          Đã gửi mã tới <strong className="break-all text-ink">{otp.email}</strong>
        </span>
      </p>
      {otp.devCode && (
        <p className="flex items-start gap-2 rounded-tile border border-warning-line bg-warning-soft px-3.5 py-3 text-small text-warning">
          <Info className="mt-0.5 size-4 flex-none" aria-hidden />
          <span>
            Bản demo không gửi email thật. Mã của bạn: <strong className="tracking-widest">{otp.devCode}</strong>
          </span>
        </p>
      )}
      <CodeStep key={otp.challengeId} challengeId={otp.challengeId} next={next} them={them} />
      <div className="flex flex-wrap justify-between gap-2">
        <form action={sendAction}>
          <input type="hidden" name="email" value={otp.email} />
          <button type="submit" disabled={sending} className="min-h-11 text-small font-semibold text-primary disabled:opacity-50">
            {sending ? "Đang gửi lại…" : "Gửi lại mã"}
          </button>
        </form>
        <button type="button" onClick={() => setEditingEmail(true)} className="min-h-11 text-small font-semibold text-ink-2">
          Đổi email
        </button>
      </div>
    </div>
  );
}

function CodeStep({ challengeId, next, them }: { challengeId: string; next: string; them?: string }) {
  const [state, verifyAction, verifying] = useActionState(verifyOtp, null);
  return (
    <form action={verifyAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="challengeId" value={challengeId} />
      <input type="hidden" name="next" value={next} />
      {them && <input type="hidden" name="them" value={them} />}
      <label htmlFor="code" className="text-small font-semibold text-ink-2">
        Mã OTP
      </label>
      <input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        placeholder="••••••"
        aria-invalid={state ? true : undefined}
        aria-describedby="code-error"
        className={`${inputClass} text-center text-[20px] font-semibold tracking-[0.4em]`}
      />
      <ErrorText id="code-error" message={state?.message} />
      <Button type="submit" disabled={verifying} aria-busy={verifying} className={primaryClass}>
        {verifying ? "Đang xác nhận…" : "Đăng nhập"}
      </Button>
    </form>
  );
}
