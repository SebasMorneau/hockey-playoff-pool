import React from "react";
import { Dropdown, Space, theme } from "antd";
import {
  BulbOutlined,
  CheckOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();
  const { token } = theme.useToken();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [bulbAnim, setBulbAnim] = React.useState(false);

  const items = [
    {
      key: "light",
      label: (
        <Space>
          <SunOutlined />
          Light
          {themeMode === "light" && <CheckOutlined />}
        </Space>
      ),
    },
    {
      key: "dark",
      label: (
        <Space>
          <MoonOutlined />
          Dark
          {themeMode === "dark" && <CheckOutlined />}
        </Space>
      ),
    },
    {
      key: "auto",
      label: (
        <Space>
          <DesktopOutlined />
          System
          {themeMode === "auto" && <CheckOutlined />}
        </Space>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => setThemeMode(key as "light" | "dark" | "auto"),
        style: {
          background: token.colorBgElevated,
          borderRadius: token.borderRadius,
          boxShadow: token.boxShadow,
        },
      }}
      trigger={["click"]}
      open={menuOpen}
      onOpenChange={setMenuOpen}
      dropdownRender={(menu) => (
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {menu}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    >
      <motion.button
        type="button"
        style={{
          background: "none",
          border: "none",
          padding: "8px",
          cursor: "pointer",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.2s",
        }}
        className="hover-effect"
        whileTap={{ scale: 0.92, rotate: 18 }}
        onClick={() => {
          setBulbAnim(true);
          setTimeout(() => setBulbAnim(false), 400);
        }}
        aria-label="Toggle theme"
      >
        <motion.span
          animate={
            bulbAnim
              ? { rotate: [0, 18, -12, 0], scale: [1, 1.18, 0.92, 1] }
              : {}
          }
          transition={{ duration: 0.4 }}
          style={{
            display: "inline-block",
            fontSize: "20px",
            color: isDarkMode ? token.colorWarning : token.colorText,
          }}
        >
          <BulbOutlined
            style={{ filter: isDarkMode ? "brightness(1.2)" : "none" }}
          />
        </motion.span>
      </motion.button>
    </Dropdown>
  );
};

export default ThemeToggle;
