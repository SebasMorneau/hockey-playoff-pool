import axiosInstance from "../utils/axios";

// API Base URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3300/api";

// Configure axios defaults
axiosInstance.defaults.baseURL = API_URL;
axiosInstance.defaults.headers.common["Content-Type"] = "application/json";

// API service object
const api = {
  // Auth endpoints
  auth: {
    // Request magic link
    requestMagicLink: (email: string) =>
      axiosInstance.post("/auth/magic-link", { email }),

    // Verify magic link token
    verifyMagicLink: (token: string) =>
      axiosInstance.get(`/auth/verify?token=${token}`),

    // Get current user profile
    getCurrentUser: () => axiosInstance.get("/auth/me"),

    // Update user profile
    updateProfile: (name: string) =>
      axiosInstance.put("/auth/profile", { name }),

    // Update user email
    updateEmail: (email: string) => axiosInstance.put("/auth/email", { email }),
  },

  // Teams endpoints
  teams: {
    // Get all teams
    getAllTeams: () => axiosInstance.get("/teams"),

    // Get team by ID
    getTeamById: (id: number) => axiosInstance.get(`/teams/${id}`),

    // Get teams by conference
    getTeamsByConference: (conference: "Eastern" | "Western") =>
      axiosInstance.get(`/teams/conference/${conference}`),
  },

  // Rounds endpoints
  rounds: {
    // Get all rounds
    getAllRounds: () => axiosInstance.get("/rounds"),

    // Get round by ID
    getRoundById: (id: number) => axiosInstance.get(`/rounds/${id}`),

    // Get rounds by season
    getRoundsBySeason: (season: string) =>
      axiosInstance.get(`/rounds/season/${season}`),

    // Get current active round
    getCurrentRound: (season: string) =>
      axiosInstance.get(`/rounds/current?season=${season}`),

    // Create a round
    createRound: (data: {
      name: string;
      number: number;
      season: string;
      matchups: Array<{
        homeTeamId: number;
        awayTeamId: number;
      }>;
    }) => axiosInstance.post("/rounds", data),
  },

  // Series endpoints
  series: {
    // Get all series
    getAllSeries: () => axiosInstance.get("/series"),

    // Get series by ID
    getSeriesById: (id: number) => axiosInstance.get(`/series/${id}`),

    // Get series by round
    getSeriesByRound: (roundId: number) =>
      axiosInstance.get(`/series/round/${roundId}`),

    // Delete series
    deleteSeries: (id: number) => axiosInstance.delete(`/series/${id}`),

    // Create a series
    createSeries: (
      roundId: number,
      homeTeamId: number,
      awayTeamId: number,
      startDate: string,
    ) =>
      axiosInstance.post("/series", {
        roundId,
        homeTeamId,
        awayTeamId,
        startDate,
      }),
  },

  // Predictions endpoints
  predictions: {
    // Submit prediction
    submitPrediction: (data: {
      seriesId: number;
      predictedWinnerId: number;
      predictedGames: number;
    }) => axiosInstance.post("/predictions", data),

    // Get user predictions
    getUserPredictions: () => axiosInstance.get("/predictions/user"),

    // Get all users' predictions
    getAllUsersPredictions: () => axiosInstance.get("/predictions/all"),

    // Get unpredicted series
    getUnpredictedSeries: () => axiosInstance.get("/predictions/unpredicted"),

    // Get leaderboard
    getLeaderboard: () => axiosInstance.get("/predictions/leaderboard"),
  },

  // Stanley Cup predictions endpoints
  stanleyCup: {
    // Submit Stanley Cup prediction
    submitStanleyCupPrediction: (
      season: string,
      eastTeamId: number,
      westTeamId: number,
      winningTeamId: number,
      gamesPlayed: number,
    ) =>
      axiosInstance.post("/stanley-cup", {
        season,
        eastTeamId,
        westTeamId,
        winningTeamId,
        gamesPlayed,
      }),

    // Get user's Stanley Cup prediction
    getUserStanleyCupPrediction: (season: string) =>
      axiosInstance.get(`/stanley-cup/user?season=${season}`),

    // Get all Stanley Cup predictions
    getAllStanleyCupPredictions: (season: string) =>
      axiosInstance.get(`/stanley-cup?season=${season}`),
  },

  // Admin endpoints
  admin: {
    // Get dashboard data
    getDashboardData: () => axiosInstance.get("/admin/home"),

    // Get all users
    getAllUsers: () => axiosInstance.get("/admin/users"),

    // Update user
    updateUser: (id: number, name: string, isAdmin: boolean) =>
      axiosInstance.put(`/admin/users/${id}`, { name, isAdmin }),

    // Update user points
    updateUserPoints: (id: number, points: number) =>
      axiosInstance.patch(`/admin/users/${id}/points`, { points }),

    // Delete user
    deleteUser: (id: number) => axiosInstance.delete(`/admin/users/${id}`),

    // Invite user
    inviteUser: (name: string, email: string, isAdmin: boolean) =>
      axiosInstance.post("/admin/users/invite", { name, email, isAdmin }),

    // Initialize system data
    initSystemData: (season: string) =>
      axiosInstance.post("/admin/init", { season }),

    // Create a round
    createRound: (
      name: string,
      number: number,
      startDate: string,
      endDate: string,
      season: string,
    ) =>
      axiosInstance.post("/rounds", {
        name,
        number,
        startDate,
        endDate,
        season,
      }),

    // Update a round
    updateRound: (id: number, name: string, active: boolean) =>
      axiosInstance.put(`/rounds/${id}`, { name, active }),

    // Create a series
    createSeries: (
      roundId: number,
      homeTeamId: number,
      awayTeamId: number,
      startDate: string,
    ) =>
      axiosInstance.post("/series", {
        roundId,
        homeTeamId,
        awayTeamId,
        startDate,
      }),

    // Update series results
    updateSeriesResults: (
      id: number,
      homeTeamWins: number,
      awayTeamWins: number,
      completed: boolean,
      gamesPlayed: number,
      winningTeamId?: number,
      startDate?: string,
      endDate?: string | null,
    ) =>
      axiosInstance.put(`/series/${id}`, {
        homeTeamWins,
        awayTeamWins,
        completed,
        gamesPlayed,
        winningTeamId,
        startDate,
        endDate,
      }),

    // Update user prediction
    updateUserPrediction: (
      userId: number,
      seriesId: number,
      data: {
        predictedWinnerId: number;
        predictedGames: number;
        points: number;
      },
    ) =>
      axiosInstance.patch(
        `/admin/users/${userId}/predictions/${seriesId}`,
        data,
      ),

    // Create user prediction
    createUserPrediction: (data: {
      userId: number;
      seriesId: number;
      predictedWinnerId: number;
      predictedGames: number;
    }) => axiosInstance.post("/admin/users/predictions", data),
  },
};

export default api;
