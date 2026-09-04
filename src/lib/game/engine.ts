import type { GameState, Question, Difficulty, Operation, RoundResult, Team } from "@/types/game";
import { generateQuestion } from "./questions";
import { determineWinner, getGameWinner } from "./scoring";

export type EngineConfig = {
  totalRounds: number;
  questionDuration: number; // ms
  difficulty: Difficulty;
  operation: Operation;
};

export const DEFAULT_CONFIG: EngineConfig = {
  totalRounds: 10,
  questionDuration: 10_000,
  difficulty: "mudah",
  operation: "campuran",
};

export function createInitialState(roomCode: string, config: EngineConfig = DEFAULT_CONFIG): GameState {
  return {
    roomCode,
    status: "waiting",
    round: 1,
    totalRounds: config.totalRounds,
    scoreA: 0,
    scoreB: 0,
    questionId: "",
    questionStartedAt: 0,
    questionDuration: config.questionDuration,
    answeredA: false,
    answeredB: false,
  };
}

export function startRound(state: GameState, question: Question, now = Date.now()): GameState {
  return {
    ...state,
    status: "playing",
    questionId: question.id,
    questionStartedAt: now,
    answeredA: false,
    answeredB: false,
  };
}

export function makeEngine(config: EngineConfig = DEFAULT_CONFIG) {
  let state: GameState = createInitialState("LOCAL", config);
  let currentQuestion: Question | null = null;
  let answers: Map<Team, { answer: number; isCorrect: boolean; responseMs: number }> = new Map();

  function generateNextQuestion(): Question {
    currentQuestion = generateQuestion(config.difficulty, config.operation);
    return currentQuestion;
  }

  function getQuestion(): Question | null {
    return currentQuestion;
  }

  function getState(): GameState {
    return state;
  }

  function startGame(roomCode = "LOCAL"): void {
    state = createInitialState(roomCode, config);
    answers.clear();
    const q = generateNextQuestion();
    state = startRound(state, q);
  }

  function submitAnswer(team: Team, answer: number, now = Date.now()): boolean {
    if (state.status !== "playing") return false;
    if (state.answeredA && team === "A") return false;
    if (state.answeredB && team === "B") return false;
    if (!currentQuestion) return false;

    const responseMs = now - state.questionStartedAt;
    const isCorrect = answer === currentQuestion.answer;

    // timeout -> ignore after duration
    if (responseMs > state.questionDuration) return false;

    answers.set(team, { answer, isCorrect, responseMs });
    if (team === "A") state = { ...state, answeredA: true };
    if (team === "B") state = { ...state, answeredB: true };
    return true;
  }

  function resolveRound(): RoundResult & { nextScoreA: number; nextScoreB: number } {
    if (!currentQuestion) throw new Error("No question");
    const a = answers.get("A");
    const b = answers.get("B");

    const winner = determineWinner({
      answeredA: !!a,
      answeredB: !!b,
      isCorrectA: !!a?.isCorrect,
      isCorrectB: !!b?.isCorrect,
      responseMsA: a?.responseMs ?? null,
      responseMsB: b?.responseMs ?? null,
    });

    let nextScoreA = state.scoreA;
    let nextScoreB = state.scoreB;
    if (winner === "A") nextScoreA += 1;
    if (winner === "B") nextScoreB += 1;

    const result: RoundResult = {
      round: state.round,
      winner,
      correctA: !!a?.isCorrect,
      correctB: !!b?.isCorrect,
      responseMsA: a?.responseMs ?? null,
      responseMsB: b?.responseMs ?? null,
    };

    return { ...result, nextScoreA, nextScoreB };
  }

  function commitRoundResult(result: RoundResult): void {
    let nextScoreA = state.scoreA;
    let nextScoreB = state.scoreB;
    if (result.winner === "A") nextScoreA += 1;
    if (result.winner === "B") nextScoreB += 1;

    const isLast = state.round >= state.totalRounds;

    if (isLast) {
      state = { ...state, scoreA: nextScoreA, scoreB: nextScoreB, status: "finished" };
    } else {
      state = { ...state, scoreA: nextScoreA, scoreB: nextScoreB, round: state.round + 1 };
      answers.clear();
      const q = generateNextQuestion();
      state = startRound(state, q);
    }
  }

  function timeoutRound(): RoundResult {
    const r = resolveRound();
    commitRoundResult(r);
    return r;
  }

  function getGameWinnerResult(): Team | "draw" {
    return getGameWinner(state.scoreA, state.scoreB);
  }

  return {
    getState,
    getQuestion,
    generateNextQuestion,
    startGame,
    submitAnswer,
    resolveRound,
    commitRoundResult,
    timeoutRound,
    getGameWinnerResult,
  };
}
