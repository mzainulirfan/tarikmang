import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const supa = getServiceClient();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supa.from("game_rooms").select("*").eq("code", upper).single();
  if (error || !data) return NextResponse.json({ error: "Room not found", details: error?.message }, { status: 404 });

  // parse state from question_text
  try {
    const state = data.question_text ? JSON.parse(data.question_text) : null;
    if (!state) return NextResponse.json({ error: "Invalid state" }, { status: 500 });
    // check expiry
    if (state.expiresAt && Date.now() > state.expiresAt) {
      return NextResponse.json({ error: "Room expired" }, { status: 410 });
    }
    return NextResponse.json({ state });
  } catch (e) {
    return NextResponse.json({ error: "Parse error", details: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const body = await req.json().catch(() => ({}));
  const state = body.state;
  if (!state || state.code !== upper) return NextResponse.json({ error: "Invalid state or code mismatch" }, { status: 400 });

  const supa = getServiceClient();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // upsert via question_text JSON, also sync indexed columns for convenience
  const payload = {
    code: upper,
    status: state.status,
    difficulty: state.config?.difficulty || "mudah",
    operations: state.config?.operation || "campuran",
    total_rounds: state.config?.totalRounds || 10,
    duration_seconds: state.config?.durationSec || 10,
    current_round: state.round || 1,
    score_a: state.scoreA || 0,
    score_b: state.scoreB || 0,
    question_text: JSON.stringify(state),
    question_started_at: state.questionStartedAt || null,
    sudden_death: !!state.suddenDeath,
    expires_at: state.expiresAt ? new Date(state.expiresAt).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const { error } = await supa.from("game_rooms").upsert(payload, { onConflict: "code" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
