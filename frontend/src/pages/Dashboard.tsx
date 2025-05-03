import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Spin,
  theme,
  Progress,
  Tooltip,
  Badge,
  Statistic,
  Avatar,
  Alert,
  Skeleton,
} from "antd";
import {
  TrophyOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  EditOutlined,
  PlusOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";
import PredictionModal from "../components/predictions/PredictionModal";
import { useAuthStore } from "../store/authStore";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
  userId: number;
  name: string;
  totalPoints: number;
  rank: number;
}

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
}

interface Round {
  name: string;
  number: number;
  season: string;
  active: boolean;
}

interface Series {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamWins: number;
  awayTeamWins: number;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  Round: Round;
  HomeTeam: Team;
  AwayTeam: Team;
  WinningTeam?: Team;
  Predictions: {
    userId: number;
    userName: string;
    predictedWinnerId: number;
    predictedGames: number;
  }[];
}

interface UserPrediction {
  id: number;
  userId: number;
  seriesId: number;
  predictedWinnerId: number;
  predictedGames: number;
  Series: Series;
}

interface UserWithPredictions {
  id: number;
  name: string;
  Predictions: UserPrediction[];
}

interface AllUsersPrediction {
  userId: number;
  userName: string;
  predictedWinnerId: number;
  predictedGames: number;
}

interface SeriesWithPredictions extends Series {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamWins: number;
  awayTeamWins: number;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  Round: Round;
  HomeTeam: Team;
  AwayTeam: Team;
  WinningTeam?: Team;
  Predictions: AllUsersPrediction[];
}

interface SeriesApiResponse {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamWins: number;
  awayTeamWins: number;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  Round: Round;
  HomeTeam: Team;
  AwayTeam: Team;
  WinningTeam?: Team;
  Predictions: AllUsersPrediction[];
}

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  perfectPredictions: number;
  pointsEarned: number;
  accuracy: number;
}

interface PredictionSummary {
  homeTeamCount: number;
  awayTeamCount: number;
  homeTeamPercentage: number;
  awayTeamPercentage: number;
  mostPredictedGames: number;
  mostPredictedTeam: Team | null;
}

const getSeriesState = (
  series: Series,
  userId: number | undefined,
  themeContext: {
    token: {
      colorSuccess: string;
      colorSuccessBg: string;
      colorPrimary: string;
      colorPrimaryBg: string;
      colorWarning: string;
      colorWarningBg: string;
    };
  },
) => {
  if (series.completed) {
    return {
      type: "completed",
      label: "Terminé",
      color: "success",
      borderColor: themeContext.token.colorSuccess,
      backgroundColor: themeContext.token.colorSuccessBg,
    };
  }

  const hasPrediction = series.Predictions.some((p) => p.userId === userId);
  if (hasPrediction) {
    return {
      type: "predicted",
      label: "Prédiction faite",
      color: "processing",
      borderColor: themeContext.token.colorPrimary,
      backgroundColor: themeContext.token.colorPrimaryBg,
    };
  }

  return {
    type: "needs_prediction",
    label: "Prédiction requise",
    color: "warning",
    borderColor: themeContext.token.colorWarning,
    backgroundColor: themeContext.token.colorWarningBg,
  };
};

