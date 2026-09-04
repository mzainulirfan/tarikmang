"use client";

import type { Difficulty, Operation, Question, Team } from "@/types/game";
import { generateQuestion } from "@/lib/game/questions";
import { determineWinner } from "@/lib/game/scoring";

export type RoomConfig = {
  difficulty: Difficulty;
  operation: Operation;
  totalRounds: number;
  durationSec: number;
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
  answers: Record<Team, { answer: number; isCorrect: boolean; responseMs: number } | null>;
  lastResult: { winner: Team | "draw"; text: string } | null;
  suddenDeath: boolean;
  createdAt: number;
  expiresAt: number;
};

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = "tarikmang:room:";

function storageKey(code: string) {
  return `${STORAGE_PREFIX}${code}`;
}

export function createRoomState(code: string, config: RoomConfig): RoomState {
  const now = Date.now();
  return {
    code,
    config,
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
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
  };
}

export function saveRoom(state: RoomState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(state.code), JSON.stringify(state));
  // broadcast
  try {
    const ch = new BroadcastChannel(`tarikmang:${state.code}`);
    ch.postMessage({ type: "ROOM_UPDATED", state });
    ch.close();
  } catch {}
}

export function loadRoom(code: string): RoomState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey(code));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RoomState;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function joinTeam(code: string, team: Team, token: string): RoomState | null {
  const room = loadRoom(code);
  if (!room) return null;
  if (room.players[team].token && room.players[team].token !== token) return null; // taken
  // also prevent same token joining both teams
  const other: Team = team === "A" ? "B" : "A";
  if (room.players[other].token === token) return room; // already joined other side
  room.players[team] = { token, connected: true };
  // if both joined -> ready
  if (room.players.A.token && room.players.B.token) room.status = "ready";
  saveRoom(room);
  return room;
}

export function leaveTeam(code: string, team: Team) {
  const room = loadRoom(code);
  if (!room) return;
  room.players[team] = { token: null, connected: false };
  room.status = "waiting";
  saveRoom(room);
}

export function startCountdown(code: string) {
  const room = loadRoom(code);
  if (!room) return null;
  if (!room.players.A.token || !room.players.B.token) return null;
  room.status = "countdown";
  saveRoom(room);
  return room;
}

export function startRound(code: string) {
  const room = loadRoom(code);
  if (!room) return null;
  const q = generateQuestion(room.config.difficulty, room.config.operation);
  room.question = q;
  room.questionStartedAt = Date.now();
  room.answers = { A: null, B: null };
  room.status = "playing";
  room.lastResult = null;
  saveRoom(room);
  return room;
}

export function submitAnswer(code: string, team: Team, answer: number, token: string): RoomState | null {
  const room = loadRoom(code);
  if (!room || room.status !== "playing" || !room.question || !room.questionStartedAt) return null;
  if (room.players[team].token !== token) return null; // invalid token
  if (room.answers[team]) return room; // anti double submit PRD #34
  const now = Date.now();
  const responseMs = now - room.questionStartedAt;
  if (responseMs > room.config.durationSec * 1000) return room; // timeout ignored
  const isCorrect = answer === room.question.answer;
  room.answers[team] = { answer, isCorrect, responseMs };
  saveRoom(room);

  // if both answered -> resolve immediately
  if (room.answers.A && room.answers.B) {
    return resolveRound(code);
  }
  return room;
}

export function resolveRound(code: string): RoomState | null {
  const room = loadRoom(code);
  if (!room || !room.question) return null;
  const a = room.answers.A;
  const b = room.answers.B;

  const winner = determineWinner({
    answeredA: !!a,
    answeredB: !!b,
    isCorrectA: !!a?.isCorrect,
    isCorrectB: !!b?.isCorrect,
    responseMsA: a?.responseMs ?? null,
    responseMsB: b?.responseMs ?? null,
  });

  if (winner === "A") room.scoreA += 1;
  if (winner === "B") room.scoreB += 1;

  const text =
    winner === "A"
      ? `KUBU A MENARIK! ${a ? `(${(a.responseMs / 1000).toFixed(1)}s)` : ""}`
      : winner === "B"
        ? `KUBU B MENARIK! ${b ? `(${(b.responseMs / 1000).toFixed(1)}s)` : ""}`
        : a?.isCorrect && b?.isCorrect
          ? "Seri! Waktu sama"
          : "Seri — tidak ada tarikan";

  room.lastResult = { winner, text };
  room.status = "result";
  saveRoom(room);
  return room;
}

export function handleTimeout(code: string) {
  const room = loadRoom(code);
  if (!room || room.status !== "playing") return null;
  return resolveRound(code);
}

export function nextRoundOrFinish(code: string): RoomState | null {
  const room = loadRoom(code);
  if (!room) return null;
  if (room.status !== "result") return room;
  // Sudden Death PRD #18: if score tied after final round, add extra round until winner
  if (room.round >= room.config.totalRounds) {
    if (room.scoreA === room.scoreB) {
      room.suddenDeath = true;
      room.round += 1;
      room.question = null;
      room.questionStartedAt = null;
      room.answers = { A: null, B: null };
      room.lastResult = { winner: "draw", text: "SUDDEN DEATH! Ronde penentuan — yang benar & tercepat langsung menang!" };
      room.status = "countdown";
      saveRoom(room);
      return room;
    }
    // if suddenDeath round already played and still draw -> keep sudden death until winner decides
    if (room.suddenDeath && room.lastResult?.winner === "draw") {
      room.round += 1;
      room.question = null;
      room.questionStartedAt = null;
      room.answers = { A: null, B: null };
      room.lastResult = { winner: "draw", text: "SUDDEN DEATH berlanjut!" };
      room.status = "countdown";
      saveRoom(room);
      return room;
    }
    room.status = "finished";
    saveRoom(room);
    return room;
  }
  // suddenDeath win check: if we were in suddenDeath and now have winner, finish
  if (room.suddenDeath && room.lastResult?.winner !== "draw") {
    room.status = "finished";
    saveRoom(room);
    return room;
  }
  room.round += 1;
  room.question = null;
  room.questionStartedAt = null;
  room.answers = { A: null, B: null };
  room.lastResult = null;
  room.status = "countdown";
  saveRoom(room);
  return room;
}

export function resetRoom(code: string) {
  const room = loadRoom(code);
  if (!room) return null;
  room.status = "waiting";
  room.round = 1;
  room.scoreA = 0;
  room.scoreB = 0;
  room.question = null;
  room.questionStartedAt = null;
  room.answers = { A: null, B: null };
  room.lastResult = null;
  room.suddenDeath = false;
  saveRoom(room);
  return room;
}
