import type { Difficulty, Operation, Question, Team } from "@/types/game";
import { generateQuestion } from "@/lib/game/questions";

export type RoomConfig = {
  difficulty: Difficulty;
  operation: Operation;
  totalRounds: number;
  durationSec: number;
  source?: "auto" | "bank";
  bankId?: string | null;
};

export type RoomState = {
  code: string;
  config: RoomConfig;
  status: "waiting" | "ready" | "countdown" | "playing" | "result" | "finished";
  round: number;
  scoreA: number;
  scoreB: number;
  question: Question | null;
  questionStartedAt: number | null;
  players: Record<Team, { token: string | null; connected: boolean }>;
  answers: Record<Team, { answer: string | number; isCorrect: boolean; responseMs: number } | null>;
  lastResult: { winner: Team | "draw"; text: string } | null;
  suddenDeath: boolean;
  usedQuestionIds: string[];
  customQuestions?: { id: string; question: string; options: string[]; correct_answer: string }[];
  createdAt: number;
  expiresAt: number;
};

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export function createRoomState(code: string, config: RoomConfig): RoomState {
  const now = Date.now();
  return {
    code,
    config: { source: "auto", bankId: null, ...config },
    status: "waiting",
    round: 1,
    scoreA: 0,
    scoreB: 0,
    question: null,
    questionStartedAt: null,
    players: { A: { token: null, connected: false }, B: { token: null, connected: false } },
    answers: { A: null, B: null },
    lastResult: null,
    suddenDeath: false,
    usedQuestionIds: [],
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
  };
}

export { generateQuestion };
