export interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  conference: string;
  division: string;
  active: boolean;
}

export interface Round {
  id: number;
  name: string;
  number: number;
  season: string;
  active: boolean;
}

export interface Series {
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

export interface Prediction {
  id: number;
  userId: number;
  seriesId: number;
  predictedWinnerId: number;
  predictedGames: number;
  points: number;
  createdAt: string;
  updatedAt: string;
  User: {
    id: number;
    name: string;
    email: string;
  };
  Series: Series;
  PredictedWinner: Team;
}
