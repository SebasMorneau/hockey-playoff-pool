import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Tabs,
  theme,
  Popconfirm,
  Space,
  Typography,
} from "antd";
import api from "../../services/api";
import type { TabsProps } from "antd";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import ManagePredictions from "./ManagePredictions";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../../components/common/Loading";

const { Title } = Typography;

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  conference: string;
  division: string;
  active: boolean;
}

interface Round {
  id: number;
  name: string;
  number: number;
  season: string;
  active: boolean;
}

interface Series {
  id: number;
  roundId: number;
  homeTeamId: number;
  awayTeamId: number;
  winningTeamId: number | null;
  homeTeamWins: number;
  awayTeamWins: number;
  gamesPlayed: number;
  completed: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  HomeTeam: Team;
  AwayTeam: Team;
  WinningTeam: Team | null;
  Round: Round;
}

// Add these interfaces for form values
interface RoundFormValues {
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  season: string;
}

interface SeriesFormValues {
  roundId: number;
  homeTeamId: number;
  awayTeamId: number;
  startDate: string;
}

interface UpdateSeriesFormValues {
  homeTeamId: number;
  awayTeamId: number;
  homeTeamWins: number;
  awayTeamWins: number;
  gamesPlayed: number;
  completed: boolean;
}

// Add this interface for error handling
interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

