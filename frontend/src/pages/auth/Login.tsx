import { useState } from "react";
import { Form, Input, Button, Typography, message, theme } from "antd";
import { MailOutlined } from "@ant-design/icons";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [email, setEmail] = useState("");
  const { token } = theme.useToken();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (values: { email: string }) => {
    try {
      setLoading(true);
      await api.auth.requestMagicLink(values.email);
      setEmail(values.email);
      setMessageSent(true);
    } catch (error) {
      message.error(
        "Échec de l'envoi du lien de connexion. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ duration: 0.6, type: "spring" }}
      style={{
        padding: "32px 48px",
        background: token.colorBgElevated,
        borderRadius: token.borderRadius,
        boxShadow: token.boxShadow,
        border: `1px solid ${token.colorBorderSecondary}`,
        width: "100%",
        maxWidth: "600px",
      }}
    >
      <AnimatePresence mode="wait">
        {!messageSent ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              style={{ textAlign: "center" }}
            >
              {/* Animated SVG: Hockey Stick & Puck */}
              <motion.svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                style={{ marginBottom: 16 }}
                initial={{ rotate: -8 }}
                animate={{ rotate: [-8, 8, -8] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <rect
                  x="60"
                  y="10"
                  width="8"
                  height="48"
                  rx="4"
                  fill={isDarkMode ? "#d4b483" : "#bfa16c"}
                />
                <rect
                  x="60"
                  y="58"
                  width="16"
                  height="8"
                  rx="4"
                  fill={token.colorPrimary}
                />
                <ellipse
                  cx="24"
                  cy="68"
                  rx="16"
                  ry="6"
                  fill={token.colorText}
                />
                <ellipse
                  cx="24"
                  cy="68"
                  rx="12"
                  ry="4"
                  fill={token.colorTextSecondary}
                />
                <ellipse
                  cx="24"
                  cy="68"
                  rx="7"
                  ry="2"
                  fill={token.colorText}
                  opacity="0.5"
                />
              </motion.svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            >
              <Title
                level={4}
                style={{
                  color: token.colorText,
                  textAlign: "center",
                  marginTop: 0,
                  marginBottom: "16px",
                }}
              >
                Bienvenue au Pool des Séries Éliminatoires de la LNH
              </Title>
              <Paragraph
                style={{
                  color: token.colorTextSecondary,
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                Entrez votre email pour recevoir un lien magique de connexion
                sans mot de passe
              </Paragraph>
              <Form
                name="login"
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                style={{ width: "100%" }}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Veuillez entrer votre email" },
                    {
                      type: "email",
                      message: "Veuillez entrer un email valide",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <MailOutlined
                        style={{ color: token.colorTextSecondary }}
                      />
                    }
                    placeholder="Entrez votre email"
                    size="large"
                    autoComplete="email"
                    style={{
                      background: token.colorBgContainer,
                      borderColor: token.colorBorder,
                    }}
                  />
                </Form.Item>
                <Form.Item>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      loading={loading}
                      style={{
                        height: "42px",
                        background: token.colorPrimary,
                        borderColor: token.colorPrimary,
                      }}
                    >
                      Envoyer un lien de connexion
                    </Button>
                  </motion.div>
                </Form.Item>
              </Form>
              <Paragraph
                type="secondary"
                style={{
                  textAlign: "center",
                  fontSize: "0.9em",
                  color: token.colorTextSecondary,
                  marginTop: "24px",
                  marginBottom: 0,
                }}
              >
                Aucun mot de passe nécessaire. Nous vous enverrons un lien
                magique pour vous connecter instantanément.
              </Paragraph>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="message-sent"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              style={{ textAlign: "center" }}
            >
              {/* Animated SVG: Mail */}
              <motion.svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                style={{ margin: "32px 0" }}
                initial={{ y: 0 }}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
              >
                <rect
                  x="8"
                  y="16"
                  width="48"
                  height="32"
                  rx="6"
                  fill={token.colorPrimary}
                />
                <polyline
                  points="8,16 32,40 56,16"
                  fill="none"
                  stroke={token.colorBgContainer}
                  strokeWidth="3"
                />
              </motion.svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            >
              <Title
                level={4}
                style={{
                  color: token.colorText,
                  textAlign: "center",
                  marginTop: 0,
                  marginBottom: "24px",
                }}
              >
                Vérifiez votre email
              </Title>
              <Paragraph
                style={{
                  color: token.colorTextSecondary,
                  textAlign: "center",
                  marginBottom: "16px",
                }}
              >
                Nous avons envoyé un lien de connexion à{" "}
                <Text strong style={{ color: token.colorText }}>
                  {email}
                </Text>
              </Paragraph>
              <Paragraph
                style={{
                  color: token.colorTextSecondary,
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                Veuillez vérifier votre boîte de réception et cliquer sur le
                lien pour vous connecter. Le lien expirera dans 30 minutes.
              </Paragraph>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button
                  onClick={() => setMessageSent(false)}
                  size="large"
                  block
                  style={{
                    height: "42px",
                    background: token.colorBgContainer,
                    borderColor: token.colorBorder,
                    color: token.colorText,
                  }}
                >
                  Retour
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Login;
