import { Outlet } from "react-router-dom";
import { Layout, theme } from "antd";
import { getImageUrl } from "../utils/imageUrl";
import { motion } from "framer-motion";

const AuthLayout = () => {
  const { token } = theme.useToken();

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: token.colorBgContainer,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          maxWidth: "650px",
          width: "100%",
          padding: "24px",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img
            src={getImageUrl("/images/playoff.png")}
            alt="Logo des Séries Éliminatoires de la Coupe Stanley"
            style={{
              width: "85px",
              height: "85px",
              filter:
                token.colorBgContainer === "#ffffff"
                  ? "none"
                  : "brightness(0.9)",
            }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            width: "100%",
            background: token.colorBgElevated,
            padding: "24px",
            borderRadius: token.borderRadius,
            boxShadow: token.boxShadow,
          }}
        >
          <Outlet />
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default AuthLayout;