const ManagePlayoffs: React.FC = () => {
  const { token } = theme.useToken();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [roundModalVisible, setRoundModalVisible] = useState(false);
  const [seriesModalVisible, setSeriesModalVisible] = useState(false);
  const [roundForm] = Form.useForm();
  const [seriesForm] = Form.useForm();
  const [updateSeriesModalVisible, setUpdateSeriesModalVisible] =
    useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [updateSeriesForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      message.error("Unauthorized access");
      navigate("/");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roundsRes, seriesRes, teamsRes] = await Promise.all([
        api.rounds.getAllRounds(),
        api.series.getAllSeries(),
        api.teams.getAllTeams(),
      ]);
      console.log("Rounds:", roundsRes.data);
      console.log("Series:", seriesRes.data);
      console.log("Teams:", teamsRes.data);
      setRounds(roundsRes.data.rounds || []);
      setSeries(seriesRes.data || []);
      setTeams(teamsRes.data.teams || []);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || "Error fetching data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoundSubmit = async (values: RoundFormValues) => {
    setActionLoading(true);
    try {
      await api.admin.createRound(
        values.name,
        values.number,
        values.startDate,
        values.endDate,
        values.season,
      );
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      message.success("Round created successfully");
      roundForm.resetFields();
      fetchData();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || "Error creating round");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeriesSubmit = async (values: SeriesFormValues) => {
    setActionLoading(true);
    try {
      await api.admin.createSeries(
        values.roundId,
        values.homeTeamId,
        values.awayTeamId,
        values.startDate,
      );
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      message.success("Series created successfully");
      setUpdateSeriesModalVisible(false);
      seriesForm.resetFields();
      fetchData();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(
        apiError.response?.data?.message || "Error creating series",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSeries = (series: Series) => {
    setSelectedSeries(series);
    updateSeriesForm.setFieldsValue({
      homeTeamId: series.homeTeamId,
      awayTeamId: series.awayTeamId,
      homeTeamWins: series.homeTeamWins,
      awayTeamWins: series.awayTeamWins,
      gamesPlayed: series.gamesPlayed,
      completed: series.completed,
    });
    setUpdateSeriesModalVisible(true);
  };

  const handleUpdateSeriesSubmit = async (values: UpdateSeriesFormValues) => {
    if (!selectedSeries) return;

    setActionLoading(true);
    try {
      // Update teams if they've changed
      if (
        values.homeTeamId !== selectedSeries.homeTeamId ||
        values.awayTeamId !== selectedSeries.awayTeamId
      ) {
        await api.admin.createSeries(
          selectedSeries.roundId,
          values.homeTeamId,
          values.awayTeamId,
          selectedSeries.startDate,
        );
      }

      // Convert string values to numbers
      const homeTeamWins = Number(values.homeTeamWins);
      const awayTeamWins = Number(values.awayTeamWins);
      const gamesPlayed = Number(values.gamesPlayed);

      // Validate that the sum of wins equals games played
      if (homeTeamWins + awayTeamWins !== gamesPlayed) {
        message.error("Total games played must equal sum of wins");
        return;
      }

      await api.admin.updateSeriesResults(
        selectedSeries.id,
        homeTeamWins,
        awayTeamWins,
        values.completed,
        gamesPlayed,
      );
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      message.success("Series updated successfully");
      setUpdateSeriesModalVisible(false);
      updateSeriesForm.resetFields();
      setSelectedSeries(null);
      fetchData();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(
        apiError.response?.data?.message || "Error updating series",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSeries = async (id: number) => {
    setDeleteLoading(id);
    setActionLoading(true);
    try {
      await api.series.deleteSeries(id);
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      message.success("Series deleted successfully");
      fetchData();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(
        apiError.response?.data?.message || "Failed to delete series",
      );
    } finally {
      setDeleteLoading(null);
      setActionLoading(false);
    }
  };

  const roundColumns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span style={{ color: token.colorText }}>{text}</span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (active ? "Actif" : "Inactif"),
    },
  ];

  const seriesColumns = [
    {
      title: "Ronde",
      key: "round",
      render: (record: Series) => record.Round?.name || "Ronde Inconnue",
    },
    {
      title: "Match",
      key: "matchup",
      render: (record: Series) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "bold" }}>
            {record.HomeTeam?.name || "Équipe Inconnue"}
          </span>
          <span>vs</span>
          <span style={{ fontWeight: "bold" }}>
            {record.AwayTeam?.name || "Équipe Inconnue"}
          </span>
        </div>
      ),
    },
    {
      title: "Date de Début",
      key: "startDate",
      render: (record: Series) =>
        record.startDate
          ? new Date(record.startDate).toLocaleDateString()
          : "Non définie",
    },
    {
      title: "Score",
      key: "score",
      render: (record: Series) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontWeight: "bold",
              color:
                record.homeTeamWins > record.awayTeamWins
                  ? "#52c41a"
                  : "inherit",
            }}
          >
            {record.homeTeamWins}
          </span>
          <span>-</span>
          <span
            style={{
              fontWeight: "bold",
              color:
                record.awayTeamWins > record.homeTeamWins
                  ? "#52c41a"
                  : "inherit",
            }}
          >
            {record.awayTeamWins}
          </span>
        </div>
      ),
    },
    {
      title: "Matchs Joués",
      dataIndex: "gamesPlayed",
      key: "gamesPlayed",
    },
    {
      title: "Statut",
      key: "status",
      render: (record: Series) => (
        <span
          style={{
            color: record.completed ? "#52c41a" : "#1890ff",
            fontWeight: "bold",
          }}
        >
          {record.completed ? "Terminé" : "En Cours"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Series) => (
        <Space>
          <Button type="primary" onClick={() => handleUpdateSeries(record)}>
            Mettre à jour le Score
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette série?"
            description="Cette action ne peut pas être annulée."
            onConfirm={() => handleDeleteSeries(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="primary" danger loading={deleteLoading === record.id}>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const items: TabsProps["items"] = [
    {
      key: "rounds",
      label: "Rondes",
      children: (
        <div>
          <Title level={3}>Gérer les Rondes</Title>
          <Button
            type="primary"
            onClick={() => setRoundModalVisible(true)}
            style={{ marginBottom: "16px" }}
          >
            Ajouter une Ronde
          </Button>
          <Table
            columns={roundColumns}
            dataSource={rounds}
            loading={loading}
            rowKey="id"
          />
        </div>
      ),
    },
    {
      key: "series",
      label: "Séries",
      children: (
        <div>
          <Title level={3}>Gérer les Séries</Title>
          <Button
            type="primary"
            onClick={() => setSeriesModalVisible(true)}
            style={{ marginBottom: "16px" }}
          >
            Ajouter une Série
          </Button>
          <Table
            columns={seriesColumns}
            dataSource={series}
            loading={loading}
            rowKey="id"
          />
        </div>
      ),
    },
    {
      key: "predictions",
      label: "Prédictions",
      children: <ManagePredictions />,
    },
  ];

  return (
    <div style={{ color: token.colorText }}>
      <div className="themed-table">
        <Tabs items={items} />
      </div>

      <style>
        {`
          .themed-table .ant-table {
            color: ${token.colorText};
          }
          .themed-table .ant-table-thead > tr > th {
            color: ${token.colorText};
          }
          .themed-table .ant-table-tbody > tr > td {
            color: ${token.colorText};
          }
          .ant-modal-title {
            color: ${token.colorText} !important;
          }
          .ant-form-item-label > label {
            color: ${token.colorText};
          }
          .ant-tabs-tab {
            color: ${token.colorTextSecondary};
          }
          .ant-tabs-tab-active {
            color: ${token.colorText} !important;
          }
        `}
      </style>

      <Modal
        title="Créer une Ronde"
        open={roundModalVisible}
        onCancel={() => {
          setRoundModalVisible(false);
          roundForm.resetFields();
        }}
        footer={null}
      >
        <AnimatePresence>
          {actionLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
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
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#52c41a", fontSize: "24px" }}>✔</div>
            </motion.div>
          )}
        </AnimatePresence>
        <Form form={roundForm} onFinish={handleRoundSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Nom"
            rules={[
              {
                required: true,
                message: "Veuillez saisir le nom de la ronde!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="number"
            label="Numéro de Ronde"
            rules={[
              {
                required: true,
                message: "Veuillez saisir le numéro de la ronde!",
              },
            ]}
          >
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Date de Début"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner la date de début!",
              },
            ]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="Date de Fin"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner la date de fin!",
              },
            ]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="season"
            label="Saison"
            rules={[{ required: true, message: "Veuillez saisir la saison!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Créer une Ronde
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Créer une Série"
        open={seriesModalVisible}
        onCancel={() => {
          setSeriesModalVisible(false);
          seriesForm.resetFields();
        }}
        footer={null}
      >
        <AnimatePresence>
          {actionLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
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
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#52c41a", fontSize: "24px" }}>✔</div>
            </motion.div>
          )}
        </AnimatePresence>
        <Form form={seriesForm} onFinish={handleSeriesSubmit} layout="vertical">
          <Form.Item
            name="roundId"
            label="Ronde"
            rules={[
              { required: true, message: "Veuillez sélectionner la ronde!" },
            ]}
          >
            <Select>
              {rounds.map((round) => (
                <Select.Option key={round.id} value={round.id}>
                  {round.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="homeTeamId"
            label="Équipe Domicile"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner l'équipe à domicile!",
              },
            ]}
          >
            <Select>
              {teams.map((team) => (
                <Select.Option key={team.id} value={team.id}>
                  {team.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="awayTeamId"
            label="Équipe Extérieur"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner l'équipe à l'extérieur!",
              },
            ]}
          >
            <Select>
              {teams.map((team) => (
                <Select.Option key={team.id} value={team.id}>
                  {team.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Date de Début"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner la date de début!",
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Créer une Série
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Mettre à jour la Série"
        open={updateSeriesModalVisible}
        onCancel={() => {
          setUpdateSeriesModalVisible(false);
          setSelectedSeries(null);
          updateSeriesForm.resetFields();
        }}
        footer={null}
      >
        <AnimatePresence>
          {actionLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
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
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#52c41a", fontSize: "24px" }}>✔</div>
            </motion.div>
          )}
        </AnimatePresence>
        <Form
          form={updateSeriesForm}
          layout="vertical"
          onFinish={handleUpdateSeriesSubmit}
        >
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Équipes</h3>
            <Form.Item
              name="homeTeamId"
              label="Équipe Domicile"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner l'équipe à domicile!",
                },
              ]}
            >
              <Select>
                {teams.map((team) => (
                  <Select.Option key={team.id} value={team.id}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="awayTeamId"
              label="Équipe Extérieur"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner l'équipe à l'extérieur!",
                },
              ]}
            >
              <Select>
                {teams.map((team) => (
                  <Select.Option key={team.id} value={team.id}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Score</h3>
            <Form.Item
              name="homeTeamWins"
              label="Victoires à Domicile"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le nombre de victoires à domicile",
                },
              ]}
            >
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item
              name="awayTeamWins"
              label="Victoires à l'Extérieur"
              rules={[
                {
                  required: true,
                  message:
                    "Veuillez saisir le nombre de victoires à l'extérieur",
                },
              ]}
            >
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item
              name="gamesPlayed"
              label="Matchs Joués"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le nombre de matchs joués",
                },
              ]}
            >
              <Input type="number" min={0} />
            </Form.Item>
          </div>

          <Form.Item name="completed" valuePropName="checked">
            <Input type="checkbox" /> Série Terminée
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Mettre à jour la Série
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagePlayoffs;
