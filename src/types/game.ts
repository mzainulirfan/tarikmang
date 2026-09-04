export type Team = "A" | "B";
export type GameStatus = "waiting" | "ready" | "countdown" | "playing" | "result" | "finished";

export type Difficulty = "mudah" | "sedang" | "sulit";
export type Operation = "penjumlahan" | "pengurangan" | "perkalian" | "pembagian" | "campuran";

export type Player = {
  team: Team;
  playerToken: string;
  connected: boolean;
  ready: boolean;
};

export type GameState = {
  roomCode: string;
  status: GameStatus;
  round: number;
  totalRounds: number;
  scoreA: number;
  scoreB: number;
  questionId: string;
  questionStartedAt: number;
  questionDuration: number; // ms
  answeredA: boolean;
  answeredB: boolean;
};

export type Question = {
  id: string;
  text: string;
  answer: number;
  options: number[];
  operation: Operation;
  difficulty: Difficulty;
};

export type AnswerRecord = {
  team: Team;
  answer: number;
  isCorrect: boolean;
  answeredAt: number; // server timestamp
  responseMs: number;
};

export type RoundResult = {
  round: number;
  winner: Team | "draw";
  correctA: boolean;
  correctB: boolean;
  responseMsA: number | null;
  responseMsB: number | null;
};
