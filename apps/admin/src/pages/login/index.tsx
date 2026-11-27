import { useEffect, useState } from "react";
import { useLogin } from "@refinedev/core";
import { Alert, Button, Card, Flex, Form, Input, QRCode, theme, Typography } from "antd";
import { api } from "../../lib/api";
import { type ApiError, unwrap } from "../../lib/problem";
import type { LoginVariables } from "../../providers/auth-provider";

type Challenge = { email: string; challengeId: string; devCode?: string };

export function LoginPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<ApiError | null>(null);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const [verification] = Form.useForm<{ code: string; totpCode?: string }>();
  const [retryUntil, setRetryUntil] = useState(0);
  const [now, setNow] = useState(0);
  const left = Math.max(0, Math.ceil((retryUntil - now) / 1000));
  const dead = verifyError?.code === "OTP_EXPIRED";
  const showTotp = provisioningUri !== null || verifyError?.code === "TOTP_REQUIRED" || verifyError?.code === "TOTP_INVALID";

  useEffect(() => {
    if (!retryUntil) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= retryUntil) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [retryUntil]);

  function wait(seconds: number | undefined) {
    const time = Date.now();
    setNow(time);
    setRetryUntil(seconds ? time + seconds * 1000 : 0);
  }
  const { mutate: login, isPending } = useLogin<LoginVariables>();
  const { token } = theme.useToken();

  const requestOtp = async ({ email }: { email: string }) => {
    if (left > 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await unwrap(api.POST("/auth/otp", { body: { email } }), "Email chưa có tài khoản Farmery.");
      setChallenge({ email, challengeId: res.challengeId, devCode: res.devCode });
      setVerifyError(null);
      setProvisioningUri(null);
      verification.resetFields();
      wait(undefined);
    } catch (e) {
      const failure = e as ApiError;
      setError(failure.message);
      wait(failure.retryAfter);
    } finally {
      setSending(false);
    }
  };

  async function setupTotp(challengeId: string, code: string) {
    setSettingUp(true);
    try {
      const result = await unwrap(api.POST("/auth/totp/setup", { body: { challengeId, code } }), "Chưa tạo được mã QR.");
      setProvisioningUri(result.provisioningUri);
      setVerifyError(null);
    } catch (error) {
      setVerifyError(error as ApiError);
    } finally {
      setSettingUp(false);
    }
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: "100dvh", padding: 16, background: token.colorBgLayout }}>
      <Card style={{ width: "100%", maxWidth: 400 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Farmery — nội bộ
        </Typography.Title>

        {!challenge ? (
          <Form layout="vertical" onFinish={requestOtp} requiredMark={false}>
            <Typography.Paragraph type="secondary">Nhập email công việc, mã OTP sẽ được gửi tới email này.</Typography.Paragraph>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email." },
                { type: "email", message: "Email chưa đúng định dạng." },
              ]}
            >
              <Input autoComplete="email" inputMode="email" size="large" autoFocus />
            </Form.Item>
            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
            <Button type="primary" htmlType="submit" size="large" block loading={sending} disabled={left > 0}>
              {left > 0 ? `Gửi mã OTP (${left}s)` : "Gửi mã OTP"}
            </Button>
          </Form>
        ) : (
          <Form
            key={challenge.challengeId}
            form={verification}
            layout="vertical"
            requiredMark={false}
            onFinish={({ code, totpCode }) => {
              if (dead || (verifyError?.statusCode === 429 && left > 0)) return;
              login({ challengeId: challenge.challengeId, code, totpCode }, {
                onSuccess: (result) => {
                  if (result.success || !result.error) return;
                  const failure = result.error as ApiError;
                  if (failure.code === "TOTP_SETUP_REQUIRED") {
                    void setupTotp(challenge.challengeId, code);
                    return;
                  }
                  setVerifyError(failure);
                  if (failure.retryAfter) wait(failure.retryAfter);
                },
              });
            }}
          >
            <Typography.Paragraph type="secondary">
              Đã gửi mã tới <Typography.Text strong>{challenge.email}</Typography.Text>.
            </Typography.Paragraph>
            {challenge.devCode && (
              <Alert type="info" showIcon message={`Bản demo — mã OTP: ${challenge.devCode}`} style={{ marginBottom: 16 }} />
            )}
            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
            {verifyError && <Alert type="error" showIcon message={verifyError.message} style={{ marginBottom: 16 }} />}
            <Form.Item
              name="code"
              label="Mã OTP"
              rules={[{ required: true, pattern: /^\d{6}$/, message: "Mã OTP gồm 6 chữ số." }]}
            >
              <Input.OTP length={6} size="large" autoFocus disabled={dead} />
            </Form.Item>
            {provisioningUri && (
              <Flex vertical gap="small" align="center" style={{ marginBottom: 16 }}>
                <Typography.Paragraph>Quét mã QR trong ứng dụng xác thực rồi nhập mã 6 số bên dưới.</Typography.Paragraph>
                <QRCode value={provisioningUri} aria-label="Mã QR thiết lập xác thực Farmery" />
              </Flex>
            )}
            {showTotp && (
              <Form.Item
                name="totpCode"
                label="Mã ứng dụng xác thực"
                rules={[{ required: true, pattern: /^\d{6}$/, message: "Mã xác thực gồm 6 chữ số." }]}
              >
                <Input.OTP length={6} size="large" disabled={dead} />
              </Form.Item>
            )}
            <Button type="primary" htmlType="submit" size="large" block loading={isPending || settingUp} disabled={dead || (verifyError?.statusCode === 429 && left > 0)}>
              Đăng nhập
            </Button>
            {challenge.devCode && !showTotp && (
              <Button type="link" loading={settingUp} disabled={dead || isPending} onClick={() => {
                void verification.validateFields(["code"]).then(({ code }) => setupTotp(challenge.challengeId, code), () => undefined);
              }}>
                Thiết lập ứng dụng xác thực
              </Button>
            )}
            <Flex justify="space-between" style={{ marginTop: 8 }}>
              <Button type="link" loading={sending} disabled={left > 0} onClick={() => requestOtp({ email: challenge.email })}>
                {dead ? "Gửi mã mới" : "Gửi lại mã"}{left > 0 ? ` (${left}s)` : ""}
              </Button>
              <Button type="link" disabled={sending || isPending} onClick={() => { setChallenge(null); setError(null); setVerifyError(null); }}>
                Dùng email khác
              </Button>
            </Flex>
          </Form>
        )}
      </Card>
    </Flex>
  );
}
