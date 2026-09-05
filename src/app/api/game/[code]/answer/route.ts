import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const body = await req.json().catch(() => ({}));
  const { team, answer, token } = body as { team?: string; answer?: number; token?: string };
  if (!team || typeof answer !== "number" || !token) {
    return NextResponse.json({ error: "team, answer, token required" }, { status: 400 });
  }
  if (team !== "A" && team !== "B") return NextResponse.json({ error: "team must be A or B" }, { status: 400 });

  const supa = getServiceClient();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // load room
  const { data: row, error: selErr } = await supa.from("game_rooms").select("*").eq("code", upper).single();
  if (selErr || !row) return NextResponse.json({ error: "Room not found", details: selErr?.message }, { status: 404 });

  let state: any;
  try {
    state = row.question_text ? JSON.parse(row.question_text) : null;
  } catch {
    return NextResponse.json({ error: "Invalid state JSON" }, { status: 500 });
  }
  if (!state) return NextResponse.json({ error: "State empty" }, { status: 500 });
  if (Date.now() > state.expiresAt) return NextResponse.json({ error: "Room expired" }, { status: 410 });
  if (state.status !== "playing" || !state.question || !state.questionStartedAt) {
    return NextResponse.json({ error: "Not in playing state" }, { status: 409 });
  }
  if (state.players[team]?.token !== token) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  if (state.answers[team]?.isCorrect) return NextResponse.json({ state }); // already correct, ignore

  const serverNow = Date.now();
  const responseMs = serverNow - state.questionStartedAt;
  if (responseMs > state.config.durationSec * 1000) {
    return NextResponse.json({ error: "Time expired", state }, { status: 409 });
  }
  const isCorrect = answer === state.question.answer;
  state.answers[team] = { answer, isCorrect, responseMs };

  // if correct → immediate win (fair server time)
  if (isCorrect) {
    if (team === "A") state.scoreA += 1;
    if (team === "B") state.scoreB += 1;
    state.lastResult = { winner: team, text: `KUBU ${team} MENARIK! (${(responseMs / 1000).toFixed(1)}s)` };
    state.status = "result";
  } else {
    // wrong → stay playing, allow retry (don't change status)
    // keep lastResult null so display doesn't trigger nextRound yet
  }

  const payload = {
    code: upper,
    status: state.status,
    difficulty: state.config.difficulty,
    operations: state.config.operation,
    total_rounds: state.config.totalRounds,
    duration_seconds: state.config.durationSec,
    current_round: state.round,
    score_a: state.scoreA,
    score_b: state.scoreB,
    question_text: JSON.stringify(state),
    question_started_at: state.questionStartedAt,
    sudden_death: !!state.suddenDeath,
    expires_at: new Date(state.expiresAt).toISOString(),
  };
  const { error: upErr } = await supa.from("game_rooms").upsert(payload, { onConflict: "code" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // if correct, client will poll and see result → nextRound will be triggered by display's effect (0ms)
  return NextResponse.json({ state, responseMs, isCorrect });
}
