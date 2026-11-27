"use client";

import { useActionState, useEffect, useState } from "react";
import { Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestOtp, verifyOtp, type OtpState, type SentOtp, type VerifyState } from "@/lib/data/auth-actions";
import { waitText } from "@/lib/problem";

const inputClass =
  "h-11 w-full rounded-btn border border-border bg-background px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-danger disabled:opacity-60";
const primaryClass = "h-11 w-full rounded-btn bg-primary text-title font-semibold text-white hover:bg-primary-hover";

function ErrorText({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role="alert" className="min-h-5 text-small text-danger">
      {message}
    </p>
  );
}

/** "42s" hoặc "3:05": số giây còn lại trên nút và dòng báo phải chờ. */
const clock = (seconds: number) =>
  seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : `${seconds}s`;

/**
 * Đếm ngược từ `seconds` (theo Retry-After của API). Muốn đếm lại từ đầu thì gắn `key` mới cho component dùng hook:
 * giá trị đầu lấy từ props lúc gắn, các lần cập nhật sau chỉ chạy trong bộ đếm giờ.
 */
function useCountdown(seconds: number | undefined): number {
  const [left, setLeft] = useState(seconds ?? 0);
  useEffect(() => {
    if (!seconds) return;
    const end = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const remain = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [seconds]);
  return left;
}

/** Đăng nhập hai bước: email → mã OTP 6 số. `next`, `them` chuyển tiếp cho Server Action. */
export function LoginForm({ next, them }: { next: string; them?: string }) {
  const [otp, sendAction, sending] = useActionState<OtpState, FormData>(requestOtp, { status: "idle" });
  const [editingEmail, setEditingEmail] = useState(false);
  const sent = otp.status === "sent" && !editingEmail;
  const email = otp.status === "idle" ? "" : otp.email;

  if (!sent) {
    const message =
      otp.status === "error" ? (otp.retryAfter ? `${otp.message} Thử lại sau ${waitText(otp.retryAfter)}.` : otp.message) : undefined;
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
        <ErrorText id="email-error" message={message} />
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
      <CodeStep
        key={otp.challengeId}
        otp={otp}
        sendAction={sendAction}
        sending={sending}
        next={next}
        them={them}
        onChangeEmail={() => setEditingEmail(true)}
      />
    </div>
  );
}

interface CodeStepProps {
  otp: SentOtp;
  sendAction: (formData: FormData) => void;
  sending: boolean;
  next: string;
  them?: string;
  onChangeEmail: () => void;
}

function CodeStep({ otp, sendAction, sending, next, them, onChangeEmail }: CodeStepProps) {
  const [state, verifyAction, verifying] = useActionState<VerifyState, FormData>(verifyOtp, null);
  const [code, setCode] = useState("");
  // Mã hết hạn hoặc nhập sai quá 5 lần: phiên mã đã hủy, nhập tiếp vô ích, chỉ còn cách xin mã mới.
  const dead = state?.code === "OTP_EXPIRED";
  const locked = state?.code === "RATE_LIMITED" ? state : null;

  return (
    <div className="flex flex-col gap-3">
      <form action={verifyAction} className="flex flex-col gap-2" noValidate>
        <input type="hidden" name="challengeId" value={otp.challengeId} />
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
          disabled={dead}
          placeholder="••••••"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          aria-invalid={state?.message ? true : undefined}
          aria-describedby="code-error"
          className={`${inputClass} text-center text-[20px] font-semibold tracking-[0.4em]`}
        />
        {state?.registering && !dead && (
          <>
            <p className="text-small text-ink-2">Email đã được xác minh. Nhập họ tên để tạo tài khoản Farmery.</p>
            <label htmlFor="displayName" className="text-small font-semibold text-ink-2">Họ và tên</label>
            <input id="displayName" name="displayName" autoComplete="name" maxLength={120} required className={inputClass} />
          </>
        )}
        <ErrorText id="code-error" message={state?.message} />
        <SubmitCode key={locked?.nonce ?? 0} verifying={verifying} dead={dead} lockSeconds={locked?.retryAfter} registering={state?.registering} />
      </form>
      <ResendRow
        key={otp.resend?.nonce ?? 0}
        otp={otp}
        dead={dead}
        sendAction={sendAction}
        sending={sending}
        onChangeEmail={onChangeEmail}
      />
    </div>
  );
}

function SubmitCode({ verifying, dead, lockSeconds, registering }: { verifying: boolean; dead: boolean; lockSeconds?: number; registering?: boolean }) {
  const left = useCountdown(lockSeconds);
  const locked = left > 0;
  return (
    <>
      {locked && (
        <p role="status" className="text-small text-ink-2">
          Đăng nhập tạm khóa, thử lại sau <strong className="tabular-nums">{clock(left)}</strong>.
        </p>
      )}
      <Button type="submit" disabled={verifying || dead || locked} aria-busy={verifying} className={primaryClass}>
        {verifying ? "Đang xác nhận…" : registering ? "Tạo tài khoản" : "Đăng nhập"}
      </Button>
    </>
  );
}

/**
 * "Gửi lại mã" / "Gửi mã mới". Bị giới hạn tần suất thì vẫn ở bước nhập mã, nút khóa và đếm ngược theo Retry-After;
 * mã đã chết (hết hạn, sai quá 5 lần) thì nút thành "Gửi mã mới" nổi bật.
 */
function ResendRow({
  otp,
  dead,
  sendAction,
  sending,
  onChangeEmail,
}: {
  otp: SentOtp;
  dead: boolean;
  sendAction: (formData: FormData) => void;
  sending: boolean;
  onChangeEmail: () => void;
}) {
  const left = useCountdown(otp.resend?.retryAfter);
  const waiting = left > 0;
  const label = dead ? "Gửi mã mới" : "Gửi lại mã";

  return (
    <div className="flex flex-col gap-1">
      {otp.resend && (
        <p role="alert" className="text-small text-danger">
          {otp.resend.message}
          {waiting && (
            <>
              {" "}
              Có thể gửi lại sau <strong className="tabular-nums">{clock(left)}</strong>.
            </>
          )}
        </p>
      )}
      {dead && (
        <form action={sendAction}>
          <input type="hidden" name="email" value={otp.email} />
          <Button type="submit" disabled={sending || waiting} aria-busy={sending} className={primaryClass}>
            {sending ? "Đang gửi mã mới…" : waiting ? `${label} (${clock(left)})` : label}
          </Button>
        </form>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        {dead ? (
          <span />
        ) : (
          <form action={sendAction}>
            <input type="hidden" name="email" value={otp.email} />
            <button type="submit" disabled={sending || waiting} className="min-h-11 text-small font-semibold text-primary disabled:opacity-50">
              {sending ? "Đang gửi lại…" : waiting ? `${label} (${clock(left)})` : label}
            </button>
          </form>
        )}
        <button type="button" onClick={onChangeEmail} className="min-h-11 text-small font-semibold text-ink-2">
          Đổi email
        </button>
      </div>
    </div>
  );
}
