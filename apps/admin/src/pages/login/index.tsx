import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { Alert, Button, Card, Flex, Form, Input, theme, Typography } from "antd";
import { api } from "../../lib/api";
import { unwrap } from "../../lib/problem";
import type { LoginVariables } from "../../providers/auth-provider";

type Challenge = { email: string; challengeId: string; devCode?: string };

export function LoginPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: login, isPending } = useLogin<LoginVariables>();
  const { token } = theme.useToken();

  const requestOtp = async ({ email }: { email: string }) => {
    setSending(true);
    setError(null);
    try {
      const res = await unwrap(api.POST("/auth/otp", { body: { email } }), "Email chưa có tài khoản Farmery.");
      setChallenge({ email, challengeId: res.challengeId, devCode: res.devCode });
    } catch (e) {
      setError((e as { message: string }).message);
    } finally {
      setSending(false);
    }
  };

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
            <Button type="primary" htmlType="submit" size="large" block loading={sending}>
              Gửi mã OTP
            </Button>
          </Form>
        ) : (
          <Form
            key={challenge.challengeId}
            layout="vertical"
            requiredMark={false}
            onFinish={({ code }: { code: string }) => login({ challengeId: challenge.challengeId, code })}
          >
            <Typography.Paragraph type="secondary">
              Đã gửi mã tới <Typography.Text strong>{challenge.email}</Typography.Text>.
            </Typography.Paragraph>
            {challenge.devCode && (
              <Alert type="info" showIcon message={`Bản demo — mã OTP: ${challenge.devCode}`} style={{ marginBottom: 16 }} />
            )}
            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
            <Form.Item
              name="code"
              label="Mã OTP"
              rules={[{ required: true, pattern: /^\d{6}$/, message: "Mã OTP gồm 6 chữ số." }]}
            >
              <Input.OTP length={6} size="large" autoFocus />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={isPending}>
              Đăng nhập
            </Button>
            <Flex justify="space-between" style={{ marginTop: 8 }}>
              <Button type="link" loading={sending} onClick={() => requestOtp({ email: challenge.email })}>
                Gửi lại mã
              </Button>
              <Button type="link" onClick={() => setChallenge(null)}>
                Dùng email khác
              </Button>
            </Flex>
          </Form>
        )}
      </Card>
    </Flex>
  );
}
