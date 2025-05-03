import { useState, useEffect } from "react";
import { Typography, theme, Form, Input, Button, message, Card } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { HexColorPicker } from "react-colorful";

const { Title } = Typography;

const Profile = () => {
  const { token } = theme.useToken();
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { primaryColor, setPrimaryColor } = useTheme();
  const [color, setColor] = useState(primaryColor);
  const [colorLoading, setColorLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: { name: string; email: string }) => {
    try {
      setLoading(true);

      if (values.name !== user?.name) {
        await api.auth.updateProfile(values.name);
      }

      if (values.email !== user?.email) {
        await api.auth.updateEmail(values.email);
      }

      updateUser({
        name: values.name,
        email: values.email,
      });

      message.success("Profil mis à jour avec succès");
    } catch (error) {
      message.error("Échec de la mise à jour du profil. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <Title level={2} style={{ color: token.colorText, marginBottom: "24px" }}>
        Paramètres du Profil
      </Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: "Veuillez entrer votre nom" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Entrez votre nom"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Veuillez entrer votre email" },
              { type: "email", message: "Veuillez entrer un email valide" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Entrez votre email"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Mettre à Jour le Profil
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 32 }}>
          <Title level={4} style={{ color: token.colorText, marginBottom: 8 }}>
            Couleur Principale de l&apos;Application
          </Title>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <HexColorPicker
              color={color}
              onChange={setColor}
              style={{
                width: 120,
                height: 120,
                borderRadius: 12,
                boxShadow: `0 2px 8px ${token.colorBgElevated}`,
              }}
            />
            <div>
              <div
                style={{
                  marginBottom: 8,
                  fontWeight: 500,
                  color: token.colorText,
                }}
              >
                Aperçu :
                <span
                  style={{
                    display: "inline-block",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: color,
                    marginLeft: 12,
                    border: `2px solid ${token.colorBorderSecondary}`,
                  }}
                />
              </div>
              <Button
                type="primary"
                style={{ background: color, borderColor: color }}
                loading={colorLoading}
                onClick={async () => {
                  setColorLoading(true);
                  setTimeout(() => {
                    setPrimaryColor(color);
                    setColorLoading(false);
                  }, 600);
                }}
              >
                Appliquer la Couleur
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
