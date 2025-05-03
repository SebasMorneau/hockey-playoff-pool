import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Switch,
  InputNumber,
  Divider,
  Space,
  Alert,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import axiosInstance from "../../utils/axios";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../../components/common/Loading";

const { Title, Text } = Typography;

interface PoolConfig {
  id: number;
  season: string;
  allowLatePredictions: boolean;
  pointsForCorrectWinner: number;
  pointsForCorrectGames: number;
  pointsForFinalistTeam: number;
  pointsForChampion: number;
  pointsForChampionGames: number;
  createdAt: string;
  updatedAt: string;
}

type PoolConfigFormValues = Omit<PoolConfig, "id" | "createdAt" | "updatedAt">;

const PoolConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PoolConfig | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/admin/config");
      setConfig(response.data.config);
      form.setFieldsValue(response.data.config);
    } catch (error) {
      message.error("Échec de la récupération de la configuration du pool");
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSubmit = async (values: PoolConfigFormValues) => {
    setActionLoading(true);
    setSaving(true);
    try {
      const configData = {
        season: values.season,
        allowLatePredictions: values.allowLatePredictions || false,
        pointsForCorrectWinner: Number(values.pointsForCorrectWinner) || 1,
        pointsForCorrectGames: Number(values.pointsForCorrectGames) || 2,
        pointsForFinalistTeam: Number(values.pointsForFinalistTeam) || 1,
        pointsForChampion: Number(values.pointsForChampion) || 1,
        pointsForChampionGames: Number(values.pointsForChampionGames) || 2,
      };

      await axiosInstance.put("/admin/config", configData);
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      message.success("Configuration du pool mise à jour avec succès");
      fetchConfig();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      message.error(
        axiosError.response?.data?.message ||
          "Échec de la mise à jour de la configuration du pool",
      );
    } finally {
      setSaving(false);
      setActionLoading(false);
    }
  };

  const handleReset = () => {
    if (config) {
      form.setFieldsValue(config);
    }
  };

  return (
    <div>
      <Card>
        <AnimatePresence>
          {actionLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loading />
            </motion.div>
          )}
          {successAnim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: "#52c41a",
              }}
            >
              ✔
            </motion.div>
          )}
        </AnimatePresence>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Title level={3}>Configuration du Pool</Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={loading || saving}
            >
              Réinitialiser
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={saving}
              disabled={loading}
            >
              Enregistrer les Modifications
            </Button>
          </Space>
        </div>

        <Alert
          message="Configuration du Pool"
          description="Configurez les paramètres pour le pool des séries éliminatoires. Les modifications affecteront la façon dont les points sont attribués et comment les utilisateurs peuvent interagir avec le pool."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading || saving}
          initialValues={{
            allowLatePredictions: false,
            pointsForCorrectWinner: 1,
            pointsForCorrectGames: 2,
            pointsForFinalistTeam: 1,
            pointsForChampion: 1,
            pointsForChampionGames: 2,
          }}
        >
          <Form.Item
            name="season"
            label="Saison Actuelle"
            rules={[{ required: true, message: "Veuillez saisir la saison!" }]}
          >
            <Input placeholder="ex: 2024-2025" />
          </Form.Item>

          <Divider orientation="left">Paramètres de Prédiction</Divider>

          <Form.Item
            name="allowLatePredictions"
            label="Autoriser les Prédictions Tardives"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left">Paramètres de Points</Divider>

          <Form.Item
            name="pointsForCorrectWinner"
            label="Points pour le Gagnant Correct"
            rules={[
              {
                required: true,
                message: "Veuillez saisir les points pour le gagnant correct!",
              },
            ]}
          >
            <InputNumber min={0} max={10} />
          </Form.Item>

          <Form.Item
            name="pointsForCorrectGames"
            label="Points pour les Matchs Corrects"
            rules={[
              {
                required: true,
                message: "Veuillez saisir les points pour les matchs corrects!",
              },
            ]}
          >
            <InputNumber min={0} max={10} />
          </Form.Item>

          <Divider orientation="left">Points de la Coupe Stanley</Divider>

          <Form.Item
            name="pointsForFinalistTeam"
            label="Points pour l'Équipe Finaliste"
            rules={[
              {
                required: true,
                message: "Veuillez saisir les points pour l'équipe finaliste!",
              },
            ]}
          >
            <InputNumber min={0} max={10} />
          </Form.Item>

          <Form.Item
            name="pointsForChampion"
            label="Points pour le Champion"
            rules={[
              {
                required: true,
                message: "Veuillez saisir les points pour le champion!",
              },
            ]}
          >
            <InputNumber min={0} max={10} />
          </Form.Item>

          <Form.Item
            name="pointsForChampionGames"
            label="Points pour les Matchs du Champion"
            rules={[
              {
                required: true,
                message:
                  "Veuillez saisir les points pour les matchs du champion!",
              },
            ]}
          >
            <InputNumber min={0} max={10} />
          </Form.Item>

          <Text type="secondary">
            Dernière mise à jour:{" "}
            {config?.updatedAt
              ? new Date(config.updatedAt).toLocaleString()
              : "Jamais"}
          </Text>
        </Form>
      </Card>
    </div>
  );
};

export default PoolConfig;
