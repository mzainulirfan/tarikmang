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

async function getNextQuestion(room: RoomState): Promise<import("@/types/game").Question> {
  if (room.config.source === "bank" && room.config.bankId) {
    // 1) jika room sudah embed customQuestions (opsi cepat lokal) → pakai itu
    const embedded = (room as any).customQuestions as { id: string; question: string; options: string[]; correct_answer: string }[] | undefined;
    if (embedded && embedded.length > 0) {
      const unused = embedded.filter((q) => !(room.usedQuestionIds || []).includes(q.id));
      const pool = unused.length > 0 ? unused : embedded;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const opts = [...pick.options].sort(() => Math.random() - 0.5);
      return {
        id: pick.id,
        text: pick.question,
        answer: pick.correct_answer,
        options: opts,
        operation: "campuran",
        difficulty: "mudah",
        bankId: room.config.bankId,
      };
    }
    // 2) coba Supabase
    try {
      const exclude = (room.usedQuestionIds || []).join(",");
      const res = await fetch(`/api/banks/next?bank_id=${room.config.bankId}&exclude=${encodeURIComponent(exclude)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const q = json.question;
        if (q) {
          const opts = [...q.options].sort(() => Math.random() - 0.5);
          return {
            id: q.id,
            text: q.question,
            answer: q.correct_answer,
            options: opts,
            operation: "campuran",
            difficulty: (q.difficulty as any) || "mudah",
            bankId: room.config.bankId,
          };
        }
      }
    } catch {}
    // 3) fallback local
    try {
      const { getRandomQuestion } = await import("@/lib/banks/local");
      const q = getRandomQuestion(room.config.bankId, room.usedQuestionIds || []);
      if (q) {
        const opts = [...q.options].sort(() => Math.random() - 0.5);
        return {
          id: q.id,
          text: q.question,
          answer: q.correct_answer,
          options: opts,
          operation: "campuran",
          difficulty: "mudah",
          bankId: room.config.bankId,
        };
      }
    } catch {}
  }
  return generateQuestion(room.config.difficulty, room.config.operation);
}

export async function startRound(code: string): Promise<RoomState | null> {
  const room = await loadRoom(code);
  if (!room) return null;
  const q = await getNextQuestion(room);
  room.question = q;
  if (q.id) room.usedQuestionIds = [...(room.usedQuestionIds || []), q.id];
  room.questionStartedAt = Date.now();
  room.answers = { A: null, B: null };
  room.status = "playing";
  room.lastResult = null;
  await saveRoom(room);
  return room;
}

export async function submitAnswer(code: string, team: Team, answer: string | number, token: string): Promise<RoomState | null> {
  // jika remote (Supabase) → pakai server timestamp biar fair barengan pencet
  if (isRemote()) {
    try {
      const res = await fetch(`/api/game/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, answer, token }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.state) {
        saveLocal(json.state as RoomState);
        return json.state as RoomState;
      }
      // jika 409 time expired atau sudah correct, tetap refresh dari server
      if (json.state) return json.state as RoomState;
      // fallback load
      return loadRoom(code);
    } catch {
      // fallback local jika API gagal
    }
  }

  // fallback local (untuk dev tanpa Supabase / offline)
  const room = await loadRoom(code);
  if (!room || room.status !== "playing" || !room.question || !room.questionStartedAt) return null;
  if (room.players[team].token !== token) return null;
  if (room.answers[team]?.isCorrect) return room;
  const now = Date.now();
  const responseMs = now - room.questionStartedAt;
  if (responseMs > room.config.durationSec * 1000) return room;
  const isCorrect = answer === room.question.answer;
  if (isCorrect) {
    room.answers[team] = { answer, isCorrect, responseMs };
    await saveRoom(room);
    return resolveRoundImmediate(code, team);
  }
  room.answers[team] = { answer, isCorrect, responseMs };
  await saveRoom(room);
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
      const q = await getNextQuestion(room);
      if (q.id) room.usedQuestionIds = [...(room.usedQuestionIds || []), q.id];
      room.question = q;
      room.questionStartedAt = Date.now();
      room.answers = { A: null, B: null };
      room.lastResult = { winner: "draw", text: "SUDDEN DEATH! Ronde penentuan — yang benar & tercepat langsung menang!" };
      room.status = "playing";
      await saveRoom(room);
      return room;
    }
    if (room.suddenDeath && room.lastResult?.winner === "draw") {
      room.round += 1;
      const q = await getNextQuestion(room);
      if (q.id) room.usedQuestionIds = [...(room.usedQuestionIds || []), q.id];
      room.question = q;
      room.questionStartedAt = Date.now();
      room.answers = { A: null, B: null };
      room.lastResult = { winner: "draw", text: "SUDDEN DEATH berlanjut!" };
      room.status = "playing";
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
  const q = await getNextQuestion(room);
  if (q.id) room.usedQuestionIds = [...(room.usedQuestionIds || []), q.id];
  room.question = q;
  room.questionStartedAt = Date.now();
  room.answers = { A: null, B: null };
  room.lastResult = null;
  room.status = "playing";
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
  room.usedQuestionIds = [];
  await saveRoom(room);
  return room;
}

// keep sync wrappers for pages that still use sync (fallback)
export { saveLocal as saveRoomSync, loadLocal as loadRoomSyncAlias };
