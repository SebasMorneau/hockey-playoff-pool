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
  Row,
  Col,
} from "antd";
import api from "../../services/api";
import type { TabsProps } from "antd";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import ManagePredictions from "./ManagePredictions";
import Loading from "../../components/common/Loading";
import dayjs from "dayjs";

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
  startDate?: string;
  endDate?: string | null;
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
  const [roundModalVisible, setRoundModalVisible] = useState(false);
  const [seriesModalVisible, setSeriesModalVisible] = useState(false);
  const [roundForm] = Form.useForm();
  const [seriesForm] = Form.useForm();
  const [updateSeriesModalVisible, setUpdateSeriesModalVisible] =
    useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [updateSeriesForm] = Form.useForm();

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

      // Add detailed logging
      console.log("Rounds Response:", {
        data: roundsRes.data,
        hasRounds: Boolean(roundsRes.data?.rounds),
        isArray: Array.isArray(roundsRes.data?.rounds),
      });
      console.log("Series Response:", {
        data: seriesRes.data,
        isArray: Array.isArray(seriesRes.data),
      });
      console.log("Teams Response:", {
        data: teamsRes.data,
        hasTeams: Boolean(teamsRes.data?.teams),
        isArray: Array.isArray(teamsRes.data?.teams),
      });

      // Ensure we're setting arrays
      const roundsData = Array.isArray(roundsRes.data?.rounds)
        ? roundsRes.data.rounds
        : [];
      const seriesData = Array.isArray(seriesRes.data) ? seriesRes.data : [];
      const teamsData = Array.isArray(teamsRes.data?.teams)
        ? teamsRes.data.teams
        : [];

      setRounds(roundsData);
      setSeries(seriesData);
      setTeams(teamsData);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error details:", {
        error,
        message: apiError.response?.data?.message,
        response: apiError.response?.data,
      });
      message.error(apiError.response?.data?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoundSubmit = async (values: RoundFormValues) => {
    try {
      await api.admin.createRound(
        values.name,
        values.number,
        values.startDate,
        values.endDate,
        values.season,
      );
      message.success("Round created successfully");
      roundForm.resetFields();
      fetchData();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || "Error creating round");
    }
  };

  const handleSeriesSubmit = async (values: SeriesFormValues) => {
    try {
      await api.admin.createSeries(
        values.roundId,
        values.homeTeamId,
        values.awayTeamId,
        values.startDate,
      );
      message.success("Series created successfully");
      setUpdateSeriesModalVisible(false);
      seriesForm.resetFields();
      fetchData();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(
        apiError.response?.data?.message || "Error creating series",
      );
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
      startDate: series.startDate ? dayjs(series.startDate) : undefined,
      endDate: series.endDate ? dayjs(series.endDate) : undefined,
    });
    setUpdateSeriesModalVisible(true);
  };

  const handleUpdateSeriesSubmit = async (values: UpdateSeriesFormValues) => {
    if (!selectedSeries) return;

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
          values.startDate || selectedSeries.startDate,
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

      // Format dates for API call
      const startDate = values.startDate
        ? dayjs(values.startDate).format("YYYY-MM-DD")
        : undefined;

      const endDate = values.endDate
        ? dayjs(values.endDate).format("YYYY-MM-DD")
        : null;

      await api.admin.updateSeriesResults(
        selectedSeries.id,
        homeTeamWins,
        awayTeamWins,
        values.completed,
        gamesPlayed,
        undefined,
        startDate,
        endDate,
      );
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
    }
  };

  const handleDeleteSeries = async (id: number) => {
    try {
      await api.series.deleteSeries(id);
      message.success("Series deleted successfully");
      fetchData();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(
        apiError.response?.data?.message || "Failed to delete series",
      );
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Rondes",
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={() => setRoundModalVisible(true)}>
              Créer une Ronde
            </Button>
          </div>
          <Table
            dataSource={Array.isArray(rounds) ? rounds : []}
            columns={[
              {
                title: "Nom",
                dataIndex: "name",
                key: "name",
              },
              {
                title: "Numéro",
                dataIndex: "number",
                key: "number",
              },
              {
                title: "Saison",
                dataIndex: "season",
                key: "season",
              },
              {
                title: "Statut",
                dataIndex: "active",
                key: "active",
                render: (active: boolean) => (active ? "Active" : "Inactive"),
              },
            ]}
            rowKey="id"
          />
        </div>
      ),
    },
    {
      key: "2",
      label: "Séries",
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={() => setSeriesModalVisible(true)}>
              Créer une Série
            </Button>
          </div>
          <Table
            dataSource={Array.isArray(series) ? series : []}
            columns={[
              {
                title: "Ronde",
                dataIndex: ["Round", "name"],
                key: "round",
              },
              {
                title: "Équipe Domicile",
                dataIndex: ["HomeTeam", "name"],
                key: "homeTeam",
              },
              {
                title: "Équipe Extérieur",
                dataIndex: ["AwayTeam", "name"],
                key: "awayTeam",
              },
              {
                title: "Score",
                key: "score",
                render: (record: Series) => (
                  <span>
                    {record.homeTeamWins} - {record.awayTeamWins}
                  </span>
                ),
              },
              {
                title: "Statut",
                key: "status",
                render: (record: Series) => (
                  <span>{record.completed ? "Terminé" : "En cours"}</span>
                ),
              },
              {
                title: "Actions",
                key: "actions",
                render: (record: Series) => (
                  <Space>
                    <Button
                      type="link"
                      onClick={() => handleUpdateSeries(record)}
                    >
                      Modifier
                    </Button>
                    <Popconfirm
                      title="Êtes-vous sûr de vouloir supprimer cette série?"
                      onConfirm={() => handleDeleteSeries(record.id)}
                      okText="Oui"
                      cancelText="Non"
                    >
                      <Button type="link" danger>
                        Supprimer
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            rowKey="id"
          />
        </div>
      ),
    },
    {
      key: "3",
      label: "Prédictions",
      children: <ManagePredictions />,
    },
  ];

  // Add logging to debug the data
  useEffect(() => {
    console.log("Rounds:", rounds);
    console.log("Series:", series);
    console.log("Teams:", teams);
  }, [rounds, series, teams]);

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
        <Form form={seriesForm} onFinish={handleSeriesSubmit} layout="vertical">
          <Form.Item
            name="roundId"
            label="Ronde"
            rules={[
              { required: true, message: "Veuillez sélectionner la ronde!" },
            ]}
          >
            <Select>
              {Array.isArray(rounds) &&
                rounds.map((round) => (
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
              {Array.isArray(teams) &&
                teams.map((team: Team) => (
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
              {Array.isArray(teams) &&
                teams.map((team: Team) => (
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
        width={600}
        centered
      >
        {loading && (
          <div
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
              zIndex: 1001,
            }}
          >
            <Loading />
          </div>
        )}
        <Form
          form={updateSeriesForm}
          layout="vertical"
          onFinish={handleUpdateSeriesSubmit}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
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
                    {Array.isArray(teams) &&
                      teams.map((team: Team) => (
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
                    {Array.isArray(teams) &&
                      teams.map((team: Team) => (
                        <Select.Option key={team.id} value={team.id}>
                          {team.name}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Dates</h3>
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

                <Form.Item name="endDate" label="Date de Fin">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Score</h3>
                <Form.Item
                  name="homeTeamWins"
                  label="Victoires à Domicile"
                  rules={[
                    {
                      required: true,
                      message:
                        "Veuillez saisir le nombre de victoires à domicile",
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
            </Col>

            <Col xs={24} md={12}>
              <div style={{ marginTop: 55 }}>
                <Form.Item name="completed" valuePropName="checked">
                  <Input type="checkbox" /> Série Terminée
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Mettre à jour la Série
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagePlayoffs;
