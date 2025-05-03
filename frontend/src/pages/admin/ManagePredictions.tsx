import React, { useEffect, useState } from "react";
import { Table, Select, InputNumber, message, Typography, Space } from "antd";
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

const ManagePredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const predictionsResponse =
        await api.predictions.getAllUsersPredictions();

      // Transform the series data into predictions
      const allPredictions: UserPrediction[] = [];
      if (predictionsResponse.data.series) {
        predictionsResponse.data.series.forEach((series: SeriesData) => {
          series.Predictions.forEach((pred) => {
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
          });
        });
      }

      setPredictions(allPredictions);
    } catch (error) {
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
          {record.HomeTeam.name} vs {record.AwayTeam.name}
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
          <Select.Option value={record.HomeTeam.id}>
            {record.HomeTeam.name}
          </Select.Option>
          <Select.Option value={record.AwayTeam.id}>
            {record.AwayTeam.name}
          </Select.Option>
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
      <Title level={2}>Gérer les Prédictions</Title>
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
      <Table
        columns={columns}
        dataSource={predictions}
        loading={loading}
        rowKey={(record) => `${record.userId}-${record.seriesId}`}
      />
    </div>
  );
};

export default ManagePredictions;
