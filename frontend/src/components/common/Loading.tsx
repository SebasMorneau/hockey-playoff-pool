import React, { useState, useCallback, useContext, createContext } from "react";
import { Space, theme } from "antd";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingProps {
  tip?: string;
  size?: "small" | "default" | "large";
  fullPage?: boolean;
}

// Toast context and provider
const ToastContext = createContext<{
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
} | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = theme.useToken();
  const [toasts, setToasts] = useState<
    { id: number; msg: string; type: string }[]
  >([]);
  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info" = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3200,
      );
    },
    [],
  );
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", top: 24, right: 24, zIndex: 3000 }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.32 }}
              style={{
                marginBottom: 12,
                background:
                  toast.type === "success"
                    ? token.colorSuccessBg
                    : toast.type === "error"
                      ? token.colorErrorBg
                      : token.colorInfoBg,
                color:
                  toast.type === "success"
                    ? token.colorSuccess
                    : toast.type === "error"
                      ? token.colorError
                      : token.colorInfo,
                border: `1px solid ${
                  toast.type === "success"
                    ? token.colorSuccessBorder
                    : toast.type === "error"
                      ? token.colorErrorBorder
                      : token.colorInfoBorder
                }`,
                borderRadius: token.borderRadius,
                padding: "12px 20px",
                minWidth: 220,
                boxShadow: token.boxShadow,
                fontWeight: 500,
                fontSize: 15,
              }}
            >
              {toast.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const Loading: React.FC<LoadingProps> = ({
  tip = "Loading...",
  size = "large",
  fullPage = false,
}) => {
  const { token } = theme.useToken();

  // Animated SVG Hockey Puck
  const AnimatedPuck = (
    <motion.svg
      width={size === "small" ? 40 : size === "default" ? 48 : 64}
      height={size === "small" ? 40 : size === "default" ? 48 : 64}
      viewBox="0 0 64 64"
      initial={{ rotate: 0, y: 0 }}
      animate={{ rotate: 360, y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      style={{ display: "block", margin: "0 auto" }}
    >
      <ellipse
        cx="32"
        cy="48"
        rx="24"
        ry="8"
        fill={token.colorTextSecondary}
        opacity="0.15"
      />
      <ellipse cx="32" cy="32" rx="24" ry="12" fill={token.colorText} />
      <ellipse cx="32" cy="32" rx="20" ry="8" fill={token.colorTextSecondary} />
      <ellipse
        cx="32"
        cy="32"
        rx="12"
        ry="4"
        fill={token.colorText}
        opacity="0.5"
      />
    </motion.svg>
  );

  if (fullPage) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            width: "100vw",
            position: "fixed",
            top: 0,
            left: 0,
            backgroundColor: token.colorBgMask,
            zIndex: 9999,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: token.colorBgElevated,
              padding: "32px",
              borderRadius: token.borderRadius,
              boxShadow: token.boxShadow,
            }}
          >
            <Space direction="vertical" align="center">
              {AnimatedPuck}
              {tip && (
                <div
                  style={{
                    marginTop: 16,
                    fontWeight: 500,
                    color: token.colorText,
                  }}
                >
                  {tip}
                </div>
              )}
              <div
                style={{
                  color: token.colorTextSecondary,
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                {tip === "Loading..." &&
                  "Patience, the ice is being resurfaced!"}
              </div>
            </Space>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 0",
        width: "100%",
      }}
    >
      <Space direction="vertical" align="center">
        {AnimatedPuck}
        {tip && (
          <div
            style={{
              marginTop: 16,
              color: token.colorText,
            }}
          >
            {tip}
          </div>
        )}
      </Space>
    </motion.div>
  );
};

export default Loading;
