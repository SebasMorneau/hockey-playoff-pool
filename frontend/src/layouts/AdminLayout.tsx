import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Layout,
  Menu,
  Breadcrumb,
  Typography,
  Button,
  theme,
  Space,
  FloatButton,
} from "antd";
import {
  TeamOutlined,
  TrophyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SettingOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import ThemeToggle from "../components/common/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { LAYOUT_CONFIG } from "../config";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { isDarkMode } = useTheme();

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

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname.split("/");
    const page = path[path.length - 1];

    switch (page) {
      case "dashboard":
        return "Tableau de Bord Admin";
      case "users":
        return "Gérer les Utilisateurs";
      case "teams":
        return "Gérer les Équipes";
      case "rounds":
        return "Gérer les Rounds";
      case "series":
        return "Gérer les Séries";
      case "system":
        return "Paramètres Système";
      default:
        return "Panneau d'Administration";
    }
  };

  const getBreadcrumbItems = () => {
    const path = location.pathname.split("/");
    const items = [
      {
        title: <Link to="/admin">Admin</Link>,
      },
    ];

    if (path.length > 2 && path[2]) {
      const title = path[2].charAt(0).toUpperCase() + path[2].slice(1);
      items.push({
        title: <Link to={`/admin/${path[2]}`}>{title}</Link>,
      });
    }

    return items;
  };

  const menuItems = [
    {
      key: "teams",
      icon: <TeamOutlined />,
      label: "Équipes",
      onClick: () => navigate("/admin/teams"),
    },
    {
      key: "playoffs",
      icon: <TrophyOutlined />,
      label: "Séries Éliminatoires",
      onClick: () => navigate("/admin/playoffs"),
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "Utilisateurs",
      onClick: () => navigate("/admin/users"),
    },
    {
      key: "config",
      icon: <SettingOutlined />,
      label: "Configuration du Pool",
      onClick: () => navigate("/admin/config"),
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname.split("/");
    return [path[2] || "dashboard"];
  };

  return (
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
              <Link to="/admin">
                <Title
                  level={4}
                  style={{
                    color: token.colorText,
                    margin: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {collapsed ? "LNH" : "Admin LNH"}
                </Title>
              </Link>
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
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              <Breadcrumb
                items={getBreadcrumbItems()}
                style={{ color: token.colorText }}
              />
            </div>
            <Space>
              <ThemeToggle />
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/")}
              >
                Retour à l&apos;Application
              </Button>
            </Space>
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
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Title
              level={3}
              style={{ marginBottom: 24, color: token.colorText }}
            >
              {getPageTitle()}
            </Title>
            <Outlet />
          </motion.div>
        </Content>
      </Layout>
      {showBackToTop && (
        <FloatButton.BackTop
          icon={<ArrowUpOutlined />}
          style={{ right: 24, bottom: 24 }}
        />
      )}
    </Layout>
  );
};

export default AdminLayout;
