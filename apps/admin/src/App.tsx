import { DashboardOutlined } from "@ant-design/icons";
import { AuthPage, ErrorComponent, ThemedLayout, ThemedTitle, useNotificationProvider } from "@refinedev/antd";
import { Authenticated, Refine } from "@refinedev/core";
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { DashboardPage } from "./pages/dashboard";
import { authProvider } from "./providers/auth-provider";
import { dataProvider } from "./providers/data-provider";
import { adminTheme } from "./theme";

import "@refinedev/antd/dist/reset.css";

export function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={adminTheme} locale={viVN}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: { label: "Tổng quan", icon: <DashboardOutlined /> },
              },
            ]}
            options={{ syncWithLocation: true, warnWhenUnsavedChanges: true, disableTelemetry: true }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated key="authenticated-routes" fallback={<CatchAllNavigate to="/login" />}>
                    <ThemedLayout Title={({ collapsed }) => <ThemedTitle collapsed={collapsed} text="Farmery" />}>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="*" element={<ErrorComponent />} />
              </Route>
              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route
                  path="/login"
                  element={
                    <AuthPage
                      type="login"
                      title="Farmery — nội bộ"
                      registerLink={false}
                      forgotPasswordLink={false}
                      rememberMe={false}
                    />
                  }
                />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
