import React, { useEffect, useState, useMemo } from "react";
import { Table, Card, Space, Spin, Alert, Tag } from "antd";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { motion, AnimatePresence } from "framer-motion";

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
}

interface Round {
  id: number;
  name: string;
  number: number;
  startDate: string;
}

interface Series {
  id: number;
  Round: Round;
  HomeTeam: Team;
  AwayTeam: Team;
  WinningTeam?: Team;
  completed: boolean;
  homeTeamWins: number;
  awayTeamWins: number;
}

interface TableDataItem {
  key: number | string;
  name: string;
  series?: Series;
  points?: number;
  predictedWinnerId?: number;
  predictedGames?: number;
  Series?: Series;
  PredictedWinner?: Team;
  children?: TableDataItem[];
  isCurrentUser?: boolean;
}

interface SeriesWithPredictions extends Series {
  Predictions: {
    userId: number;
    userName: string;
    predictedWinnerId: number;
    predictedGames: number;
  }[];
}

const AllUsersPredictions: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [series, setSeries] = useState<SeriesWithPredictions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Ensure loading is true when starting fetch
        const response = await api.predictions.getAllUsersPredictions();
        if (!response.data?.series) {
          throw new Error("Invalid response format");
        }
        setSeries(response.data.series);
      } catch (err) {
        console.error("Error fetching predictions:", err);
        setError("Failed to load predictions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform series data into table format
  const data: TableDataItem[] = useMemo(() => {
    if (!series.length) return [];

    // Get unique users from all predictions
    const userMap = new Map<number, string>();
    series.forEach((s) =>
      s.Predictions?.forEach(
        (p) => p?.userId && p?.userName && userMap.set(p.userId, p.userName),
      ),
    );

    return Array.from(userMap.entries()).map(([userId, userName]) => ({
      key: userId,
      name: userName,
      isCurrentUser: userId === currentUser?.id,
      children: series
        .map((s) => {
          if (!s?.Predictions) return null;
          const prediction = s.Predictions.find((p) => p?.userId === userId);
          if (!prediction || !s.HomeTeam || !s.AwayTeam) return null;

          return {
            key: `${userId}-${s.id}`,
            name: userName,
            isCurrentUser: userId === currentUser?.id,
            Series: s,
            predictedWinnerId: prediction.predictedWinnerId,
            predictedGames: prediction.predictedGames,
            PredictedWinner:
              prediction.predictedWinnerId === s.HomeTeam.id
                ? s.HomeTeam
                : s.AwayTeam,
          };
        })
        .filter(Boolean) as TableDataItem[],
    }));
  }, [series, currentUser]);

  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      fixed: "left" as const,
      width: 150,
      render: (_: unknown, record: TableDataItem) => (
        <Space>
          {record.name}
          {record.isCurrentUser && <Tag color="blue">You</Tag>}
        </Space>
      ),
    },
    {
      title: "Series",
      dataIndex: "series",
      key: "series",
      render: (_: unknown, record: TableDataItem) => {
        if (!record.Series || !record.PredictedWinner) return null;

        const { Series, PredictedWinner, predictedGames } = record;
        const isCorrect =
          Series.completed && Series.WinningTeam?.id === PredictedWinner.id;
        const isWrong =
          Series.completed && Series.WinningTeam?.id !== PredictedWinner.id;

        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px" }}>
                  {Series.HomeTeam.shortName}
                </div>
              </div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>VS</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px" }}>
                  {Series.AwayTeam.shortName}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: "12px" }}>
              <AnimatePresence>
                {isCorrect && (
                  <motion.div
                    key="correct"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    style={{ display: "inline-block" }}
                  >
                    <Tag color="success">Correct</Tag>
                  </motion.div>
                )}
                {isWrong && (
                  <motion.div
                    key="wrong"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    style={{ display: "inline-block" }}
                  >
                    <Tag color="error">Wrong</Tag>
                  </motion.div>
                )}
                {!Series.completed && predictedGames && (
                  <Tag>In {predictedGames}</Tag>
                )}
              </AnimatePresence>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      width: 80,
      align: "center" as const,
    },
  ];

  return (
    <Card
      title={
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          Toutes les prédictions des joueurs
        </motion.div>
      }
      size="small"
    >
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "24px", textAlign: "center" }}
          >
            <Spin size="large" tip="Loading predictions..." />
          </motion.div>
        )}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ margin: "24px" }}
          >
            <Alert message="Error" description={error} type="error" showIcon />
          </motion.div>
        )}
        {!series.length || !data.length ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ margin: "24px" }}
          >
            <Alert
              message="No predictions found"
              description="There are no predictions to display at the moment."
              type="info"
              showIcon
            />
          </motion.div>
        ) : (
          <Table<TableDataItem>
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: "max-content" }}
            rowClassName={(record) =>
              record.isCurrentUser ? "highlight-row" : ""
            }
            components={{
              body: {
                row: ({
                  children,
                  ...restProps
                }: {
                  children: React.ReactNode;
                }) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    {...restProps}
                  >
                    {children}
                  </motion.tr>
                ),
              },
            }}
          />
        )}
      </AnimatePresence>
      <style>
        {`
          .highlight-row {
            background-color: rgba(24, 144, 255, 0.1);
            transition: background 0.5s;
          }
          .highlight-row:hover > td {
            background-color: rgba(24, 144, 255, 0.2) !important;
          }
        `}
      </style>
    </Card>
  );
};

export default AllUsersPredictions;
