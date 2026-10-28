import { AuditOutlined, DashboardOutlined, InboxOutlined, SettingOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { ErrorComponent, ThemedLayout, ThemedTitle, useNotificationProvider } from "@refinedev/antd";
import { Authenticated, CanAccess, Refine } from "@refinedev/core";
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp, ConfigProvider, Result } from "antd";
import viVN from "antd/locale/vi_VN";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { DashboardPage } from "./pages/dashboard";
import { InventoryList } from "./pages/inventory/list";
import { LoginPage } from "./pages/login";
import { OrderList } from "./pages/orders/list";
import { OrderShow } from "./pages/orders/show";
import { ReviewTaskList } from "./pages/review-tasks/list";
import { ReviewTaskShow } from "./pages/review-tasks/show";
import { SettingsPage } from "./pages/settings";
import { accessControlProvider } from "./providers/access-control-provider";
import { authProvider } from "./providers/auth-provider";
import { dataProvider } from "./providers/data-provider";
import { i18nProvider } from "./providers/i18n-provider";
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
            accessControlProvider={accessControlProvider}
            i18nProvider={i18nProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: { label: "Tổng quan", icon: <DashboardOutlined /> },
              },
              {
                name: "review-tasks",
                list: "/kiem-duyet",
                show: "/kiem-duyet/:id",
                meta: { label: "Kiểm duyệt", icon: <AuditOutlined />, roles: ["staff_moderation"] },
              },
              {
                name: "orders",
                list: "/van-hanh",
                show: "/van-hanh/:id",
                meta: {
                  label: "Vận hành đơn",
                  icon: <ShoppingCartOutlined />,
                  roles: ["staff_operations", "staff_warehouse"],
                },
              },
              {
                name: "inventory",
                list: "/kho",
                meta: { label: "Tồn kho", icon: <InboxOutlined />, roles: ["staff_warehouse", "staff_operations"] },
              },
              {
                name: "settings",
                list: "/cau-hinh",
                meta: { label: "Cấu hình", icon: <SettingOutlined />, roles: ["platform_owner", "staff_operations"] },
              },
            ]}
            options={{ syncWithLocation: true, warnWhenUnsavedChanges: true, disableTelemetry: true }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated key="authenticated-routes" fallback={<CatchAllNavigate to="/login" />}>
                    <ThemedLayout Title={({ collapsed }) => <ThemedTitle collapsed={collapsed} text="Farmery" />}>
                      <CanAccess
                        fallback={<Result status="403" title="Không có quyền" subTitle="Tài khoản của bạn không có quyền vào mục này." />}
                      >
                        <Outlet />
                      </CanAccess>
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/kiem-duyet">
                  <Route index element={<ReviewTaskList />} />
                  <Route path=":id" element={<ReviewTaskShow />} />
                </Route>
                <Route path="/van-hanh">
                  <Route index element={<OrderList />} />
                  <Route path=":id" element={<OrderShow />} />
                </Route>
                <Route path="/kho" element={<InventoryList />} />
                <Route path="/cau-hinh" element={<SettingsPage />} />
                <Route path="*" element={<ErrorComponent />} />
              </Route>
              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
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
