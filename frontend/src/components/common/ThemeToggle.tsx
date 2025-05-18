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

const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();
  const { token } = theme.useToken();
  const [menuOpen, setMenuOpen] = React.useState(false);

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
    >
      <button
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
        aria-label="Toggle theme"
      >
        <span
          style={{
            display: "inline-block",
            fontSize: "20px",
            color: isDarkMode ? token.colorWarning : token.colorText,
          }}
        >
          <BulbOutlined
            style={{ filter: isDarkMode ? "brightness(1.2)" : "none" }}
          />
        </span>
      </button>
    </Dropdown>
  );
};

export default ThemeToggle;
