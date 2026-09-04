import type { Team, RoundResult } from "@/types/game";

/**
 * PRD #13 rule:
 * correct > incorrect
 * if both correct -> fastest wins
 * if only one correct -> that team wins
 * if both incorrect or timeout -> draw
 */
export function determineWinner(params: {
  answeredA: boolean;
  answeredB: boolean;
  isCorrectA: boolean;
  isCorrectB: boolean;
  responseMsA: number | null;
  responseMsB: number | null;
}): RoundResult["winner"] {
  const { answeredA, answeredB, isCorrectA, isCorrectB, responseMsA, responseMsB } = params;

  const correctA = answeredA && isCorrectA;
  const correctB = answeredB && isCorrectB;

  if (correctA && !correctB) return "A";
  if (!correctA && correctB) return "B";
  if (correctA && correctB) {
    // fastest wins, use server responseMs
    if (responseMsA == null || responseMsB == null) return "draw";
    if (responseMsA < responseMsB) return "A";
    if (responseMsB < responseMsA) return "B";
    return "draw"; // equal time -> draw per PRD
  }
  // both incorrect or no answer
  return "draw";
}

export function ropePosition(scoreA: number, scoreB: number): number {
  return scoreA - scoreB; // PRD #16
}

export function clampRope(pos: number, limit = 5): number {
  return Math.max(-limit, Math.min(limit, pos));
}

export function isGameFinished(round: number, totalRounds: number): boolean {
  return round >= totalRounds;
}

export function getGameWinner(scoreA: number, scoreB: number): Team | "draw" {
  if (scoreA > scoreB) return "A";
  if (scoreB > scoreA) return "B";
  return "draw";
}
