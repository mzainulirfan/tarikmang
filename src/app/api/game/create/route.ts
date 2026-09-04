import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { createRoomState } from "@/lib/room/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { difficulty = "mudah", operation = "campuran", totalRounds = 10, durationSec = 10 } = body;

  const supa = getServiceClient();
  // generate unique code
  let code = "";
  let attempts = 0;
  const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  while (attempts < 10) {
    code = Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
    if (supa) {
      const { data } = await supa.from("game_rooms").select("code").eq("code", code).single();
      if (!data) break;
    } else break;
    attempts++;
  }

  const state = createRoomState(code, { difficulty, operation, totalRounds, durationSec });

  if (supa) {
    const payload = {
      code,
      status: state.status,
      difficulty,
      operations: operation,
      total_rounds: totalRounds,
      duration_seconds: durationSec,
      current_round: 1,
      score_a: 0,
      score_b: 0,
      question_text: JSON.stringify(state),
      sudden_death: false,
      expires_at: new Date(state.expiresAt).toISOString(),
    };
    const { error } = await supa.from("game_rooms").insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code, state });
}
