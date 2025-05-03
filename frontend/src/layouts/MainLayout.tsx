import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  theme,
  Space,
  FloatButton,
} from "antd";
import {
  TrophyOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { getImageUrl } from "../utils/imageUrl";
import ThemeToggle from "../components/common/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../components/common/Loading";
import { ToastProvider } from "../components/common/Loading";
import { LAYOUT_CONFIG } from "../config";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const { user, isAdmin, logout, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isDarkMode } = useTheme();
  const [routeLoading, setRouteLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Gérer le redimensionnement de la fenêtre pour le design responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Actualiser les données utilisateur au chargement
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Animate route transitions
  useEffect(() => {
    setRouteLoading(true);
    const timeout = setTimeout(() => setRouteLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Gérer la déconnexion
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Éléments du menu déroulant utilisateur
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profil",
      onClick: () => navigate("/profile"),
    },
    ...(isAdmin
      ? [
          {
            key: "admin",
            icon: <SettingOutlined />,
            label: "Panneau d'Administration",
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Déconnexion",
      onClick: handleLogout,
    },
  ];

  // Éléments du menu de navigation
  const menuItems = [
    {
      key: "dashboard",
      icon: <TrophyOutlined />,
      label: "Tableau de Bord",
      onClick: () => navigate("/"),
    },
  ];

  // Obtenir la clé sélectionnée actuelle en fonction du chemin
  const getSelectedKey = () => {
    const path = location.pathname.split("/")[1];
    return [path || "dashboard"];
  };

  return (
    <ToastProvider>
      <Layout style={{ minHeight: "100vh" }}>
        <AnimatePresence>
          <motion.div
            key={collapsed ? "sidebar-collapsed" : "sidebar"}
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring" }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 1000,
              width: collapsed
                ? isMobile
                  ? 0
                  : LAYOUT_CONFIG.siderCollapsedWidth
                : LAYOUT_CONFIG.siderWidth,
            }}
          >
            <Sider
              trigger={null}
              collapsible
              collapsed={collapsed}
              width={LAYOUT_CONFIG.siderWidth}
              collapsedWidth={isMobile ? 0 : LAYOUT_CONFIG.siderCollapsedWidth}
              style={{
                overflow: "auto",
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 1000,
                background: token.colorBgContainer,
                borderRight: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: "8px",
                }}
              >
                <Link to="/">
                  <img
                    src={getImageUrl("/images/playoff.png")}
                    alt="Logo des Séries Éliminatoires de la Coupe Stanley"
                    style={{ width: "32px", height: "32px" }}
                  />
                </Link>
                {!collapsed && (
                  <Text strong style={{ color: token.colorText }}>
                    Pool des Séries Éliminatoires
                  </Text>
                )}
              </div>
              <Menu
                theme={isDarkMode ? "dark" : "light"}
                mode="inline"
                selectedKeys={getSelectedKey()}
                items={menuItems}
                style={{
                  background: token.colorBgContainer,
                  borderRight: "none",
                }}
              />
            </Sider>
          </motion.div>
        </AnimatePresence>
        <Layout
          style={{
            marginLeft: collapsed
              ? isMobile
                ? 0
                : LAYOUT_CONFIG.siderCollapsedWidth
              : LAYOUT_CONFIG.siderWidth,
            transition: "all 0.2s",
            background: token.colorBgContainer,
          }}
        >
          <motion.div
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <Header
              style={{
                padding: "0 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: token.colorBgContainer,
                position: "sticky",
                top: 0,
                zIndex: 1,
                height: LAYOUT_CONFIG.headerHeight,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: "64px",
                  height: "64px",
                  color: token.colorText,
                }}
              />
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <ThemeToggle />
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <Space
                    style={{
                      cursor: "pointer",
                      padding: "8px",
                      borderRadius: "8px",
                      transition: "background-color 0.2s",
                    }}
                    className="hover-effect"
                  >
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ backgroundColor: token.colorPrimary }}
                    />
                    {!isMobile && (
                      <Text style={{ color: token.colorText }}>
                        {user?.name || "Utilisateur"}
                      </Text>
                    )}
                  </Space>
                </Dropdown>
              </div>
            </Header>
          </motion.div>
          <Content
            style={{
              margin: "24px 24px",
              padding: 24,
              minHeight: 280,
              background: token.colorBgContainer,
              borderRadius: token.borderRadius,
              transition: "all 0.2s",
            }}
          >
            <AnimatePresence mode="wait">
              {routeLoading ? (
                <Loading fullPage={false} />
              ) : (
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Outlet />
                </motion.div>
              )}
            </AnimatePresence>
          </Content>
        </Layout>
        {showBackToTop && (
          <FloatButton.BackTop
            icon={<ArrowUpOutlined />}
            style={{ right: 24, bottom: 24 }}
          />
        )}
      </Layout>
    </ToastProvider>
  );
};

export default MainLayout;
