/* eslint-disable react/no-unescaped-entities */
import { Typography, theme, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const { Title, Paragraph } = Typography;

const NotFound = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <div style={{ padding: "24px" }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ textAlign: "center" }}
      >
        {/* Animated SVG: Lost Hockey Puck */}
        <motion.svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ marginBottom: 24 }}
          initial={{ rotate: -10 }}
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ellipse
            cx="60"
            cy="100"
            rx="40"
            ry="10"
            fill={token.colorPrimary}
            opacity="0.12"
          />
          <ellipse cx="60" cy="70" rx="40" ry="18" fill="#222" />
          <ellipse cx="60" cy="70" rx="32" ry="10" fill="#444" />
          <ellipse cx="60" cy="70" rx="18" ry="5" fill="#222" opacity="0.5" />
          <motion.text
            x="60"
            y="75"
            textAnchor="middle"
            fontSize="18"
            fill={token.colorPrimary}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
          >
            ?
          </motion.text>
        </motion.svg>
        <Title level={1} style={{ color: token.colorText }}>
          404 - Page Non Trouvée
        </Title>
        <Paragraph
          style={{ color: token.colorTextSecondary, marginBottom: 32 }}
        >
          La page que vous recherchez n&apos;existe pas.
          <br />
          Peut-être que le puck s&apos;est perdu sur la glace!
        </Paragraph>
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Button
            type="primary"
            size="large"
            style={{
              background: token.colorPrimary,
              borderRadius: 24,
              fontWeight: 600,
            }}
            onClick={() => navigate("/")}
          >
            Retour à l&apos;Accueil
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
