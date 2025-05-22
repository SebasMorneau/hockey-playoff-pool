import React, { useEffect, useState } from "react";
import {
  Table,
  Select,
  InputNumber,
  message,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Radio,
  Row,
  Col,
} from "antd";
import { Team } from "../../types";
import api from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../../components/common/Loading";

const { Title } = Typography;

interface UserPrediction {
  id: string | number;
  userId: number;
  userName: string;
  seriesId: number;
  predictedWinnerId: number;
  predictedGames: number;
  points: number;
  HomeTeam: Team;
  AwayTeam: Team;
  startDate: string;
}

interface SeriesData {
  id: number;
  HomeTeam: Team;
  AwayTeam: Team;
  startDate: string;
  completed: boolean;
  Predictions: {
    userId: number;
    userName: string;
    predictedWinnerId: number;
    predictedGames: number;
    points?: number;
  }[];
}

interface AdminPredictionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  users: { id: number; name: string }[];
  seriesData: SeriesData[];
}

const AdminPredictionModal: React.FC<AdminPredictionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  users,
  seriesData,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [selectedGames, setSelectedGames] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesData | null>(null);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedWinner(null);
      setSelectedGames(null);
      setSelectedSeries(null);
    }
  }, [visible, form]);

  const handleTeamSelect = (teamId: number) => {
    setSelectedWinner(teamId);
    form.setFieldsValue({ predictedWinnerId: teamId });
  };

  const handleGamesSelect = (games: number) => {
    setSelectedGames(games);
    form.setFieldsValue({ predictedGames: games });
  };

  const handleSeriesSelect = (seriesId: number) => {
    const selectedSeriesData = seriesData.find((s) => s.id === seriesId);
    setSelectedSeries(selectedSeriesData || null);
    form.setFieldsValue({
      predictedWinnerId: undefined,
      predictedGames: undefined,
    });
    setSelectedWinner(null);
    setSelectedGames(null);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      setSubmitting(true);

      await api.admin.createUserPrediction({
        userId: values.userId,
        seriesId: values.seriesId,
        predictedWinnerId: values.predictedWinnerId,
        predictedGames: values.predictedGames,
      });

      message.success("Prédiction créée avec succès!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating prediction:", error);
      message.error("Échec de la création de la prédiction.");
    } finally {
      setSubmitting(false);
    }
  };

  const gameOptions = [4, 5, 6, 7].map((games) => ({
    label: `En ${games} matchs`,
    value: games,
  }));

  return (
    <Modal
      title="Créer une Prédiction"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      maskClosable={!submitting}
      closable={!submitting}
      keyboard={!submitting}
      width={360}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="userId"
          label="Utilisateur"
          rules={[
            { required: true, message: "Veuillez sélectionner un utilisateur" },
          ]}
        >
          <Select placeholder="Sélectionner un utilisateur">
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="seriesId"
          label="Série"
          rules={[
            { required: true, message: "Veuillez sélectionner une série" },
          ]}
        >
          <Select
            placeholder="Sélectionner une série"
            onChange={handleSeriesSelect}
          >
            {seriesData.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.HomeTeam.name} vs {s.AwayTeam.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedSeries && (
          <>
            <div style={{ marginBottom: 12 }}>
              Sélectionnez l&apos;équipe victorieuse:
            </div>

            <Form.Item
              name="predictedWinnerId"
              rules={[
                { required: true, message: "Veuillez sélectionner une équipe" },
              ]}
            >
              <Radio.Group
                buttonStyle="solid"
                onChange={(e) => handleTeamSelect(e.target.value)}
                style={{ width: "100%" }}
              >
                <Row gutter={[8, 8]}>
                  <Col xs={12} md={6}>
                    <Radio.Button
                      value={selectedSeries.HomeTeam.id}
                      style={{
                        width: "100%",
                        textAlign: "center",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedSeries.HomeTeam.shortName}
                    </Radio.Button>
                  </Col>
                  <Col xs={12} md={6}>
                    <Radio.Button
                      value={selectedSeries.AwayTeam.id}
                      style={{
                        width: "100%",
                        textAlign: "center",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedSeries.AwayTeam.shortName}
                    </Radio.Button>
                  </Col>
                </Row>
              </Radio.Group>
            </Form.Item>

            {selectedWinner && (
              <>
                <div style={{ marginTop: 16, marginBottom: 12 }}>
                  Nombre de matchs:
                </div>
                <Form.Item
                  name="predictedGames"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner le nombre de matchs",
                    },
                  ]}
                >
                  <Radio.Group
                    buttonStyle="solid"
                    onChange={(e) => handleGamesSelect(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <Row gutter={[8, 8]}>
                      {gameOptions.map((option) => (
                        <Col xs={12} md={6} key={option.value}>
                          <Radio.Button
                            value={option.value}
                            style={{
                              width: "100%",
                              textAlign: "center",
                              height: "32px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {option.value}
                          </Radio.Button>
                        </Col>
                      ))}
                    </Row>
                  </Radio.Group>
                </Form.Item>
              </>
            )}
          </>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={!selectedWinner || !selectedGames || submitting}
            block
          >
            Créer la prédiction
          </Button>
        </Form.Item>
      </Form>

      {submitting && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <Loading />
        </div>
      )}
    </Modal>
  );
};

const ManagePredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [series, setSeries] = useState<SeriesData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [predictionsResponse, usersResponse, seriesResponse] =
        await Promise.all([
          api.predictions.getAllUsersPredictions(),
          api.admin.getAllUsers(),
          api.series.getAllSeries(),
        ]);

      // Add detailed logging
      console.log("Users Response:", {
        data: usersResponse.data,
        hasUsers: Boolean(usersResponse.data?.users),
        isArray: Array.isArray(usersResponse.data?.users),
        usersLength: usersResponse.data?.users?.length,
        rawResponse: usersResponse,
      });

      // Transform the series data into predictions
      const allPredictions: UserPrediction[] = [];
      if (
        predictionsResponse.data?.series &&
        Array.isArray(predictionsResponse.data.series)
      ) {
        predictionsResponse.data.series.forEach((series: SeriesData) => {
          if (series?.Predictions && Array.isArray(series.Predictions)) {
            series.Predictions.forEach((pred) => {
              if (series.HomeTeam && series.AwayTeam) {
                allPredictions.push({
                  id: `${pred.userId}-${series.id}`,
                  userId: pred.userId,
                  userName: pred.userName,
                  seriesId: series.id,
                  predictedWinnerId: pred.predictedWinnerId,
                  predictedGames: pred.predictedGames,
                  points: pred.points || 0,
                  HomeTeam: series.HomeTeam,
                  AwayTeam: series.AwayTeam,
                  startDate: series.startDate,
                });
              }
            });
          }
        });
      }

      setPredictions(allPredictions);
      setUsers(
        Array.isArray(usersResponse.data?.users)
          ? usersResponse.data.users
          : [],
      );
      setSeries(Array.isArray(seriesResponse.data) ? seriesResponse.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrediction = async (
    userId: number,
    seriesId: number,
    data: {
      predictedWinnerId?: number;
      predictedGames?: number;
      points?: number;
    },
  ) => {
    setActionLoading(true);
    try {
      const prediction = predictions.find(
        (p) => p.userId === userId && p.seriesId === seriesId,
      );
      if (!prediction) return;
      const updatedData = {
        predictedWinnerId:
          data.predictedWinnerId ?? prediction.predictedWinnerId,
        predictedGames: data.predictedGames ?? prediction.predictedGames,
        points: data.points ?? prediction.points,
      };
      await api.admin.updateUserPrediction(userId, seriesId, updatedData);
      setSuccessAnim(true);
      setTimeout(() => setSuccessAnim(false), 1200);
      message.success("Prediction updated successfully");
      fetchData();
    } catch (error) {
      message.error("Failed to update prediction");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: "Utilisateur",
      dataIndex: "userName",
      key: "userName",
      sorter: (a: UserPrediction, b: UserPrediction) =>
        a.userName.localeCompare(b.userName),
    },
    {
      title: "Série",
      key: "series",
      render: (record: UserPrediction) => (
        <span>
          {record.HomeTeam?.name || "Unknown"} vs{" "}
          {record.AwayTeam?.name || "Unknown"}
        </span>
      ),
    },
    {
      title: "Gagnant Prédit",
      key: "predictedWinner",
      render: (record: UserPrediction) => (
        <Select
          style={{ width: 200 }}
          value={record.predictedWinnerId}
          onChange={(value) =>
            handleUpdatePrediction(record.userId, record.seriesId, {
              predictedWinnerId: value,
            })
          }
        >
          {record.HomeTeam && (
            <Select.Option value={record.HomeTeam.id}>
              {record.HomeTeam.name}
            </Select.Option>
          )}
          {record.AwayTeam && (
            <Select.Option value={record.AwayTeam.id}>
              {record.AwayTeam.name}
            </Select.Option>
          )}
        </Select>
      ),
    },
    {
      title: "Matchs Prédits",
      key: "predictedGames",
      render: (record: UserPrediction) => (
        <InputNumber
          min={4}
          max={7}
          value={record.predictedGames}
          onChange={(value) => {
            if (value !== null) {
              handleUpdatePrediction(record.userId, record.seriesId, {
                predictedGames: value,
              });
            }
          }}
        />
      ),
    },
    {
      title: "Points",
      key: "points",
      render: (record: UserPrediction) => (
        <Space>
          <InputNumber
            min={0}
            value={record.points}
            onChange={(value) => {
              if (value !== null) {
                handleUpdatePrediction(record.userId, record.seriesId, {
                  points: value,
                });
              }
            }}
          />
        </Space>
      ),
      sorter: (a: UserPrediction, b: UserPrediction) => a.points - b.points,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2}>Gérer les Prédictions</Title>
        <Button type="primary" onClick={() => setModalVisible(true)}>
          Créer une Prédiction
        </Button>
      </div>
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
              background: "rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
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
      <Table
        dataSource={Array.isArray(predictions) ? predictions : []}
        columns={columns}
        rowKey="id"
        loading={loading}
      />
      <AdminPredictionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchData}
        users={Array.isArray(users) ? users : []}
        seriesData={Array.isArray(series) ? series : []}
      />
    </div>
  );
};

export default ManagePredictions;
