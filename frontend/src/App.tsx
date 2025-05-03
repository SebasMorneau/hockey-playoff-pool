import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { useAuthStore } from "./store/authStore";
import { useTheme } from "./contexts/ThemeContext";
import { THEME_CONFIG } from "./config";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import AuthLayout from "./layouts/AuthLayout";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./components/auth/AdminRoute";
import Loading from "./components/common/Loading";

// Pages
const Login = lazy(() => import("./pages/auth/Login"));
const MagicLinkVerify = lazy(() => import("./pages/auth/MagicLinkVerify"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Pages
const ManageTeams = lazy(() => import("./pages/admin/ManageTeams"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ManagePlayoffs = lazy(() => import("./pages/admin/ManagePlayoffs"));
const PoolConfig = lazy(() => import("./pages/admin/PoolConfig"));
const ManageSystem = lazy(() => import("./pages/admin/ManageSystem"));

const AppContent = () => {
  const { isAuthenticated } = useAuthStore();
  const { isDarkMode, primaryColor } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
          borderRadius: THEME_CONFIG.borderRadius,
          motionDurationMid: `${THEME_CONFIG.transitionDuration}ms`,
        },
      }}
    >
      <Router>
        <Suspense fallback={<Loading fullPage />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
              <Route
                path="/login"
                element={
                  !isAuthenticated ? <Login /> : <Navigate to="/" replace />
                }
              />
              <Route path="/auth/verify" element={<MagicLinkVerify />} />
            </Route>

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/playoffs" replace />}
                />
                <Route path="/admin/teams" element={<ManageTeams />} />
                <Route path="/admin/playoffs" element={<ManagePlayoffs />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/config" element={<PoolConfig />} />
                <Route path="/admin/system" element={<ManageSystem />} />
              </Route>
            </Route>

            {/* Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ConfigProvider>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;
