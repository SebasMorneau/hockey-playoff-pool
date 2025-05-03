import { Typography, theme } from "antd";

const { Title, Paragraph } = Typography;

const ManageSystem = () => {
  const { token } = theme.useToken();

  return (
    <div>
      <Title level={2} style={{ color: token.colorText }}>
        Gérer le Système
      </Title>
      <Paragraph style={{ color: token.colorText }}>
        Ceci est un espace réservé pour la page de Gestion du Système.
      </Paragraph>
    </div>
  );
};

export default ManageSystem;
