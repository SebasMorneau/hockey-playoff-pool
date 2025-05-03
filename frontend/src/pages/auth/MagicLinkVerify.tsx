import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Typography, theme } from "antd";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;

const MagicLinkVerify = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { token } = theme.useToken();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError(
          "Aucun jeton fourni. Veuillez demander un nouveau lien de connexion.",
        );
        setVerifying(false);
        return;
      }

      try {
        const response = await api.auth.verifyMagicLink(token);
        const { token: authToken, user } = response.data;
        login(authToken, user);
        navigate("/", { replace: true });
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "status" in error.response &&
          error.response.status === 404
        ) {
          setError(
            "Jeton invalide. Veuillez demander un nouveau lien de connexion.",
          );
        } else if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "status" in error.response &&
          error.response.status === 401
        ) {
          setError(
            "Jeton expiré. Veuillez demander un nouveau lien de connexion.",
          );
        } else {
          setError(
            "Échec de la vérification du lien de connexion. Veuillez réessayer.",
          );
        }
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate, login]);

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
        textAlign: "center",
      }}
    >
      <AnimatePresence mode="wait">
        {verifying ? (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              style={{ marginBottom: 24 }}
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
            <Title
              level={4}
              style={{
                color: token.colorText,
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              Vérification de votre connexion
            </Title>
            <Text
              style={{
                color: token.colorTextSecondary,
                textAlign: "center",
                display: "block",
              }}
            >
              Veuillez patienter pendant que nous vérifions votre lien de
              connexion...
            </Text>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              style={{ marginBottom: 24 }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: "easeInOut",
              }}
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill={token.colorError}
                opacity="0.15"
              />
              <polygon points="32,12 56,52 8,52" fill={token.colorError} />
              <rect
                x="29"
                y="28"
                width="6"
                height="14"
                rx="3"
                fill={token.colorBgContainer}
              />
              <rect
                x="29"
                y="46"
                width="6"
                height="6"
                rx="3"
                fill={token.colorBgContainer}
              />
            </motion.svg>
            <Title
              level={4}
              style={{
                color: token.colorText,
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              Échec de la Connexion
            </Title>
            <Text
              style={{
                color: token.colorTextSecondary,
                textAlign: "center",
                display: "block",
                marginBottom: "24px",
              }}
            >
              {error}
            </Text>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Button
                type="primary"
                onClick={() => navigate("/login")}
                size="large"
                block
                style={{
                  height: "42px",
                  background: token.colorPrimary,
                  borderColor: token.colorPrimary,
                }}
              >
                Retour à la Connexion
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              style={{ marginBottom: 24 }}
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill={token.colorSuccess}
                opacity="0.15"
              />
              <circle cx="32" cy="32" r="24" fill={token.colorSuccess} />
              <polyline
                points="20,34 30,44 46,24"
                fill="none"
                stroke={token.colorBgContainer}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
            <Title
              level={4}
              style={{
                color: token.colorText,
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              Connexion Réussie
            </Title>
            <Text
              style={{
                color: token.colorTextSecondary,
                textAlign: "center",
                display: "block",
                marginBottom: "24px",
              }}
            >
              Vous allez être redirigé vers la page d&apos;accueil...
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MagicLinkVerify;
