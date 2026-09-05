import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, category = "agama", owner_token } = body;
  if (!name || !owner_token) return NextResponse.json({ error: "name, owner_token required" }, { status: 400 });

  const supa = getServiceClient();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supa
    .from("game_question_banks")
    .insert({ name, category, owner_token, is_public: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bank: data });
}
