import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import { ToastProvider } from "./components/common/Loading";
import { ThemeProvider } from "./contexts/ThemeContext";
import App from "./App";
import "./index.css";
import { THEME_CONFIG } from "./config";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: THEME_CONFIG.defaultPrimaryColor,
            borderRadius: THEME_CONFIG.borderRadius,
            motionDurationMid: `${THEME_CONFIG.transitionDuration}ms`,
          },
        }}
      >
        <ToastProvider>
          <App />
        </ToastProvider>
      </ConfigProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
