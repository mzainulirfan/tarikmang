"use client";

import type { Team } from "@/types/game";
import { generateQuestion } from "@/lib/game/questions";
import { determineWinner } from "@/lib/game/scoring";
import { createRoomState, type RoomConfig, type RoomState } from "./state";

export type { RoomConfig, RoomState };
export { createRoomState };

const STORAGE_PREFIX = "tarikmang:room:";

function storageKey(code: string) {
  return `${STORAGE_PREFIX}${code}`;
}

function isRemote(): boolean {
  return typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// local only helpers
function saveLocal(state: RoomState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(state.code), JSON.stringify(state));
  try {
    const ch = new BroadcastChannel(`tarikmang:${state.code}`);
    ch.postMessage({ type: "ROOM_UPDATED", state });
    ch.close();
  } catch {}
}

function loadLocal(code: string): RoomState | null {
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

export async function saveRoom(state: RoomState): Promise<void> {
  // always save local as cache + broadcast
  saveLocal(state);
  if (!isRemote()) return;
  try {
    await fetch(`/api/game/${state.code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
  } catch {}
}

export async function loadRoom(code: string): Promise<RoomState | null> {
  if (!isRemote()) return loadLocal(code);
  try {
    const res = await fetch(`/api/game/${code}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.state) {
        // cache locally
        saveLocal(json.state);
        if (Date.now() > json.state.expiresAt) return null;
        return json.state as RoomState;
      }
    }
  } catch {}
  // fallback local
  return loadLocal(code);
}

// sync versions for fallback / host that hasn't migrated yet
export function loadRoomSync(code: string): RoomState | null {
  return loadLocal(code);
}

export async function joinTeam(code: string, team: Team, token: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room) return null;
  if (room.players[team].token && room.players[team].token !== token) return null;
  const other: Team = team === "A" ? "B" : "A";
  if (room.players[other].token === token) return room;
  room.players[team] = { token, connected: true };
  if (room.players.A.token && room.players.B.token) room.status = "ready";
  await saveRoom(room);
  return room;
}

export async function leaveTeam(code: string, team: Team): Promise<void> {
  const room = await loadRoom(code);
  if (!room) return;
  room.players[team] = { token: null, connected: false };
  room.status = "waiting";
  await saveRoom(room);
}

export async function startCountdown(code: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room) return null;
  if (!room.players.A.token || !room.players.B.token) return null;
  room.status = "countdown";
  await saveRoom(room);
  return room;
}

export async function startRound(code: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room) return null;
  const q = generateQuestion(room.config.difficulty, room.config.operation);
  room.question = q;
  room.questionStartedAt = Date.now();
  room.answers = { A: null, B: null };
  room.status = "playing";
  room.lastResult = null;
  await saveRoom(room);
  return room;
}

export async function submitAnswer(code: string, team: Team, answer: number, token: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room || room.status !== "playing" || !room.question || !room.questionStartedAt) return null;
  if (room.players[team].token !== token) return null;
  // allow retry if previous answer was wrong — only block if already correct
  if (room.answers[team]?.isCorrect) return room;
  const now = Date.now();
  const responseMs = now - room.questionStartedAt;
  if (responseMs > room.config.durationSec * 1000) return room;
  const isCorrect = answer === room.question.answer;

  // if correct → langsung menang & next question (tanpa tunggu lawan)
  if (isCorrect) {
    room.answers[team] = { answer, isCorrect, responseMs };
    // simpan dulu sebelum resolve agar responseMs tercatat
    await saveRoom(room);
    return resolveRoundImmediate(code, team);
  }

  // if wrong → tetap playing, boleh retry (baik A maupun B)
  room.answers[team] = { answer, isCorrect, responseMs };
  await saveRoom(room);
  // jangan resolve, biarkan kedua tim bisa coba lagi sampai ada yang benar atau timeout
  return room;
}

// immediate win when someone answers correctly
async function resolveRoundImmediate(code: string, winningTeam: Team): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room) return null;
  if (winningTeam === "A") room.scoreA += 1;
  if (winningTeam === "B") room.scoreB += 1;
  const ans = room.answers[winningTeam];
  const text = `KUBU ${winningTeam} MENARIK! ${ans ? `(${(ans.responseMs / 1000).toFixed(1)}s)` : ""}`;
  room.lastResult = { winner: winningTeam, text };
  room.status = "result";
  await saveRoom(room);
  return room;
}

export async function resolveRound(code: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
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
  await saveRoom(room);
  return room;
}

export async function handleTimeout(code: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room || room.status !== "playing") return null;
  return resolveRound(code);
}

export async function nextRoundOrFinish(code: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room) return null;
  if (room.status !== "result") return room;
  if (room.round >= room.config.totalRounds) {
    if (room.scoreA === room.scoreB) {
      room.suddenDeath = true;
      room.round += 1;
      room.question = null;
      room.questionStartedAt = null;
      room.answers = { A: null, B: null };
      room.lastResult = { winner: "draw", text: "SUDDEN DEATH! Ronde penentuan — yang benar & tercepat langsung menang!" };
      room.status = "countdown";
      await saveRoom(room);
      return room;
    }
    if (room.suddenDeath && room.lastResult?.winner === "draw") {
      room.round += 1;
      room.question = null;
      room.questionStartedAt = null;
      room.answers = { A: null, B: null };
      room.lastResult = { winner: "draw", text: "SUDDEN DEATH berlanjut!" };
      room.status = "countdown";
      await saveRoom(room);
      return room;
    }
    room.status = "finished";
    await saveRoom(room);
    return room;
  }
  if (room.suddenDeath && room.lastResult?.winner !== "draw") {
    room.status = "finished";
    await saveRoom(room);
    return room;
  }
  room.round += 1;
  room.question = null;
  room.questionStartedAt = null;
  room.answers = { A: null, B: null };
  room.lastResult = null;
  room.status = "countdown";
  await saveRoom(room);
  return room;
}

export async function resetRoom(code: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
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
  await saveRoom(room);
  return room;
}

// keep sync wrappers for pages that still use sync (fallback)
export { saveLocal as saveRoomSync, loadLocal as loadRoomSyncAlias };