const Dashboard = () => {
  const { token } = theme.useToken();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [series, setSeries] = useState<SeriesWithPredictions[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [predictionModalVisible, setPredictionModalVisible] = useState(false);
  const [seriesButtonVisibility, setSeriesButtonVisibility] = useState<
    Record<number, boolean>
  >({});
  const [userStats, setUserStats] = useState<UserStats>({
    totalPredictions: 0,
    correctPredictions: 0,
    perfectPredictions: 0,
    pointsEarned: 0,
    accuracy: 0,
  });
  const [predictionSummaries, setPredictionSummaries] = useState<
    Record<number, PredictionSummary>
  >({});
  const [showCongratulations, setShowCongratulations] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSkeletonLoading(true);
    try {
      console.log("Fetching dashboard data...");
      const [predictionsResponse, teamsResponse, leaderboardResponse] =
        await Promise.all([
          api.predictions.getAllUsersPredictions(),
          api.teams.getAllTeams(),
          api.predictions.getLeaderboard(),
        ]);

      console.log("Predictions response:", predictionsResponse.data);
      console.log(
        "Predictions response structure:",
        JSON.stringify(predictionsResponse.data, null, 2),
      );
      console.log("Teams response:", teamsResponse.data);
      console.log("Leaderboard response:", leaderboardResponse.data);

      // Set leaderboard data
      if (leaderboardResponse.data && leaderboardResponse.data.leaderboard) {
        // Add rank to each leaderboard entry based on position
        const leaderboardWithRank = leaderboardResponse.data.leaderboard.map(
          (
            entry: { userId: number; name: string; totalPoints: number },
            index: number,
          ) => ({
            ...entry,
            rank: index + 1,
          }),
        );
        setLeaderboard(leaderboardWithRank);
      }

      // Check if predictionsResponse.data has a series property
      if (predictionsResponse.data && predictionsResponse.data.series) {
        const transformedSeries: SeriesWithPredictions[] =
          predictionsResponse.data.series.map((series: SeriesApiResponse) => ({
            id: series.id,
            homeTeamId: series.homeTeamId,
            awayTeamId: series.awayTeamId,
            homeTeamWins: series.homeTeamWins,
            awayTeamWins: series.awayTeamWins,
            completed: series.completed,
            startDate: series.startDate,
            endDate: series.endDate,
            Round: series.Round,
            HomeTeam: series.HomeTeam,
            AwayTeam: series.AwayTeam,
            WinningTeam: series.WinningTeam,
            Predictions: series.Predictions || [],
          }));
        setSeries(transformedSeries);

        // Calculate user stats
        if (user) {
          const userPredictions = transformedSeries.flatMap((s) =>
            s.Predictions.filter((p) => p.userId === user.id).map((p) => ({
              ...p,
              seriesId: s.id,
            })),
          );

          const correctWinnerPredictions = userPredictions.filter((p) => {
            const series = transformedSeries.find((s) => s.id === p.seriesId);
            return (
              series?.completed &&
              series.WinningTeam?.id === p.predictedWinnerId
            );
          });

          const perfectPredictions = correctWinnerPredictions.filter((p) => {
            const series = transformedSeries.find((s) => s.id === p.seriesId);
            return (
              series &&
              series.homeTeamWins + series.awayTeamWins === p.predictedGames
            );
          });

          const userEntry = leaderboardResponse.data.leaderboard.find(
            (entry: LeaderboardEntry) => entry.userId === user.id,
          );

          setUserStats({
            totalPredictions: userPredictions.length,
            correctPredictions: correctWinnerPredictions.length,
            perfectPredictions: perfectPredictions.length,
            pointsEarned: userEntry?.totalPoints || 0,
            accuracy:
              userPredictions.length > 0
                ? (correctWinnerPredictions.length / userPredictions.length) *
                  100
                : 0,
          });
        }

        // Calculate prediction summaries for each series
        const summaries: Record<number, PredictionSummary> = {};
        transformedSeries.forEach((series) => {
          if (series.Predictions.length > 0) {
            const homeTeamPredictions = series.Predictions.filter(
              (p) => p.predictedWinnerId === series.homeTeamId,
            );
            const awayTeamPredictions = series.Predictions.filter(
              (p) => p.predictedWinnerId === series.awayTeamId,
            );

            // Count predictions for each number of games
            const gamesCounts: Record<number, number> = {};
            series.Predictions.forEach((p) => {
              gamesCounts[p.predictedGames] =
                (gamesCounts[p.predictedGames] || 0) + 1;
            });

            // Find most predicted number of games
            const mostPredictedGames = Object.entries(gamesCounts).sort(
              (a, b) => b[1] - a[1],
            )[0][0];

            summaries[series.id] = {
              homeTeamCount: homeTeamPredictions.length,
              awayTeamCount: awayTeamPredictions.length,
              homeTeamPercentage:
                (homeTeamPredictions.length / series.Predictions.length) * 100,
              awayTeamPercentage:
                (awayTeamPredictions.length / series.Predictions.length) * 100,
              mostPredictedGames: parseInt(mostPredictedGames),
              mostPredictedTeam:
                homeTeamPredictions.length > awayTeamPredictions.length
                  ? series.HomeTeam
                  : series.AwayTeam,
            };
          }
        });
        setPredictionSummaries(summaries);
      } else if (Array.isArray(predictionsResponse.data)) {
        // Handle the old format with direct array
        const transformedSeries: SeriesWithPredictions[] =
          predictionsResponse.data.map((series: SeriesApiResponse) => ({
            id: series.id,
            homeTeamId: series.homeTeamId,
            awayTeamId: series.awayTeamId,
            homeTeamWins: series.homeTeamWins,
            awayTeamWins: series.awayTeamWins,
            completed: series.completed,
            startDate: series.startDate,
            endDate: series.endDate,
            Round: series.Round,
            HomeTeam: series.HomeTeam,
            AwayTeam: series.AwayTeam,
            WinningTeam: series.WinningTeam,
            Predictions: series.Predictions || [],
          }));
        setSeries(transformedSeries);
      } else if (predictionsResponse.data.users) {
        // Handle the old format with users property
        const transformedSeries: SeriesWithPredictions[] =
          predictionsResponse.data.users.map((user: UserWithPredictions) => ({
            id: user.id,
            homeTeamId: user.Predictions[0]?.Series.homeTeamId,
            awayTeamId: user.Predictions[0]?.Series.awayTeamId,
            homeTeamWins: user.Predictions[0]?.Series.homeTeamWins,
            awayTeamWins: user.Predictions[0]?.Series.awayTeamWins,
            completed: user.Predictions[0]?.Series.completed,
            startDate: user.Predictions[0]?.Series.startDate,
            endDate: user.Predictions[0]?.Series.endDate,
            Round: user.Predictions[0]?.Series.Round,
            HomeTeam: user.Predictions[0]?.Series.HomeTeam,
            AwayTeam: user.Predictions[0]?.Series.AwayTeam,
            WinningTeam: user.Predictions[0]?.Series.WinningTeam,
            Predictions: user.Predictions.map((p) => ({
              userId: p.userId,
              userName: user.name,
              predictedWinnerId: p.predictedWinnerId,
              predictedGames: p.predictedGames,
            })),
          }));
        setSeries(transformedSeries);
      } else {
        console.error(
          "Unexpected API response format:",
          predictionsResponse.data,
        );
        setSeries([]);
      }

      // Set teams data and use it for reference
      const teamsData = teamsResponse.data.teams || [];

      // Update series with team references if needed
      if (predictionsResponse.data && predictionsResponse.data.series) {
        const transformedSeries: SeriesWithPredictions[] =
          predictionsResponse.data.series.map((series: SeriesApiResponse) => ({
            id: series.id,
            homeTeamId: series.homeTeamId,
            awayTeamId: series.awayTeamId,
            homeTeamWins: series.homeTeamWins,
            awayTeamWins: series.awayTeamWins,
            completed: series.completed,
            startDate: series.startDate,
            endDate: series.endDate,
            Round: series.Round,
            HomeTeam:
              teamsData.find((t: Team) => t.id === series.homeTeamId) ||
              series.HomeTeam,
            AwayTeam:
              teamsData.find((t: Team) => t.id === series.awayTeamId) ||
              series.AwayTeam,
            WinningTeam: series.WinningTeam,
            Predictions: series.Predictions || [],
          }));
        setSeries(transformedSeries);
      }
    } catch (error: unknown) {
      console.error("Dashboard fetch error:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      console.error(
        `Échec de la récupération des données du tableau de bord: ${message}`,
      );
    } finally {
      setLoading(false);
      // Delayed skeleton loading finish for smoother transition
      setTimeout(() => setSkeletonLoading(false), 1300);
    }
  }, [user]);

  useEffect(() => {
    console.log("Dashboard mounted, auth state:", {
      isAuthenticated,
      hasUser: !!user,
    });
    if (isAuthenticated) {
      fetchData();
    } else {
      console.log("Not authenticated, skipping data fetch");
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchData]);

  useEffect(() => {
    if (series.length > 0) {
      const now = new Date();
      const visibility: Record<number, boolean> = {};

      series.forEach((s) => {
        console.log(
          `\nChecking series ${s.HomeTeam.shortName} vs ${s.AwayTeam.shortName}:`,
        );
        console.log("Series data:", {
          id: s.id,
          startDate: s.startDate,
          completed: s.completed,
        });

        if (s.startDate) {
          const startDate = new Date(s.startDate);
          console.log("Date comparison:", {
            startDate: startDate.toISOString(),
            now: now.toISOString(),
            daysUntilStart: Math.floor(
              (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          });

          visibility[s.id] = !s.completed && startDate > now;
        } else {
          visibility[s.id] = false;
        }

        console.log("Button should be visible:", visibility[s.id]);
      });

      console.log("Final visibility state:", visibility);
      setSeriesButtonVisibility(visibility);
    }
  }, [series]);

  const handleEditPrediction = (series: Series) => {
    setSelectedSeries(series);
    setPredictionModalVisible(true);
  };

  const handlePredictionSuccess = () => {
    fetchData();
  };

  // Group series by round for better organization
  const groupedSeries = series.reduce(
    (acc, series) => {
      const roundNumber = series.Round.number;
      if (!acc[roundNumber]) {
        acc[roundNumber] = [];
      }
      acc[roundNumber].push(series);
      return acc;
    },
    {} as Record<number, SeriesWithPredictions[]>,
  );

  // Define round names and colors
  const roundInfo: Record<number, { name: string; color: string }> = {
    4: { name: "Finale de la Coupe Stanley", color: "gold" },
    2: { name: "Deuxième Ronde", color: "blue" },
    1: { name: "Première Ronde", color: "green" },
  };

  // Helper components for our improvements

  // 1. Active Series Spotlight Component
  const ActiveSeriesSpotlight = ({
    series,
    userId,
  }: {
    series: SeriesWithPredictions[];
    userId: number | undefined;
  }) => {
    const { token } = theme.useToken();
    const activeSeries = useMemo(() => {
      const now = new Date();
      // Filter for upcoming series that haven't been completed and are starting soon
      // AND user hasn't made a prediction yet
      return series
        .filter(
          (s) =>
            !s.completed &&
            s.startDate &&
            new Date(s.startDate) > now &&
            // Only show series where the user has NOT made a prediction
            !s.Predictions.some((p) => p.userId === userId),
        )
        .sort(
          (a, b) =>
            new Date(a.startDate || "").getTime() -
            new Date(b.startDate || "").getTime(),
        )
        .slice(0, 3); // Show top 3 upcoming series
    }, [series, userId]);

    if (activeSeries.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: token.colorWarning,
                fontWeight: "bold",
              }}
            >
              <FireOutlined style={{ color: token.colorWarning }} />
              <span>Séries à Venir - Faites Vos Prédictions!</span>
            </div>
          }
          size="small"
          className="hover-effect"
          style={{
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            borderLeft: `4px solid ${token.colorWarning}`,
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              gap: "16px",
              padding: "8px",
              marginBottom: "8px",
            }}
          >
            <AnimatePresence>
              {activeSeries.map((series, index) => (
                <motion.div
                  key={series.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    minWidth: "280px",
                    background: `linear-gradient(135deg, ${token.colorBgContainer}, ${token.colorBgElevated})`,
                    borderRadius: "8px",
                    padding: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Tag color="blue">{series.Round.name}</Tag>
                      <Tooltip
                        title={`Début: ${new Date(series.startDate || "").toLocaleDateString()}`}
                      >
                        <Tag icon={<ClockCircleOutlined />} color="orange">
                          {new Date(
                            series.startDate || "",
                          ).toLocaleDateString()}
                        </Tag>
                      </Tooltip>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      background: token.colorBgContainer,
                      borderRadius: "8px",
                      marginBottom: "16px",
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <Avatar
                        src={getImageUrl(series.HomeTeam.logoUrl)}
                        shape="square"
                        size={48}
                        style={{ marginBottom: "4px" }}
                      />
                      <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                        {series.HomeTeam.shortName}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        padding: "0 12px",
                        color: token.colorTextSecondary,
                      }}
                    >
                      VS
                    </div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <Avatar
                        src={getImageUrl(series.AwayTeam.logoUrl)}
                        shape="square"
                        size={48}
                        style={{ marginBottom: "4px" }}
                      />
                      <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                        {series.AwayTeam.shortName}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Button
                      type="primary"
                      size="middle"
                      onClick={() => handleEditPrediction(series)}
                      style={{
                        borderRadius: "6px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        height: "auto",
                        padding: "6px 16px",
                        fontWeight: "bold",
                        width: "100%",
                      }}
                      icon={
                        series.Predictions.some((p) => p.userId === userId) ? (
                          <EditOutlined />
                        ) : (
                          <PlusOutlined />
                        )
                      }
                    >
                      {series.Predictions.some((p) => p.userId === userId)
                        ? "Modifier ma prédiction"
                        : "Faire ma prédiction"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    );
  };

  // 2. User Stats Summary Component
  const UserStatsSummary = ({ stats }: { stats: UserStats }) => {
    const { token } = theme.useToken();
    const { user } = useAuthStore();

    // Calculate points behind leader
    const pointsBehindLeader = useMemo(() => {
      if (!leaderboard || leaderboard.length === 0) return 0;

      const leader = leaderboard.find((entry) => entry.rank === 1);
      const userEntry = leaderboard.find((entry) => entry.userId === user?.id);

      if (!leader || !userEntry) return 0;
      return Math.max(0, leader.totalPoints - userEntry.totalPoints);
    }, [user]);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: "24px" }}
      >
        <Card
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: token.colorPrimary,
                fontWeight: "bold",
              }}
            >
              <BarChartOutlined style={{ color: token.colorPrimary }} />
              <span>Vos Statistiques</span>
            </div>
          }
          size="small"
          className="hover-effect"
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${token.colorBgContainer}, ${token.colorInfoBg})`,
          }}
          bodyStyle={{ padding: "12px" }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Points"
                value={stats.pointsEarned}
                prefix={<TrophyOutlined />}
                valueStyle={{ fontSize: "16px", color: "#FFD700" }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Points derrière leader"
                value={pointsBehindLeader}
                prefix={<CrownOutlined />}
                valueStyle={{
                  fontSize: "16px",
                  color:
                    pointsBehindLeader === 0
                      ? token.colorSuccess
                      : token.colorWarning,
                }}
                suffix={pointsBehindLeader === 0 ? "🏆" : null}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Classement"
                value={
                  leaderboard.find((entry) => entry.userId === user?.id)
                    ?.rank || "-"
                }
                valueStyle={{
                  fontSize: "16px",
                  color: token.colorPrimary,
                  fontWeight: "bold",
                }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Prédictions Parfaites"
                value={stats.perfectPredictions}
                prefix={<FireOutlined />}
                valueStyle={{ fontSize: "16px", color: "#FF6B22" }}
              />
            </Col>
          </Row>
        </Card>
      </motion.div>
    );
  };

  // 3. Enhanced Series Card
  const EnhancedSeriesCard = ({
    series,
    index,
    userId,
    showButton,
    predictionSummary,
  }: {
    series: SeriesWithPredictions;
    index: number;
    userId: number | undefined;
    showButton: boolean;
    predictionSummary?: PredictionSummary;
  }) => {
    const { token } = theme.useToken();
    const seriesState = getSeriesState(series, userId, { token });
    const userPrediction = series.Predictions.find((p) => p.userId === userId);
    const isCorrectPrediction =
      series.completed &&
      userPrediction?.predictedWinnerId === series.WinningTeam?.id;
    const isPerfectPrediction =
      isCorrectPrediction &&
      userPrediction?.predictedGames ===
        series.homeTeamWins + series.awayTeamWins;

    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <Card
          size="small"
          style={{
            height: "100%",
            border: `1px solid ${seriesState.borderColor}`,
            background: seriesState.backgroundColor,
            position: "relative",
            overflow: "visible",
            borderRadius: "8px",
            transition: "all 0.3s ease",
            boxShadow: isPerfectPrediction
              ? `0 4px 12px ${token.colorSuccessBg}`
              : isCorrectPrediction
                ? `0 4px 12px ${token.colorWarningBg}`
                : "0 2px 8px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: "12px" }}
          actions={
            showButton
              ? [
                  <div key="prediction-button">
                    <Button
                      key="prediction"
                      type="primary"
                      size="small"
                      onClick={() => handleEditPrediction(series)}
                      style={{
                        width: "90%",
                        marginTop: "0",
                        marginBottom: "6px",
                        borderRadius: "4px",
                        height: "24px",
                        fontSize: "12px",
                        padding: "0 8px",
                      }}
                    >
                      {series.Predictions.some((p) => p.userId === userId)
                        ? "Modifier ma prédiction"
                        : "Faire une prédiction"}
                    </Button>
                  </div>,
                ]
              : []
          }
        >
          {/* Status Badge with enhanced visuals */}
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: "6px",
              zIndex: 1,
            }}
          >
            <Badge.Ribbon
              text={seriesState.label}
              color={seriesState.color as string}
              style={{ fontSize: "10px", fontWeight: "bold" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <Tag
              color="blue"
              style={{
                padding: "0 6px",
                fontSize: "10px",
                lineHeight: "18px",
                height: "20px",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              {series.Round.name}
            </Tag>

            {/* Enhanced score display */}
            {(series.homeTeamWins > 0 || series.awayTeamWins > 0) && (
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: series.completed
                    ? token.colorSuccess
                    : token.colorPrimary,
                  textAlign: "center",
                  marginBottom: "8px",
                  padding: "4px 8px",
                  background: series.completed
                    ? `${token.colorSuccessBg}40`
                    : `${token.colorPrimaryBg}40`,
                  borderRadius: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {series.homeTeamWins} - {series.awayTeamWins}
                {series.completed && (
                  <CheckCircleOutlined
                    style={{ marginLeft: "8px", color: token.colorSuccess }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Enhanced team matchup display */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
              padding: "8px",
              background: token.colorBgContainer,
              borderRadius: "8px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                flex: 1,
                opacity:
                  series.completed &&
                  series.WinningTeam?.id !== series.HomeTeam.id
                    ? 0.6
                    : 1,
                padding: "4px",
                position: "relative",
              }}
            >
              {/* Team logo with winner indicator if applicable */}
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={getImageUrl(series.HomeTeam.logoUrl)}
                  shape="square"
                  size={42}
                  style={{
                    filter:
                      series.completed &&
                      series.WinningTeam?.id !== series.HomeTeam.id
                        ? "grayscale(100%)"
                        : "none",
                  }}
                />
                {series.completed &&
                  series.WinningTeam?.id === series.HomeTeam.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        background: token.colorSuccess,
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      🏆
                    </div>
                  )}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginTop: "4px",
                  color:
                    series.completed &&
                    series.WinningTeam?.id === series.HomeTeam.id
                      ? token.colorSuccess
                      : token.colorText,
                }}
              >
                {series.HomeTeam.shortName}
              </div>

              {/* Prediction percentage indicator */}
              {predictionSummary && (
                <Tooltip
                  title={`${predictionSummary.homeTeamCount} prédictions pour ${series.HomeTeam.shortName}`}
                >
                  <Progress
                    percent={predictionSummary.homeTeamPercentage}
                    size="small"
                    showInfo={false}
                    strokeColor={token.colorPrimary}
                    style={{ marginTop: "4px", width: "80%" }}
                  />
                </Tooltip>
              )}
            </div>

            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                padding: "0 6px",
                color: token.colorTextSecondary,
              }}
            >
              VS
            </div>

            <div
              style={{
                textAlign: "center",
                flex: 1,
                opacity:
                  series.completed &&
                  series.WinningTeam?.id !== series.AwayTeam.id
                    ? 0.6
                    : 1,
                padding: "4px",
                position: "relative",
              }}
            >
              {/* Team logo with winner indicator if applicable */}
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={getImageUrl(series.AwayTeam.logoUrl)}
                  shape="square"
                  size={42}
                  style={{
                    filter:
                      series.completed &&
                      series.WinningTeam?.id !== series.AwayTeam.id
                        ? "grayscale(100%)"
                        : "none",
                  }}
                />
                {series.completed &&
                  series.WinningTeam?.id === series.AwayTeam.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        background: token.colorSuccess,
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      🏆
                    </div>
                  )}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginTop: "4px",
                  color:
                    series.completed &&
                    series.WinningTeam?.id === series.AwayTeam.id
                      ? token.colorSuccess
                      : token.colorText,
                }}
              >
                {series.AwayTeam.shortName}
              </div>

              {/* Prediction percentage indicator */}
              {predictionSummary && (
                <Tooltip
                  title={`${predictionSummary.awayTeamCount} prédictions pour ${series.AwayTeam.shortName}`}
                >
                  <Progress
                    percent={predictionSummary.awayTeamPercentage}
                    size="small"
                    showInfo={false}
                    strokeColor={token.colorWarning}
                    style={{ marginTop: "4px", width: "80%" }}
                  />
                </Tooltip>
              )}
            </div>
          </div>

          {/* Enhanced prediction display */}
          <div
            style={{
              fontSize: "0.75em",
              background: token.colorBgContainer,
              borderRadius: "8px",
              padding: "8px",
              border: `1px solid ${token.colorBorderSecondary}`,
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {/* Current User's Prediction - Enhanced */}
            {series.Predictions.filter((p) => p.userId === userId).map(
              (pred) => (
                <motion.div
                  key={pred.userId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 8px",
                    background: token.colorPrimaryBg,
                    borderRadius: "6px",
                    marginBottom: "8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    border: `1px solid ${token.colorPrimaryBorder}`,
                    position: "relative",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      maxWidth: "50%",
                      overflow: "hidden",
                    }}
                  >
                    <Avatar
                      size={18}
                      style={{ background: token.colorPrimary, flexShrink: 0 }}
                    >
                      {getInitials(pred.userName)}
                    </Avatar>
                    <span
                      style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {pred.userName}
                      <span
                        style={{
                          marginLeft: "3px",
                          color: token.colorPrimary,
                          fontSize: "10px",
                        }}
                      >
                        (Vous)
                      </span>
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: series.completed
                        ? isPerfectPrediction
                          ? token.colorSuccess // Perfect prediction
                          : isCorrectPrediction
                            ? token.colorWarning // Correct team prediction
                            : token.colorError // Wrong team prediction
                        : token.colorTextSecondary,
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      background: series.completed
                        ? isPerfectPrediction
                          ? "rgba(82, 196, 26, 0.1)" // Perfect prediction background
                          : isCorrectPrediction
                            ? "rgba(250, 173, 20, 0.1)" // Correct team prediction background
                            : "rgba(255, 77, 79, 0.1)" // Wrong team prediction background
                        : "transparent",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <Avatar
                      src={getImageUrl(
                        pred.predictedWinnerId === series.HomeTeam.id
                          ? series.HomeTeam.logoUrl
                          : series.AwayTeam.logoUrl,
                      )}
                      size={16}
                      shape="square"
                      style={{ marginRight: "4px", flexShrink: 0 }}
                    />
                    en {pred.predictedGames}
                    {series.completed && (
                      <span
                        style={{
                          marginLeft: "4px",
                          fontSize: "11px",
                        }}
                      >
                        {
                          pred.predictedWinnerId === series.WinningTeam?.id
                            ? pred.predictedGames ===
                              series.homeTeamWins + series.awayTeamWins
                              ? "🎯" /* Perfect prediction */
                              : "✅" /* Correct team prediction */
                            : "❌" /* Wrong team prediction */
                        }
                      </span>
                    )}
                  </div>
                </motion.div>
              ),
            )}

            {/* Other users' predictions - direct display instead of VirtualList */}
            {series.Predictions.filter((p) => p.userId !== userId).map(
              (pred: AllUsersPrediction) => (
                <div
                  key={pred.userId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 6px",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    fontSize: "10px",
                    alignItems: "center",
                    marginBottom: "2px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Avatar
                      size={16}
                      style={{
                        fontSize: "8px",
                        background: token.colorBgLayout,
                      }}
                    >
                      {getInitials(pred.userName)}
                    </Avatar>
                    <span
                      style={{
                        maxWidth: "80px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pred.userName}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: series.completed
                        ? pred.predictedWinnerId === series.WinningTeam?.id
                          ? pred.predictedGames ===
                            series.homeTeamWins + series.awayTeamWins
                            ? token.colorSuccess // Perfect prediction
                            : token.colorWarning // Correct team prediction
                          : token.colorError // Wrong team prediction
                        : token.colorTextSecondary,
                      fontWeight: "bold",
                      fontSize: "10px",
                    }}
                  >
                    <Avatar
                      src={getImageUrl(
                        pred.predictedWinnerId === series.HomeTeam.id
                          ? series.HomeTeam.logoUrl
                          : series.AwayTeam.logoUrl,
                      )}
                      size={14}
                      shape="square"
                      style={{ marginRight: "3px" }}
                    />
                    en {pred.predictedGames}
                    {series.completed && (
                      <span
                        style={{
                          marginLeft: "2px",
                          fontSize: "8px",
                        }}
                      >
                        {
                          pred.predictedWinnerId === series.WinningTeam?.id
                            ? pred.predictedGames ===
                              series.homeTeamWins + series.awayTeamWins
                              ? "🎯" /* Perfect prediction */
                              : "✅" /* Correct team prediction */
                            : "❌" /* Wrong team prediction */
                        }
                      </span>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  // Add a helper function to get initials at the top level
  const getInitials = (name: string) => {
    if (!name) return "";

    const nameParts = name.split(" ");
    if (nameParts.length === 1)
      return nameParts[0].substring(0, 2).toUpperCase();

    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          height: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <Spin size="large" />
        <div style={{ color: "#888", marginTop: "12px" }}>
          Chargement des données...
        </div>
      </div>
    );
  }

  // Card animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        type: "spring",
        stiffness: 100,
      },
    }),
  };

  // Leaderboard animations
  const leaderboardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.3,
        type: "spring",
      },
    }),
  };

  return (
    <div style={{ padding: "0 8px" }}>
      {/* New User Stats Summary */}
      {user && <UserStatsSummary stats={userStats} />}

      {/* New Active Series Spotlight */}
      <ActiveSeriesSpotlight series={series} userId={user?.id} />

      <Row gutter={[16, 16]}>
        {/* Leaderboard Section - Enhanced */}
        <Col xs={24} md={6}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: token.colorPrimary,
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  <TrophyOutlined style={{ fontSize: "16px" }} />
                  <span>Classement</span>
                </div>
              }
              size="small"
              className="hover-effect"
              style={{
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                borderRadius: "8px",
                height: "100%",
              }}
              headStyle={{
                padding: "12px",
                borderBottom: `2px solid ${token.colorBorderSecondary}`,
              }}
              bodyStyle={{ padding: "8px" }}
            >
              {skeletonLoading ? (
                <div style={{ padding: "8px" }}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton.Button
                      key={i}
                      active
                      size="small"
                      block
                      style={{ marginBottom: "8px", height: "32px" }}
                    />
                  ))}
                </div>
              ) : (
                <Row gutter={[4, 8]}>
                  {leaderboard.map((entry, index) => (
                    <Col xs={24} key={entry.userId}>
                      <motion.div
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        variants={leaderboardVariants}
                        whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          background:
                            entry.userId === user?.id
                              ? token.colorPrimaryBg
                              : entry.rank === 1
                                ? "rgba(255, 215, 0, 0.1)"
                                : entry.rank === 2
                                  ? "rgba(192, 192, 192, 0.1)"
                                  : entry.rank === 3
                                    ? "rgba(205, 127, 50, 0.1)"
                                    : index % 2 === 0
                                      ? token.colorBgElevated
                                      : "transparent",
                          fontSize: "0.9em",
                          gap: "8px",
                          border:
                            entry.userId === user?.id
                              ? `1px solid ${token.colorPrimaryBorder}`
                              : "none",
                          boxShadow:
                            entry.rank <= 3
                              ? "0 2px 6px rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        {/* Avatar with initials and rank styling */}
                        <Avatar
                          size="small"
                          style={{
                            background:
                              entry.rank === 1
                                ? "#FFD700"
                                : entry.rank === 2
                                  ? "#C0C0C0"
                                  : entry.rank === 3
                                    ? "#CD7F32"
                                    : token.colorPrimary,
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          {entry.rank === 1 ? (
                            <TrophyOutlined style={{ fontSize: "10px" }} />
                          ) : (
                            getInitials(entry.name)
                          )}
                        </Avatar>

                        <span
                          style={{
                            flex: 1,
                            fontWeight:
                              entry.rank <= 3 || entry.userId === user?.id
                                ? "bold"
                                : "normal",
                            color:
                              entry.rank === 1
                                ? token.colorPrimary
                                : token.colorText,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: "13px",
                          }}
                        >
                          {entry.name}
                          {entry.userId === user?.id && (
                            <span
                              style={{
                                marginLeft: "4px",
                                color: token.colorPrimary,
                                fontSize: "11px",
                              }}
                            >
                              (Vous)
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            fontWeight: "bold",
                            color:
                              entry.rank === 1
                                ? "#FFD700"
                                : entry.rank === 2
                                  ? "#C0C0C0"
                                  : entry.rank === 3
                                    ? "#CD7F32"
                                    : token.colorText,
                            marginLeft: "auto",
                            fontSize: "14px",
                            background: token.colorBgContainer,
                            padding: "2px 6px",
                            borderRadius: "6px",
                            minWidth: "28px",
                            textAlign: "center",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                        >
                          {entry.totalPoints}
                        </span>
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* All Series Section - Enhanced with our new components */}
        <Col xs={24} md={18}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: token.colorPrimary,
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  <TrophyOutlined style={{ fontSize: "16px" }} />
                  <span>Séries Éliminatoires</span>
                </div>
              }
              size="small"
              className="hover-effect"
              style={{
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                borderRadius: "8px",
              }}
              headStyle={{
                padding: "12px",
                borderBottom: `2px solid ${token.colorBorderSecondary}`,
              }}
              bodyStyle={{ padding: "12px" }}
            >
              {skeletonLoading ? (
                <div>
                  {[1, 2].map((round) => (
                    <div key={round} style={{ marginBottom: "24px" }}>
                      <Skeleton.Button
                        active
                        size="small"
                        style={{
                          width: "200px",
                          marginBottom: "16px",
                          height: "28px",
                        }}
                      />
                      <Row gutter={[12, 12]}>
                        {[...Array(4)].map((_, i) => (
                          <Col key={i} xs={24} sm={12} md={8} lg={6}>
                            <Card>
                              <Skeleton active avatar paragraph={{ rows: 3 }} />
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ))}
                </div>
              ) : (
                /* Render series by round in the specified order */
                <AnimatePresence>
                  {[4, 3, 2, 1].map((roundNumber) => {
                    const roundSeries = groupedSeries[roundNumber] || [];
                    if (roundSeries.length === 0) return null;

                    return (
                      <motion.div
                        key={roundNumber}
                        style={{ marginBottom: "24px" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "16px",
                            padding: "8px 12px",
                            background: `linear-gradient(135deg, ${token.colorBgContainer}, ${token.colorBgElevated})`,
                            borderRadius: "8px",
                            border: `1px solid ${token.colorBorderSecondary}`,
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                          }}
                        >
                          <TrophyOutlined
                            style={{
                              color:
                                roundInfo[roundNumber]?.color ||
                                token.colorPrimary,
                              fontSize: "16px",
                            }}
                          />
                          <span
                            style={{
                              fontWeight: "bold",
                              color:
                                roundInfo[roundNumber]?.color ||
                                token.colorPrimary,
                              fontSize: "14px",
                            }}
                          >
                            {roundInfo[roundNumber]?.name ||
                              `Round ${roundNumber}`}
                          </span>
                        </motion.div>
                        <Row gutter={[16, 16]}>
                          {roundSeries.map((series, index) => (
                            <Col key={series.id} xs={24} sm={12} md={12} lg={8}>
                              <EnhancedSeriesCard
                                series={series}
                                index={index}
                                userId={user?.id}
                                showButton={seriesButtonVisibility[series.id]}
                                predictionSummary={
                                  predictionSummaries[series.id]
                                }
                              />
                            </Col>
                          ))}
                        </Row>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Prediction Modal - Same as before */}
      <PredictionModal
        visible={predictionModalVisible}
        series={selectedSeries}
        onClose={() => {
          setPredictionModalVisible(false);
          setSelectedSeries(null);
        }}
        onSuccess={handlePredictionSuccess}
      />

      {/* Congratulations Modal for Perfect Predictions */}
      <AnimatePresence>
        {showCongratulations && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 1000,
              maxWidth: "300px",
            }}
          >
            <Alert
              message="Prédiction Parfaite!"
              description="Félicitations! Votre prédiction était parfaite!"
              type="success"
              showIcon
              closable
              onClose={() => setShowCongratulations(false)}
              style={{
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                borderRadius: "8px",
                border: `2px solid ${token.colorSuccess}`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
